const express = require('express');
const cors = require('cors');
const compression = require('compression');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
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
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  maxAge: 86400 // 24 hours
};

// Middleware
app.use(cors(corsOptions));

// Security: Add security headers
app.use((req, res, next) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Clickjacking protection
  res.setHeader('X-Frame-Options', 'DENY');

  // XSS protection (older browsers)
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy (permissive for now, tighten in production)
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  );

  // HSTS for HTTPS
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
});

// Compression middleware
app.use(compression({ threshold: 1024 })); // Gzip compression for responses > 1KB

// Body parsers with size limits
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

// POST/PUT/DELETE rate limiter: 100 requests per 15 minutes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Demasiadas solicitudes. Intenta más tarde.',
  standardHeaders: false,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV !== 'production' || req.method === 'GET'
});

// More aggressive limiter for sensitive endpoints
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Very limited
  message: 'Too many requests to this endpoint',
  standardHeaders: false,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV !== 'production'
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

// Cache middleware for static assets
const cacheStatic = (req, res, next) => {
  if (req.path.startsWith('/assets/')) {
    // Cache static assets for 1 month (they have hash in filename)
    res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
  }
  next();
};
app.use(cacheStatic);

// Root route - serve index.html (no cache)
app.get('/', (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(distPath, 'index.html'));
});

// Health check
app.get('/health', (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
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

// Dashboard routes
const dashboardRoutes = require('./routes/dashboard');
app.use('/api/dashboard', authenticate, dashboardRoutes);

// Admin routes (audit logs, user management)
const adminRoutes = require('./routes/admin');
app.use('/api/admin', authenticate, adminRoutes);

// Webhooks routes (event subscription and delivery)
const webhookRoutes = require('./routes/webhooks');
app.use('/api/webhooks', authenticate, webhookRoutes);


// Debugging middleware to log requests
app.use((req, res, next) => {
  console.log('[REQUEST]', req.method, req.path);
  next();
});
// Serve static files from dist folder (frontend build)
const distPath = path.resolve(__dirname, '..', 'dist');
// Diagnostic: Check if dist folder exists
const distExists = fs.existsSync(distPath);
console.log('📊 [DIAGNOSTICS] distPath:', distPath);
console.log('📊 [DIAGNOSTICS] dist folder exists:', distExists);
if (distExists) {
  const files = fs.readdirSync(distPath);
  console.log('📊 [DIAGNOSTICS] dist contents:', files);
  const indexPath = path.join(distPath, 'index.html');
  console.log('📊 [DIAGNOSTICS] index.html exists:', fs.existsSync(indexPath));
}

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

// Start server with timeout for database initialization
const dbInitTimeout = setTimeout(() => {
  console.warn('⚠️ Database initialization timeout (10s), starting server anyway...');
  startServer();
}, 10000);

initDatabase()
  .then(() => {
    clearTimeout(dbInitTimeout);
    console.log('✅ Database initialized successfully');
    startServer();
  })
  .catch(err => {
    clearTimeout(dbInitTimeout);
    console.error('❌ Database initialization error:', err.message);
    console.warn('⚠️ Starting server without full database (may cause errors)');
    startServer();
  });

function startServer() {
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
}

module.exports = { app, pool };
