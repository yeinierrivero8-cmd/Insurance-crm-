const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../server');

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

    const accessToken = jwt.sign(
      { userId: user.id, agencyId: user.agency_id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
      { expiresIn: '30d' }
    );

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

module.exports = router;
