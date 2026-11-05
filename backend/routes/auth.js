const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../db/sqlite-pool');
const auditLog = require('../middleware/auditLogger');
const { generateSecret, verifyToken, generateQRCode } = require('../utils/twoFactor');
const authenticate = require('../middleware/authMiddleware');

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
      auditLog(req, 'LOGIN_FAILED_USER_NOT_FOUND', { email });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userRes.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      auditLog(req, 'LOGIN_FAILED_INVALID_PASSWORD', { email });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // SI 2FA está activado, retornar token temporal
    if (user.two_factor_enabled) {
      const tempToken = jwt.sign(
        { userId: user.id, temp2FA: true },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '5m' } // Solo válido 5 minutos
      );

      auditLog(req, 'LOGIN_2FA_REQUIRED', { email });
      return res.json({
        requiresOTP: true,
        tempToken: tempToken,
        userId: user.id
      });
    }

    // SIN 2FA, login normal
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

    auditLog(req, 'LOGIN_SUCCESS', { email, userId: user.id, role: user.role });

    res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
  } catch (error) {
    auditLog(req, 'LOGIN_ERROR', { email, error: error.message });
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

    auditLog(req, 'USER_REGISTERED', { userId: user.id, email, name });

    res.status(201).json({
      accessToken,
      user
    });
  } catch (error) {
    if (error.code === '23505') {
      auditLog(req, 'REGISTER_FAILED_EMAIL_EXISTS', { email });
      res.status(409).json({ error: 'Email already exists' });
    } else {
      auditLog(req, 'REGISTER_ERROR', { email, error: error.message });
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
      `UPDATE refresh_tokens SET last_used_at = DATETIME('now') WHERE id = $1`,
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

    auditLog(req, 'LOGOUT_SUCCESS', { message: 'User logged out' });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    auditLog(req, 'LOGOUT_ERROR', { error: error.message });
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

// ===================== 2FA ENDPOINTS =====================

// POST /api/auth/2fa/setup - Generar código QR para 2FA
router.post('/2fa/setup', authenticate, async (req, res) => {
  try {
    const secret = generateSecret(req.user.email);
    const qrCode = await generateQRCode(secret);

    // Generar 10 backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );

    res.json({
      qrCode,
      secret: secret.base32,
      backupCodes
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/2fa/verify - Verificar y activar 2FA
router.post('/2fa/verify', authenticate, async (req, res) => {
  try {
    const { secret, token, backupCodes } = req.body;

    if (!secret || !token || !backupCodes) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verificar token TOTP
    if (!verifyToken(secret, token)) {
      return res.status(400).json({ error: 'Token inválido' });
    }

    // Guardar secret en BD
    await pool.query(
      `UPDATE users
       SET two_factor_enabled = 1,
           two_factor_secret = $1,
           backup_codes = $2
       WHERE id = $3`,
      [secret, JSON.stringify(backupCodes), req.user.id]
    );

    auditLog(req, '2FA_ENABLED', { userId: req.user.id });
    res.json({ message: '2FA activado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/2fa/disable - Desactivar 2FA
router.post('/2fa/disable', authenticate, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Contraseña requerida' });
    }

    // Verificar contraseña
    const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = userRes.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    await pool.query(
      `UPDATE users
       SET two_factor_enabled = 0,
           two_factor_secret = NULL,
           backup_codes = NULL
       WHERE id = $1`,
      [req.user.id]
    );

    auditLog(req, '2FA_DISABLED', { userId: req.user.id });
    res.json({ message: '2FA desactivado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/2fa/verify-login - Verificar token durante login
router.post('/2fa/verify-login', async (req, res) => {
  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      return res.status(400).json({ error: 'userId y token requeridos' });
    }

    const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const userData = userRes.rows[0];

    // Verificar token TOTP
    if (verifyToken(userData.two_factor_secret, token)) {
      // Token válido, generar acceso completo
      const accessToken = jwt.sign(
        { userId: userData.id, agencyId: userData.agency_id, role: userData.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      // Generar refresh token
      const refreshToken = generateRefreshToken();
      const tokenHash = hashToken(refreshToken);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await pool.query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, device_info, ip_address)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          userData.id,
          tokenHash,
          expiresAt,
          req.headers['user-agent'] || 'unknown',
          req.ip || req.connection.remoteAddress
        ]
      );

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000
      });

      auditLog(req, '2FA_VERIFICATION_SUCCESS', { userId });
      return res.json({ accessToken, refreshToken });
    }

    // Verificar contra backup codes
    const backupCodes = JSON.parse(userData.backup_codes || '[]');
    if (backupCodes.includes(token)) {
      // Remover código usado
      const remaining = backupCodes.filter(code => code !== token);
      await pool.query(
        'UPDATE users SET backup_codes = $1 WHERE id = $2',
        [JSON.stringify(remaining), userId]
      );

      const accessToken = jwt.sign(
        { userId: userData.id, agencyId: userData.agency_id, role: userData.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      // Generar refresh token
      const refreshToken = generateRefreshToken();
      const tokenHash = hashToken(refreshToken);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await pool.query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, device_info, ip_address)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          userData.id,
          tokenHash,
          expiresAt,
          req.headers['user-agent'] || 'unknown',
          req.ip || req.connection.remoteAddress
        ]
      );

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000
      });

      auditLog(req, '2FA_BACKUP_CODE_USED', { userId });
      return res.json({ accessToken, refreshToken });
    }

    res.status(401).json({ error: 'Token 2FA inválido' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
