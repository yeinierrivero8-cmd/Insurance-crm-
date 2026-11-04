const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

// In-memory database
const db = {
  agencies: [
    { id: 1, name: 'InsuraFlow Demo Agency', subscription_tier: 'premium' }
  ],
  users: [
    {
      id: 1,
      email: 'admin@insuraflow.com',
      name: 'Admin User',
      password_hash: bcrypt.hashSync('Admin@123', 12),
      agency_id: 1,
      role: 'admin',
      is_active: true
    },
    {
      id: 2,
      email: 'agent1@insuraflow.com',
      name: 'Agent 1',
      password_hash: bcrypt.hashSync('Agent@123', 12),
      agency_id: 1,
      role: 'agent',
      is_active: true
    }
  ],
  clients: [
    { id: 1, name: 'Maria Garcia', email: 'maria.garcia@email.com', phone: '+1-555-1000', type: 'customer', status: 'active', agency_id: 1 },
    { id: 2, name: 'Carlos Rodriguez', email: 'carlos.rodriguez@email.com', phone: '+1-555-1001', type: 'customer', status: 'active', agency_id: 1 },
    { id: 3, name: 'Ana Martinez', email: 'ana.martinez@email.com', phone: '+1-555-1002', type: 'customer', status: 'active', agency_id: 1 },
    { id: 4, name: 'Juan Pérez', email: 'juan.perez@email.com', phone: '+1-555-1003', type: 'prospect', status: 'pending', agency_id: 1 },
    { id: 5, name: 'Sofia López', email: 'sofia.lopez@email.com', phone: '+1-555-1004', type: 'prospect', status: 'pending', agency_id: 1 }
  ],
  policies: [
    { id: 1, client_id: 1, type: 'auto', policy_number: 'POL-100001', premium: 250, expiry_date: '2025-02-04', agency_id: 1, status: 'active' },
    { id: 2, client_id: 2, type: 'home', policy_number: 'POL-100002', premium: 450, expiry_date: '2025-03-04', agency_id: 1, status: 'active' },
    { id: 3, client_id: 3, type: 'life', policy_number: 'POL-100003', premium: 75, expiry_date: '2025-04-04', agency_id: 1, status: 'active' }
  ],
  renewals: [
    { id: 1, policy_id: 1, due_date: '2025-01-05', status: 'pending', agency_id: 1, client_name: 'Maria Garcia', policy_number: 'POL-100001' },
    { id: 2, policy_id: 2, due_date: '2025-02-02', status: 'pending', agency_id: 1, client_name: 'Carlos Rodriguez', policy_number: 'POL-100002' },
    { id: 3, policy_id: 3, due_date: '2025-03-05', status: 'pending', agency_id: 1, client_name: 'Ana Martinez', policy_number: 'POL-100003' }
  ],
  refreshTokens: new Map() // Store: tokenHash -> { userId, expiresAt, isRevoked }
};

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    db: 'in-memory',
    timestamp: new Date().toISOString(),
    clients: db.clients.length,
    policies: db.policies.length,
    renewals: db.renewals.length
  });
});

// Helper: Generate and hash refresh token
const generateRefreshToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Authentication middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key');
    req.user = { userId: decoded.userId, agencyId: decoded.agencyId, role: decoded.role };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Auth login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const user = db.users.find(u => u.email === email && u.is_active);

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Generate access token (24h)
  const accessToken = jwt.sign(
    { userId: user.id, agencyId: user.agency_id, role: user.role },
    process.env.JWT_SECRET || 'dev-secret-key',
    { expiresIn: '24h' }
  );

  // Generate refresh token (30d)
  const refreshToken = generateRefreshToken();
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  // Store in memory
  db.refreshTokens.set(tokenHash, {
    userId: user.id,
    expiresAt,
    isRevoked: false
  });

  // Set httpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: false, // Development
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });

  res.json({
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, name: user.name, role: user.role }
  });
});

// Auth refresh
app.post('/api/auth/refresh', (req, res) => {
  const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token required' });
  }

  const tokenHash = hashToken(refreshToken);
  const storedToken = db.refreshTokens.get(tokenHash);

  if (!storedToken) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  if (storedToken.isRevoked) {
    return res.status(401).json({ error: 'Token revoked' });
  }

  if (new Date(storedToken.expiresAt) < new Date()) {
    return res.status(401).json({ error: 'Refresh token expired' });
  }

  const user = db.users.find(u => u.id === storedToken.userId && u.is_active);

  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  // Generate new access token
  const newAccessToken = jwt.sign(
    { userId: user.id, agencyId: user.agency_id, role: user.role },
    process.env.JWT_SECRET || 'dev-secret-key',
    { expiresIn: '24h' }
  );

  res.json({ accessToken: newAccessToken });
});

// Auth logout
app.post('/api/auth/logout', (req, res) => {
  const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' });
  }

  const tokenHash = hashToken(refreshToken);
  const storedToken = db.refreshTokens.get(tokenHash);

  if (storedToken) {
    storedToken.isRevoked = true;
  }

  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out successfully' });
});

// GET clients
app.get('/api/clients', authenticate, (req, res) => {
  const agencyId = parseInt(req.query.agencyId);
  const clients = db.clients.filter(c => c.agency_id === agencyId && !c.deleted_at);
  res.json(clients);
});

// GET client by id
app.get('/api/clients/:id', authenticate, (req, res) => {
  const client = db.clients.find(c => c.id === parseInt(req.params.id) && !c.deleted_at);
  if (!client) return res.status(404).json({ error: 'Not found' });
  res.json(client);
});

// POST client
app.post('/api/clients', authenticate, (req, res) => {
  const { name, email, phone, type, status, agencyId } = req.body;

  if (!name || !agencyId) {
    return res.status(400).json({ error: 'name and agencyId required' });
  }

  const newClient = {
    id: Math.max(...db.clients.map(c => c.id)) + 1,
    name,
    email,
    phone,
    type: type || 'prospect',
    status: status || 'active',
    agency_id: agencyId
  };

  db.clients.push(newClient);
  res.status(201).json(newClient);
});

// GET renewals
app.get('/api/renewals', authenticate, (req, res) => {
  const agencyId = parseInt(req.query.agencyId);
  const renewals = db.renewals.filter(r => r.agency_id === agencyId);
  res.json(renewals);
});

// PUT renewal
app.put('/api/renewals/:id', authenticate, (req, res) => {
  const renewal = db.renewals.find(r => r.id === parseInt(req.params.id));
  if (!renewal) return res.status(404).json({ error: 'Not found' });

  renewal.status = req.body.status || renewal.status;
  res.json(renewal);
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n✅ InsuraFlow API Test Server running on http://localhost:${PORT}`);
  console.log(`📊 Database: In-memory (test data)`);
  console.log(`\n🧪 TEST ENDPOINTS:`);
  console.log(`  GET  http://localhost:${PORT}/health`);
  console.log(`  POST http://localhost:${PORT}/api/auth/login`);
  console.log(`  GET  http://localhost:${PORT}/api/clients?agencyId=1`);
  console.log(`  GET  http://localhost:${PORT}/api/renewals?agencyId=1`);
  console.log(`\n🔐 TEST CREDENTIALS:`);
  console.log(`  Email: admin@insuraflow.com`);
  console.log(`  Password: Admin@123`);
  console.log('\n');
});
