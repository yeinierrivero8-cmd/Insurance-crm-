const express = require('express');
const router = express.Router();
const { pool } = require('../db/sqlite-pool');

// GET /api/clients
router.get('/', async (req, res) => {
  try {
    const { agencyId } = req.query;
    if (!agencyId) return res.status(400).json({ error: 'agencyId required' });

    const result = await pool.query(
      'SELECT * FROM clients WHERE agency_id = $1 ORDER BY created_at DESC',
      [agencyId]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/clients/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM clients WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/clients
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, type, status, agencyId, notes } = req.body;

    if (!name || !agencyId) {
      return res.status(400).json({ error: 'name and agencyId required' });
    }

    const result = await pool.query(
      `INSERT INTO clients (name, email, phone, type, status, agency_id, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, email, phone, type || 'prospect', status || 'active', agencyId, notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/clients/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, type, status, notes } = req.body;

    const result = await pool.query(
      `UPDATE clients
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           phone = COALESCE($3, phone),
           type = COALESCE($4, type),
           status = COALESCE($5, status),
           notes = COALESCE($6, notes),
           updated_at = DATETIME('now')
       WHERE id = $7
       RETURNING *`,
      [name, email, phone, type, status, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/clients/:id (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE clients SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({ message: 'Client deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
