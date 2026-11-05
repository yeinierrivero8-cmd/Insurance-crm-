const express = require('express');
const router = express.Router();
const { pool } = require('../db/sqlite-pool');
const auditLog = require('../middleware/auditLogger');
const { authenticate } = require('../middleware/authMiddleware');
const allowedRoles = require('../middleware/roleBasedAccess');

// GET /api/policies - Solo ver políticas de su agencia
// Query params: client_id=, type=, status=, expiry_days_left=, limit=50, offset=0, sort=
router.get('/', authenticate, allowedRoles(['admin', 'agent', 'viewer']), async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 500);
    const offset = Math.max(parseInt(req.query.offset) || 0, 0);
    const clientId = (req.query.client_id || '').trim();
    const type = (req.query.type || '').trim();
    const status = (req.query.status || '').trim();
    const expiryDaysLeft = parseInt(req.query.expiry_days_left) || null;
    const sort = (req.query.sort || 'created_at:desc').trim();

    // Parse sort parameter
    const [sortField, sortDir] = sort.split(':');
    const validSortFields = ['policy_number', 'type', 'status', 'expiry_date', 'premium', 'created_at'];
    const sortColumn = validSortFields.includes(sortField) ? sortField : 'created_at';
    const sortDirection = sortDir === 'asc' ? 'ASC' : 'DESC';

    // Build WHERE clause
    let whereConditions = ['p.agency_id = $1'];
    let params = [req.user.agencyId];

    if (clientId) {
      whereConditions.push(`p.client_id = $${params.length + 1}`);
      params.push(parseInt(clientId));
    }

    if (type) {
      whereConditions.push(`p.type = $${params.length + 1}`);
      params.push(type);
    }

    if (status) {
      whereConditions.push(`p.status = $${params.length + 1}`);
      params.push(status);
    }

    if (expiryDaysLeft !== null) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + expiryDaysLeft);
      const today = new Date().toISOString().split('T')[0];
      const expiryDate = futureDate.toISOString().split('T')[0];
      whereConditions.push(`p.expiry_date >= $${params.length + 1} AND p.expiry_date <= $${params.length + 2}`);
      params.push(today, expiryDate);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as count FROM policies p WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const pageParams = [...params, limit, offset];
    const result = await pool.query(
      `SELECT
         p.*,
         c.name as client_name,
         c.email as client_email
       FROM policies p
       LEFT JOIN clients c ON p.client_id = c.id
       WHERE ${whereClause}
       ORDER BY p.${sortColumn} ${sortDirection}
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

// GET /api/policies/:id - Solo si es de su agencia
router.get('/:id', authenticate, allowedRoles(['admin', 'agent', 'viewer']), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM policies WHERE id = $1 AND agency_id = $2',
      [id, req.user.agencyId]
    );

    if (result.rows.length === 0) {
      auditLog(req, 'POLICY_ACCESS_DENIED', { policyId: id, userAgencyId: req.user.agencyId });
      return res.status(404).json({ error: 'Policy not found or access denied' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/policies - Solo admin puede crear
router.post('/', authenticate, allowedRoles(['admin']), async (req, res) => {
  try {
    const { clientId, type, policyNumber, premium, expiryDate } = req.body;

    if (!clientId || !type || !policyNumber) {
      return res.status(400).json({ error: 'clientId, type, and policyNumber required' });
    }

    // Verificar que el cliente pertenece a su agencia
    const clientCheck = await pool.query(
      'SELECT * FROM clients WHERE id = $1 AND agency_id = $2',
      [clientId, req.user.agencyId]
    );

    if (clientCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Client not found or access denied' });
    }

    const result = await pool.query(
      `INSERT INTO policies (client_id, type, policy_number, premium, end_date, agency_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [clientId, type, policyNumber, premium, expiryDate, req.user.agencyId, 'active']
    );

    auditLog(req, 'POLICY_CREATED', { policyId: result.rows[0].id, clientId, type, agencyId: req.user.agencyId });
    res.status(201).json(result.rows[0]);
  } catch (error) {
    auditLog(req, 'POLICY_CREATE_FAILED', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
