const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../server');

// Helper: Generate refresh token with SHA256 hash
const generateRefreshToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const userRes = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userRes.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate access token (24h)
    const accessToken = jwt.sign(
      { userId: user.id, agencyId: user.agency_id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Generate refresh token (30d)
    const refreshToken = generateRefreshToken();
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Save refresh token to DB
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, device_info, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        user.id,
        tokenHash,
        expiresAt,
        req.headers['user-agent'] || 'unknown',
        req.ip || req.connection.remoteAddress
      ]
    );

    // Set httpOnly cookie for refresh token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, agencyId } = req.body;

    if (!email || !password || !name || !agencyId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const userRes = await pool.query(
      `INSERT INTO users (email, name, password_hash, agency_id, role)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, role`,
      [email, name, hashedPassword, agencyId, 'agent']
    );

    const user = userRes.rows[0];

    const accessToken = jwt.sign(
      { userId: user.id, agencyId, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      accessToken,
      user
    });
  } catch (error) {
    if (error.code === '23505') {
      res.status(409).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    // Get refresh token from body or cookie
    const refreshToken = req.body.refreshToken || req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const tokenHash = hashToken(refreshToken);

    // Find refresh token in DB
    const tokenRes = await pool.query(
      `SELECT * FROM refresh_tokens
       WHERE token_hash = $1 AND is_revoked = false`,
      [tokenHash]
    );

    if (tokenRes.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const storedToken = tokenRes.rows[0];

    // Check expiration
    if (new Date(storedToken.expires_at) < new Date()) {
      return res.status(401).json({ error: 'Refresh token expired' });
    }

    // Get user info
    const userRes = await pool.query(
      'SELECT * FROM users WHERE id = $1 AND is_active = true',
      [storedToken.user_id]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = userRes.rows[0];

    // Generate new access token
    const newAccessToken = jwt.sign(
      { userId: user.id, agencyId: user.agency_id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Update last_used_at
    await pool.query(
      `UPDATE refresh_tokens SET last_used_at = NOW() WHERE id = $1`,
      [storedToken.id]
    );

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  try {
    const refreshToken = req.body.refreshToken || req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const tokenHash = hashToken(refreshToken);

    // Revoke refresh token
    await pool.query(
      `UPDATE refresh_tokens SET is_revoked = true WHERE token_hash = $1`,
      [tokenHash]
    );

    // Clear cookie
    res.clearCookie('refreshToken');

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/auth/sessions (list active tokens)
router.get('/sessions', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Get active sessions for this user
    const sessionsRes = await pool.query(
      `SELECT id, device_info, ip_address, created_at, last_used_at, expires_at
       FROM refresh_tokens
       WHERE user_id = $1 AND is_revoked = false
       ORDER BY last_used_at DESC NULLS LAST`,
      [decoded.userId]
    );

    res.json(sessionsRes.rows);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

module.exports = router;
