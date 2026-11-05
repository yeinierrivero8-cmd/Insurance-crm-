const express = require('express');
const router = express.Router();
const { pool } = require('../db/sqlite-pool');
const auditLog = require('../middleware/auditLogger');
const { authenticate } = require('../middleware/authMiddleware');
const allowedRoles = require('../middleware/roleBasedAccess');
const bcrypt = require('bcrypt');

/**
 * GET /api/admin/audit-logs
 * Retrieve audit logs with filtering and pagination (admin only)
 * Query params: limit=100, offset=0, action=, user_id=, date_from=, date_to=
 * RBAC: admin only
 */
router.get('/audit-logs', authenticate, allowedRoles(['admin']), async (req, res) => {
  try {
    if (!req.user.agencyId) {
      return res.status(403).json({ error: 'No agency access' });
    }

    const limit = Math.min(Math.max(parseInt(req.query.limit) || 100, 1), 500);
    const offset = Math.max(parseInt(req.query.offset) || 0, 0);
    const action = (req.query.action || '').trim();
    const userId = (req.query.user_id || '').trim();
    const dateFrom = (req.query.date_from || '').trim();
    const dateTo = (req.query.date_to || '').trim();

    // Build WHERE clause
    let whereConditions = [];
    let params = [];

    if (action) {
      whereConditions.push(`action LIKE $${params.length + 1}`);
      params.push(`%${action}%`);
    }

    if (userId) {
      whereConditions.push(`user_id = $${params.length + 1}`);
      params.push(parseInt(userId));
    }

    if (dateFrom) {
      whereConditions.push(`timestamp >= $${params.length + 1}`);
      params.push(dateFrom);
    }

    if (dateTo) {
      whereConditions.push(`timestamp <= $${params.length + 1}`);
      params.push(dateTo);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as count FROM audit_logs ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results with user email
    const pageParams = [...params, limit, offset];
    const result = await pool.query(
      `SELECT
         al.id,
         al.timestamp,
         al.user_id,
         al.action,
         al.resource,
         u.email as user_email,
         u.name as user_name
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ${whereClause}
       ORDER BY al.timestamp DESC
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

/**
 * GET /api/admin/users
 * List all users in the agency (admin only)
 * RBAC: admin only
 */
router.get('/users', authenticate, allowedRoles(['admin']), async (req, res) => {
  try {
    if (!req.user.agencyId) {
      return res.status(403).json({ error: 'No agency access' });
    }

    const result = await pool.query(
      `SELECT
         id,
         email,
         name,
         role,
         is_active,
         created_at,
         last_login
       FROM users
       WHERE agency_id = $1
       ORDER BY created_at DESC`,
      [req.user.agencyId]
    );

    res.json({
      data: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/users
 * Create a new user (admin only)
 * Body: { email, name, password, role }
 * RBAC: admin only
 */
router.post('/users', authenticate, allowedRoles(['admin']), async (req, res) => {
  try {
    if (!req.user.agencyId) {
      return res.status(403).json({ error: 'No agency access' });
    }

    const { email, name, password, role } = req.body;

    // Validation
    if (!email || !name || !password || !role) {
      return res.status(400).json({ error: 'Email, name, password, and role are required' });
    }

    // Validate role
    const validRoles = ['admin', 'agent', 'viewer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if email already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (email, name, password_hash, agency_id, role, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, email, name, role, is_active, created_at`,
      [email, name, passwordHash, req.user.agencyId, role]
    );

    auditLog(req, 'USER_CREATED', { email, role });
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/admin/users/:id
 * Update user info (admin only)
 * Body: { name, role }
 * RBAC: admin only
 */
router.put('/users/:id', authenticate, allowedRoles(['admin']), async (req, res) => {
  try {
    if (!req.user.agencyId) {
      return res.status(403).json({ error: 'No agency access' });
    }

    const userId = parseInt(req.params.id);
    const { name, role } = req.body;

    // Prevent self-role-change
    if (userId === req.user.userId && role && role !== 'admin') {
      return res.status(400).json({ error: 'Cannot remove admin role from yourself' });
    }

    // Validate role if provided
    if (role) {
      const validRoles = ['admin', 'agent', 'viewer'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }
    }

    // Build UPDATE query
    let query = 'UPDATE users SET';
    let params = [];
    let setClauses = [];

    if (name) {
      setClauses.push(`name = $${setClauses.length + 1}`);
      params.push(name);
    }

    if (role) {
      setClauses.push(`role = $${setClauses.length + 1}`);
      params.push(role);
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    query += ' ' + setClauses.join(', ');
    params.push(userId, req.user.agencyId);
    query += ` WHERE id = $${params.length - 1} AND agency_id = $${params.length}
              RETURNING id, email, name, role, is_active, created_at`;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    auditLog(req, 'USER_UPDATED', { userId, name, role });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete a user (admin only)
 * RBAC: admin only
 */
router.delete('/users/:id', authenticate, allowedRoles(['admin']), async (req, res) => {
  try {
    if (!req.user.agencyId) {
      return res.status(403).json({ error: 'No agency access' });
    }

    const userId = parseInt(req.params.id);

    // Prevent self-deletion
    if (userId === req.user.userId) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    // Check if last admin
    const adminCount = await pool.query(
      `SELECT COUNT(*) as count FROM users
       WHERE agency_id = $1 AND role = 'admin' AND id != $2`,
      [req.user.agencyId, userId]
    );

    if (parseInt(adminCount.rows[0].count) === 0) {
      return res.status(400).json({ error: 'Cannot delete the last admin user' });
    }

    // Delete user
    const result = await pool.query(
      `DELETE FROM users
       WHERE id = $1 AND agency_id = $2
       RETURNING id, email, name`,
      [userId, req.user.agencyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    auditLog(req, 'USER_DELETED', { email: result.rows[0].email });
    res.json({ message: 'User deleted successfully', user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
