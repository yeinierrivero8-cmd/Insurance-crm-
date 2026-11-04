const express = require('express');
const cors = require('cors');
const compression = require('compression');
const dotenv = require('dotenv');
const path = require('path');
const { Pool } = require('pg');
const cookieParser = require('cookie-parser');
const { authenticate } = require('./middleware/authMiddleware');

dotenv.config();

const app = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Middleware
app.use(cors());
app.use(compression({ threshold: 1024 })); // Gzip compression for responses > 1KB
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Database health check
app.get('/api/health/db', async (req, res) => {
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
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));

// SPA fallback: redirect all non-API requests to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
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
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

module.exports = { app, pool };
