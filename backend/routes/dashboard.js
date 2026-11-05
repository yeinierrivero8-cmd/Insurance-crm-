const express = require('express');
const router = express.Router();
const { pool } = require('../db/sqlite-pool');
const { authenticate } = require('../middleware/authMiddleware');
const allowedRoles = require('../middleware/roleBasedAccess');

/**
 * GET /api/dashboard/stats
 * Get aggregated dashboard metrics for authenticated user's agency
 * Returns: KPIs, renewals summary, commissions, etc.
 * RBAC: admin, agent, viewer
 */
router.get('/stats', authenticate, allowedRoles(['admin', 'agent', 'viewer']), async (req, res) => {
  try {
    if (!req.user.agencyId) {
      return res.status(403).json({ error: 'No agency access' });
    }

    const agencyId = req.user.agencyId;
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const ninetyDaysAhead = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // 1. Total active clients
    const clientsResult = await pool.query(
      `SELECT COUNT(*) as count FROM clients
       WHERE agency_id = $1 AND deleted_at IS NULL AND status != 'inactive'`,
      [agencyId]
    );
    const totalClients = parseInt(clientsResult.rows[0].count) || 0;

    // 2. Active policies count
    const policiesResult = await pool.query(
      `SELECT COUNT(*) as count FROM policies
       WHERE agency_id = $1 AND status = 'active' AND expiry_date > $2`,
      [agencyId, today]
    );
    const activePolicies = parseInt(policiesResult.rows[0].count) || 0;

    // 3. Renewals within next 30 days
    const renewalsResult = await pool.query(
      `SELECT COUNT(*) as count FROM renewals
       WHERE agency_id = $1 AND status = 'pending'
       AND due_date >= $2 AND due_date <= $3`,
      [agencyId, today, thirtyDaysAgo]
    );
    const pendingRenewals = parseInt(renewalsResult.rows[0].count) || 0;

    // 4. Year-to-date commissions (sum)
    const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
    const commissionsResult = await pool.query(
      `SELECT COALESCE(SUM(CAST(amount as REAL)), 0) as total FROM commissions
       WHERE agency_id = $1 AND date >= $2`,
      [agencyId, yearStart]
    );
    const ytdCommissions = parseFloat(commissionsResult.rows[0].total) || 0;

    // 5. Quotes (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const quotesResult = await pool.query(
      `SELECT COUNT(*) as count FROM quotes
       WHERE agency_id = $1 AND created_at >= $2`,
      [agencyId, sevenDaysAgo]
    );
    const recentQuotes = parseInt(quotesResult.rows[0].count) || 0;

    // 6. New clients this month
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const newClientsResult = await pool.query(
      `SELECT COUNT(*) as count FROM clients
       WHERE agency_id = $1 AND created_at >= $2`,
      [agencyId, monthStart]
    );
    const newClientsThisMonth = parseInt(newClientsResult.rows[0].count) || 0;

    // 7. Expiring soon (next 90 days)
    const expiringResult = await pool.query(
      `SELECT COUNT(*) as count FROM policies
       WHERE agency_id = $1 AND status = 'active'
       AND expiry_date > $2 AND expiry_date <= $3`,
      [agencyId, today, ninetyDaysAhead]
    );
    const expiringWithin90Days = parseInt(expiringResult.rows[0].count) || 0;

    // 8. Conversion rate (quotes to policies, last month)
    const monthQuotesResult = await pool.query(
      `SELECT COUNT(*) as count FROM quotes
       WHERE agency_id = $1 AND created_at >= $2 AND status != 'rejected'`,
      [agencyId, monthStart]
    );
    const monthQuotes = parseInt(monthQuotesResult.rows[0].count) || 0;
    const conversionRate = monthQuotes > 0
      ? ((activePolicies / monthQuotes) * 100).toFixed(1)
      : 0;

    // Response
    res.json({
      metrics: {
        total_clients: totalClients,
        active_policies: activePolicies,
        pending_renewals: pendingRenewals,
        ytd_commissions: ytdCommissions.toFixed(2),
        recent_quotes: recentQuotes,
        new_clients_month: newClientsThisMonth,
        expiring_90days: expiringWithin90Days,
        conversion_rate: conversionRate
      },
      summary: {
        agency_id: agencyId,
        generated_at: new Date().toISOString(),
        date_range: {
          start: thirtyDaysAgo,
          end: today,
          future_horizon: ninetyDaysAhead
        }
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/dashboard/renewals-upcoming
 * Get list of upcoming renewals for the agency
 * Query params: days=30 (how many days ahead to look)
 */
router.get('/renewals-upcoming', authenticate, allowedRoles(['admin', 'agent', 'viewer']), async (req, res) => {
  try {
    if (!req.user.agencyId) {
      return res.status(403).json({ error: 'No agency access' });
    }

    const days = Math.min(Math.max(parseInt(req.query.days) || 30, 1), 365);
    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const result = await pool.query(
      `SELECT
        r.id, r.client_id, r.due_date, r.status, r.premium_amount,
        c.name, c.email, c.phone, c.type as insurance_type
       FROM renewals r
       JOIN clients c ON r.client_id = c.id
       WHERE r.agency_id = $1 AND r.status = 'pending'
       AND r.due_date >= $2 AND r.due_date <= $3
       ORDER BY r.due_date ASC
       LIMIT 50`,
      [req.user.agencyId, today, futureDate]
    );

    res.json({
      data: result.rows,
      count: result.rows.length,
      days_ahead: days,
      range: { start: today, end: futureDate }
    });
  } catch (error) {
    console.error('Renewals upcoming error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/dashboard/top-clients
 * Get top clients by commission or policy count
 * Query params: metric=commission|policies, limit=10
 */
router.get('/top-clients', authenticate, allowedRoles(['admin', 'agent', 'viewer']), async (req, res) => {
  try {
    if (!req.user.agencyId) {
      return res.status(403).json({ error: 'No agency access' });
    }

    const metric = req.query.metric === 'policies' ? 'policies' : 'commission';
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);

    let query, params;

    if (metric === 'commission') {
      query = `
        SELECT c.id, c.name, c.email, c.phone,
          COUNT(com.id) as commission_count,
          COALESCE(SUM(CAST(com.amount as REAL)), 0) as total_commission
        FROM clients c
        LEFT JOIN commissions com ON c.id = com.client_id
        WHERE c.agency_id = $1 AND c.deleted_at IS NULL
        GROUP BY c.id
        ORDER BY total_commission DESC
        LIMIT $2
      `;
      params = [req.user.agencyId, limit];
    } else {
      query = `
        SELECT c.id, c.name, c.email, c.phone,
          COUNT(p.id) as policy_count,
          COALESCE(SUM(CAST(p.premium as REAL)), 0) as total_premium
        FROM clients c
        LEFT JOIN policies p ON c.id = p.client_id
        WHERE c.agency_id = $1 AND c.deleted_at IS NULL
        GROUP BY c.id
        ORDER BY policy_count DESC
        LIMIT $2
      `;
      params = [req.user.agencyId, limit];
    }

    const result = await pool.query(query, params);

    res.json({
      data: result.rows,
      metric,
      limit,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Top clients error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
