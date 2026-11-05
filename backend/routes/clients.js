const express = require('express');
const router = express.Router();
const { pool } = require('../db/sqlite-pool');
const auditLog = require('../middleware/auditLogger');
const { validateClientInput } = require('../middleware/inputValidator');

// GET /api/clients
router.get('/', async (req, res) => {
  try {
    const { agencyId } = req.query;
    if (!agencyId) return res.status(400).json({ error: 'agencyId is required' });

    // Validate agencyId is a number
    if (isNaN(agencyId)) {
      return res.status(400).json({ error: 'agencyId must be a valid number' });
    }

    const result = await pool.query(
      'SELECT * FROM clients WHERE agency_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC',
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
router.post('/', validateClientInput, async (req, res) => {
  try {
    const { name, email, phone, type, status, agencyId, notes } = req.body;

    if (!agencyId) {
      return res.status(400).json({ error: 'agencyId is required' });
    }

    // Validate agencyId is a number
    if (isNaN(agencyId)) {
      return res.status(400).json({ error: 'agencyId must be a valid number' });
    }

    const result = await pool.query(
      `INSERT INTO clients (name, email, phone, type, status, agency_id, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, email, phone, type || 'personal', status || 'active', agencyId, notes]
    );

    // Log the action
    auditLog(req, 'CLIENT_CREATED', { clientId: result.rows[0].id, name, email });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    auditLog(req, 'CLIENT_CREATE_FAILED', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/clients/:id
router.put('/:id', validateClientInput, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, type, status, notes } = req.body;

    // Validate id is a number
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid client ID' });
    }

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

    // Log the action
    auditLog(req, 'CLIENT_UPDATED', { clientId: id, changes: { name, email, phone, type, status } });

    res.json(result.rows[0]);
  } catch (error) {
    auditLog(req, 'CLIENT_UPDATE_FAILED', { clientId: id, error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/clients/:id (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate id is a number
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid client ID' });
    }

    const result = await pool.query(
      `UPDATE clients SET deleted_at = DATETIME('now') WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Log the action
    auditLog(req, 'CLIENT_DELETED', { clientId: id, clientName: result.rows[0].name });

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    auditLog(req, 'CLIENT_DELETE_FAILED', { clientId: id, error: error.message });
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
