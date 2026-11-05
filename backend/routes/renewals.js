const express = require('express');
const router = express.Router();
const { pool } = require('../db/sqlite-pool');
const auditLog = require('../middleware/auditLogger');
const { authenticate } = require('../middleware/authMiddleware');
const allowedRoles = require('../middleware/roleBasedAccess');

// GET /api/renewals - Solo ver renovaciones de su agencia
// Query params: status=pending|completed, limit=50, offset=0, sort=due_date:asc
router.get('/', authenticate, allowedRoles(['admin', 'agent', 'viewer']), async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 500);
    const offset = Math.max(parseInt(req.query.offset) || 0, 0);
    const status = (req.query.status || '').trim();
    const sort = (req.query.sort || 'due_date:asc').trim();

    // Parse sort parameter
    const [sortField, sortDir] = sort.split(':');
    const validSortFields = ['due_date', 'status', 'created_at'];
    const sortColumn = validSortFields.includes(sortField) ? sortField : 'due_date';
    const sortDirection = sortDir === 'asc' ? 'ASC' : 'DESC';

    // Build WHERE clause
    let whereConditions = ['r.agency_id = $1'];
    let params = [req.user.agencyId];

    if (status) {
      whereConditions.push(`r.status = $${params.length + 1}`);
      params.push(status);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as count FROM renewals r WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const pageParams = [...params, limit, offset];
    const result = await pool.query(
      `SELECT
         r.*,
         p.policy_number,
         p.type as policy_type,
         c.name as client_name,
         c.email as client_email
       FROM renewals r
       LEFT JOIN policies p ON r.policy_id = p.id
       LEFT JOIN clients c ON p.client_id = c.id
       WHERE ${whereClause}
       ORDER BY r.${sortColumn} ${sortDirection}
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      pageParams
    );

    res.json({
      data: result.rows,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
      pageCount: Math.ceil(total / limit),
      currentPage: Math.floor(offset / limit) + 1
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/renewals/:id - Solo admin puede actualizar
router.put('/:id', authenticate, allowedRoles(['admin', 'agent']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Verificar que la renovación pertenece a su agencia
    const renewalCheck = await pool.query(
      'SELECT * FROM renewals WHERE id = $1 AND agency_id = $2',
      [id, req.user.agencyId]
    );

    if (renewalCheck.rows.length === 0) {
      auditLog(req, 'RENEWAL_UPDATE_DENIED', { renewalId: id, userAgencyId: req.user.agencyId });
      return res.status(404).json({ error: 'Renewal not found or access denied' });
    }

    const result = await pool.query(
      `UPDATE renewals SET status = $1, updated_at = DATETIME('now') WHERE id = $2 AND agency_id = $3 RETURNING *`,
      [status, id, req.user.agencyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Renewal not found' });
    }

    auditLog(req, 'RENEWAL_UPDATED', { renewalId: id, agencyId: req.user.agencyId, status });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
