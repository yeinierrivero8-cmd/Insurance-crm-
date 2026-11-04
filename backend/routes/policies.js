const express = require('express');
const router = express.Router();
const { pool } = require('../server');

// GET /api/policies
router.get('/', async (req, res) => {
  try {
    const { agencyId } = req.query;
    if (!agencyId) return res.status(400).json({ error: 'agencyId required' });

    const result = await pool.query(
      'SELECT * FROM policies WHERE agency_id = $1 ORDER BY created_at DESC',
      [agencyId]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/policies/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM policies WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/policies
router.post('/', async (req, res) => {
  try {
    const { clientId, type, policyNumber, premium, expiryDate, agencyId } = req.body;

    if (!clientId || !type || !agencyId) {
      return res.status(400).json({ error: 'clientId, type, and agencyId required' });
    }

    const result = await pool.query(
      `INSERT INTO policies (client_id, type, policy_number, premium, expiry_date, agency_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [clientId, type, policyNumber, premium, expiryDate, agencyId, 'active']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
