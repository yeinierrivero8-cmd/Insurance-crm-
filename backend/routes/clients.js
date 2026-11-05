const express = require('express');
const router = express.Router();
const { pool } = require('../db/sqlite-pool');
const auditLog = require('../middleware/auditLogger');
const { validateClientInput } = require('../middleware/inputValidator');
const { authenticate } = require('../middleware/authMiddleware');
const allowedRoles = require('../middleware/roleBasedAccess');

// GET /api/clients - Listar clientes con paginación, búsqueda y filtrado
// Query params: limit=50, offset=0, search=query, status=active, sort=name:asc
router.get('/', authenticate, allowedRoles(['admin', 'agent', 'viewer']), async (req, res) => {
  try {
    // Validación crítica: usuario solo puede ver su propia agencia
    if (!req.user.agencyId) {
      return res.status(403).json({ error: 'No tienes acceso a clientes' });
    }

    // Parse query parameters
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 500); // 1-500, default 50
    const offset = Math.max(parseInt(req.query.offset) || 0, 0); // default 0
    const search = (req.query.search || '').trim();
    const status = (req.query.status || '').trim();
    const sort = (req.query.sort || 'created_at:desc').trim();

    // Parse sort parameter (format: field:direction)
    const [sortField, sortDir] = sort.split(':');
    const validSortFields = ['name', 'email', 'phone', 'type', 'status', 'created_at', 'updated_at'];
    const sortColumn = validSortFields.includes(sortField) ? sortField : 'created_at';
    const sortDirection = sortDir === 'asc' ? 'ASC' : 'DESC';

    // Build WHERE clause with search and status filter
    let whereConditions = ['agency_id = $1', 'deleted_at IS NULL'];
    let params = [req.user.agencyId];

    if (search) {
      whereConditions.push(
        `(name LIKE $${params.length + 1} OR email LIKE $${params.length + 1} OR phone LIKE $${params.length + 1})`
      );
      params.push(`%${search}%`);
    }

    if (status) {
      whereConditions.push(`status = $${params.length + 1}`);
      params.push(status);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as count FROM clients WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const pageParams = [...params, limit, offset];
    const result = await pool.query(
      `SELECT * FROM clients
       WHERE ${whereClause}
       ORDER BY ${sortColumn} ${sortDirection}
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

// GET /api/clients/:id - Solo ver clientes de su agencia
router.get('/:id', authenticate, allowedRoles(['admin', 'agent', 'viewer']), async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el cliente pertenece a su agencia
    const result = await pool.query(
      'SELECT * FROM clients WHERE id = $1 AND agency_id = $2',
      [id, req.user.agencyId]
    );

    if (result.rows.length === 0) {
      auditLog(req, 'CLIENT_ACCESS_DENIED', { clientId: id, userAgencyId: req.user.agencyId });
      return res.status(404).json({ error: 'Client not found or access denied' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/clients - Solo admin puede crear clientes
router.post('/', authenticate, allowedRoles(['admin']), validateClientInput, async (req, res) => {
  try {
    const { name, email, phone, type, status, notes } = req.body;

    const result = await pool.query(
      `INSERT INTO clients (name, email, phone, type, status, agency_id, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, email, phone, type || 'personal', status || 'active', req.user.agencyId, notes]
    );

    // Log the action
    auditLog(req, 'CLIENT_CREATED', { clientId: result.rows[0].id, name, email, agencyId: req.user.agencyId });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    auditLog(req, 'CLIENT_CREATE_FAILED', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/clients/:id - Solo admin puede actualizar
router.put('/:id', authenticate, allowedRoles(['admin']), validateClientInput, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, type, status, notes } = req.body;

    // Validate id is a number
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid client ID' });
    }

    // Verificar que el cliente pertenece a su agencia
    const clientCheck = await pool.query(
      'SELECT * FROM clients WHERE id = $1 AND agency_id = $2',
      [id, req.user.agencyId]
    );

    if (clientCheck.rows.length === 0) {
      auditLog(req, 'CLIENT_UPDATE_DENIED', { clientId: id, userAgencyId: req.user.agencyId });
      return res.status(404).json({ error: 'Client not found or access denied' });
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
       WHERE id = $7 AND agency_id = $8
       RETURNING *`,
      [name, email, phone, type, status, notes, id, req.user.agencyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Log the action
    auditLog(req, 'CLIENT_UPDATED', { clientId: id, agencyId: req.user.agencyId, changes: { name, email, phone, type, status } });

    res.json(result.rows[0]);
  } catch (error) {
    auditLog(req, 'CLIENT_UPDATE_FAILED', { clientId: id, error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/clients/:id (soft delete) - Solo admin
router.delete('/:id', authenticate, allowedRoles(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Validate id is a number
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid client ID' });
    }

    // Verificar que el cliente pertenece a su agencia
    const clientCheck = await pool.query(
      'SELECT * FROM clients WHERE id = $1 AND agency_id = $2',
      [id, req.user.agencyId]
    );

    if (clientCheck.rows.length === 0) {
      auditLog(req, 'CLIENT_DELETE_DENIED', { clientId: id, userAgencyId: req.user.agencyId });
      return res.status(404).json({ error: 'Client not found or access denied' });
    }

    const result = await pool.query(
      `UPDATE clients SET deleted_at = DATETIME('now') WHERE id = $1 AND agency_id = $2 RETURNING *`,
      [id, req.user.agencyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Log the action
    auditLog(req, 'CLIENT_DELETED', { clientId: id, agencyId: req.user.agencyId, clientName: result.rows[0].name });

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    auditLog(req, 'CLIENT_DELETE_FAILED', { clientId: id, error: error.message });
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
