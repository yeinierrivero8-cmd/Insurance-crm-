const express = require('express');
const cors = require('cors');
const compression = require('compression');
const dotenv = require('dotenv');
const path = require('path');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const csrf = require('csurf');
const { authenticate } = require('./middleware/authMiddleware');
const auditLog = require('./middleware/auditLogger');
const { pool } = require('./db/sqlite-pool');
const { initDatabase } = require('./db/init-sqlite');
const { scheduleBackups } = require('./utils/backup');

dotenv.config();

const app = express();

// Security: Middleware for CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
};

// Middleware
app.use(cors(corsOptions));
app.use(compression({ threshold: 1024 })); // Gzip compression for responses > 1KB
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Security: Rate limiting middleware
// Login rate limiter: maximum 5 attempts in 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Demasiados intentos fallidos. Intenta de nuevo en 15 minutos.',
  standardHeaders: false,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV !== 'production' // Disable in development
});

// General API rate limiter: 100 requests per 15 minutes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Demasiadas solicitudes. Intenta más tarde.',
  standardHeaders: false,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV !== 'production' || req.method === 'GET'
});

// Apply general limiter to all API routes
app.use('/api/', generalLimiter);

// Security: CSRF protection middleware
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

// Security: Start automatic backups
scheduleBackups(6); // Every 6 hours

// Root route - serve index.html
app.get('/', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.1', timestamp: new Date().toISOString() });
});

// Database health check
app.get('/api/health/db', async (_req, res) => {
  if (!pool) {
    return res.json({ status: 'no-database-url', message: 'DATABASE_URL not configured' });
  }
  try {
    const result = await pool.query("SELECT DATETIME('now') as now");
    res.json({
      status: 'connected',
      timestamp: result.rows[0].now
    });
  } catch (error) {
    res.status(500).json({
      status: 'disconnected',
      error: error.message
    });
  }
});

// Security: CSRF token endpoint
app.get('/api/csrf-token', csrfProtection, (_req, res) => {
  res.json({ csrfToken: _req.csrfToken() });
});

// Auth routes (public, with rate limiting on login)
const authRoutes = require('./routes/auth');
app.post('/api/auth/login', loginLimiter, (req, res, next) => {
  auditLog(req, 'LOGIN_ATTEMPT', { email: req.body.email });
  next();
});
app.use('/api/auth', authRoutes);

// Protected routes (require authentication)
// Clients routes
const clientRoutes = require('./routes/clients');
app.use('/api/clients', authenticate, clientRoutes);

// Policies routes
const policyRoutes = require('./routes/policies');
app.use('/api/policies', authenticate, policyRoutes);

// Renewals routes
const renewalRoutes = require('./routes/renewals');
app.use('/api/renewals', authenticate, renewalRoutes);

// Import routes
const importRoutes = require('./routes/import');
app.use('/api/import', authenticate, importRoutes);

// Export routes
const exportRoutes = require('./routes/export');
app.use('/api/export', authenticate, exportRoutes);

// Serve static files from dist folder (frontend build)
const distPath = path.resolve(__dirname, '..', 'dist');
console.log('📁 Serving static files from:', distPath);
app.use(express.static(distPath));

// SPA fallback: redirect all non-API non-static requests to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      console.error('Error sending index.html:', err);
      res.status(500).json({ error: 'File not found', message: err.message });
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    status: err.status || 500
  });
});

const PORT = process.env.PORT || 5000;

// Start server after database is ready
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  });

module.exports = { app, pool };
