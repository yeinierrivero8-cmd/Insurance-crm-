const express = require('express');
const router = express.Router();
const { pool } = require('../db/sqlite-pool');
const auditLog = require('../middleware/auditLogger');
const { authenticate } = require('../middleware/authMiddleware');
const allowedRoles = require('../middleware/roleBasedAccess');

// GET /api/policies - Solo ver políticas de su agencia
router.get('/', authenticate, allowedRoles(['admin', 'agent', 'viewer']), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM policies WHERE agency_id = $1 ORDER BY created_at DESC',
      [req.user.agencyId]
    );

    res.json(result.rows);
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
