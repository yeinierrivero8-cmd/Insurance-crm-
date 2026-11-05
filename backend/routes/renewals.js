const express = require('express');
const router = express.Router();
const { pool } = require('../db/sqlite-pool');

// GET /api/renewals
router.get('/', async (req, res) => {
  try {
    const { agencyId } = req.query;
    if (!agencyId) return res.status(400).json({ error: 'agencyId required' });

    const result = await pool.query(
      `SELECT r.*, p.policy_number, c.name as client_name
       FROM renewals r
       JOIN policies p ON r.policy_id = p.id
       JOIN clients c ON p.client_id = c.id
       WHERE r.agency_id = $1
       ORDER BY r.due_date ASC`,
      [agencyId]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/renewals/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      `UPDATE renewals SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Renewal not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
