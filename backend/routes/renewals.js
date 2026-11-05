const express = require('express');
const router = express.Router();
const { pool } = require('../db/sqlite-pool');
const auditLog = require('../middleware/auditLogger');
const { authenticate } = require('../middleware/authMiddleware');
const allowedRoles = require('../middleware/roleBasedAccess');

// GET /api/renewals - Solo ver renovaciones de su agencia
router.get('/', authenticate, allowedRoles(['admin', 'agent', 'viewer']), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, p.policy_number, c.name as client_name
       FROM renewals r
       JOIN policies p ON r.policy_id = p.id
       JOIN clients c ON p.client_id = c.id
       WHERE r.agency_id = $1
       ORDER BY r.due_date ASC`,
      [req.user.agencyId]
    );

    res.json(result.rows);
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
