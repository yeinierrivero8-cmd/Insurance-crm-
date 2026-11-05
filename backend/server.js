const express = require('express');
const cors = require('cors');
const compression = require('compression');
const dotenv = require('dotenv');
const path = require('path');
const cookieParser = require('cookie-parser');
const { authenticate } = require('./middleware/authMiddleware');
const { pool } = require('./db/sqlite-pool');
const { initDatabase } = require('./db/init-sqlite');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(compression({ threshold: 1024 })); // Gzip compression for responses > 1KB
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Root route - serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.1', timestamp: new Date().toISOString() });
});

// Database health check
app.get('/api/health/db', async (req, res) => {
  if (!pool) {
    return res.json({ status: 'no-database-url', message: 'DATABASE_URL not configured' });
  }
  try {
    const result = await pool.query('SELECT NOW()');
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

// Auth routes (public)
const authRoutes = require('./routes/auth');
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
