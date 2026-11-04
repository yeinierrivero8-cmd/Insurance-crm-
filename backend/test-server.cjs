const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const LoginAttemptService = require('./services/LoginAttemptService.cjs');
const RBACService = require('./services/RBACService.cjs');
const { requirePermission, requireRole } = require('./middleware/rbacMiddleware.cjs');

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
      email: 'agent@insuraflow.com',
      name: 'Agent User',
      password_hash: bcrypt.hashSync('Agent@123', 12),
      agency_id: 1,
      role: 'agent',
      is_active: true
    },
    {
      id: 3,
      email: 'viewer@insuraflow.com',
      name: 'Viewer User',
      password_hash: bcrypt.hashSync('Viewer@123', 12),
      agency_id: 1,
      role: 'viewer',
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
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const agencyId = 1; // Default agency for test-server.cjs

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  // CHECK RATE LIMITING FIRST
  let lockStatus = await LoginAttemptService.isAccountLocked(email, agencyId);
  if (lockStatus.locked) {
    return res.status(429).json({
      error: 'too_many_attempts',
      message: `Account temporarily locked for ${lockStatus.minutesRemaining} minute(s)`,
      retryAfter: lockStatus.minutesRemaining * 60,
      lockedUntil: lockStatus.lockedUntil.toISOString()
    });
  }

  const user = db.users.find(u => u.email === email && u.is_active);

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    // FAILED LOGIN: Record attempt
    await LoginAttemptService.recordFailedAttempt(email, agencyId);

    // RE-CHECK if account is now locked (after recording the failure)
    lockStatus = await LoginAttemptService.isAccountLocked(email, agencyId);
    if (lockStatus.locked) {
      return res.status(429).json({
        error: 'too_many_attempts',
        message: `Account temporarily locked for ${lockStatus.minutesRemaining} minute(s)`,
        retryAfter: lockStatus.minutesRemaining * 60,
        lockedUntil: lockStatus.lockedUntil.toISOString()
      });
    }

    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // SUCCESS: Clear attempts
  await LoginAttemptService.recordSuccessfulAttempt(email, agencyId);

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
app.get('/api/clients', authenticate, requirePermission('clients:read'), (req, res) => {
  const agencyId = parseInt(req.query.agencyId);
  const clients = db.clients.filter(c => c.agency_id === agencyId && !c.deleted_at);
  res.json(clients);
});

// GET client by id
app.get('/api/clients/:id', authenticate, requirePermission('clients:read'), (req, res) => {
  const client = db.clients.find(c => c.id === parseInt(req.params.id) && !c.deleted_at);
  if (!client) return res.status(404).json({ error: 'Not found' });
  res.json(client);
});

// POST client (create)
app.post('/api/clients', authenticate, requirePermission('clients:create'), (req, res) => {
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

// PUT client (update)
app.put('/api/clients/:id', authenticate, requirePermission('clients:update'), (req, res) => {
  const clientId = parseInt(req.params.id);
  const client = db.clients.find(c => c.id === clientId && !c.deleted_at);

  if (!client) {
    return res.status(404).json({ error: 'Client not found' });
  }

  const { name, email, phone, type, status } = req.body;
  if (name) client.name = name;
  if (email) client.email = email;
  if (phone) client.phone = phone;
  if (type) client.type = type;
  if (status) client.status = status;

  res.json(client);
});

// DELETE client
app.delete('/api/clients/:id', authenticate, requirePermission('clients:delete'), (req, res) => {
  const clientId = parseInt(req.params.id);
  const clientIndex = db.clients.findIndex(c => c.id === clientId && !c.deleted_at);

  if (clientIndex === -1) {
    return res.status(404).json({ error: 'Client not found' });
  }

  db.clients[clientIndex].deleted_at = new Date().toISOString();
  res.json({ message: 'Client deleted' });
});

// GET policies
app.get('/api/policies', authenticate, requirePermission('policies:read'), (req, res) => {
  const agencyId = parseInt(req.query.agencyId);
  const policies = db.policies.filter(p => p.agency_id === agencyId);
  res.json(policies);
});

// GET policy by id
app.get('/api/policies/:id', authenticate, requirePermission('policies:read'), (req, res) => {
  const policy = db.policies.find(p => p.id === parseInt(req.params.id));
  if (!policy) return res.status(404).json({ error: 'Policy not found' });
  res.json(policy);
});

// POST policy (create)
app.post('/api/policies', authenticate, requirePermission('policies:create'), (req, res) => {
  const { client_id, type, policy_number, premium, expiry_date, agencyId, status } = req.body;

  if (!client_id || !policy_number || !agencyId) {
    return res.status(400).json({ error: 'client_id, policy_number, and agencyId required' });
  }

  const newPolicy = {
    id: Math.max(...db.policies.map(p => p.id), 0) + 1,
    client_id,
    type: type || 'auto',
    policy_number,
    premium: premium || 0,
    expiry_date,
    agency_id: agencyId,
    status: status || 'active'
  };

  db.policies.push(newPolicy);
  res.status(201).json(newPolicy);
});

// PUT policy (update)
app.put('/api/policies/:id', authenticate, requirePermission('policies:update'), (req, res) => {
  const policyId = parseInt(req.params.id);
  const policy = db.policies.find(p => p.id === policyId);

  if (!policy) {
    return res.status(404).json({ error: 'Policy not found' });
  }

  const { type, policy_number, premium, expiry_date, status } = req.body;
  if (type) policy.type = type;
  if (policy_number) policy.policy_number = policy_number;
  if (premium) policy.premium = premium;
  if (expiry_date) policy.expiry_date = expiry_date;
  if (status) policy.status = status;

  res.json(policy);
});

// DELETE policy
app.delete('/api/policies/:id', authenticate, requirePermission('policies:delete'), (req, res) => {
  const policyId = parseInt(req.params.id);
  const policyIndex = db.policies.findIndex(p => p.id === policyId);

  if (policyIndex === -1) {
    return res.status(404).json({ error: 'Policy not found' });
  }

  db.policies.splice(policyIndex, 1);
  res.json({ message: 'Policy deleted' });
});

// GET renewals
app.get('/api/renewals', authenticate, requirePermission('renewals:read'), (req, res) => {
  const agencyId = parseInt(req.query.agencyId);
  const renewals = db.renewals.filter(r => r.agency_id === agencyId);
  res.json(renewals);
});

// PUT renewal (update)
app.put('/api/renewals/:id', authenticate, requirePermission('renewals:update'), (req, res) => {
  const renewal = db.renewals.find(r => r.id === parseInt(req.params.id));
  if (!renewal) return res.status(404).json({ error: 'Renewal not found' });

  renewal.status = req.body.status || renewal.status;
  res.json(renewal);
});

// ============================================
// TEST ENDPOINTS FOR RATE LIMITING DEBUG
// ============================================

// Reset rate limiting for a specific email
app.post('/test/rate-limit/reset', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'email required' });
  }
  LoginAttemptService.store.delete(`1:${email}`);
  res.json({ reset: true, email });
});

// Check current attempt count for an email
app.get('/test/rate-limit/status/:email', (req, res) => {
  const record = LoginAttemptService.store.get(`1:${req.params.email}`);
  res.json({
    email: req.params.email,
    attempts: record?.attempts || 0,
    locked: record?.lockedUntil ? new Date(record.lockedUntil).toISOString() : null,
    minutesRemaining: record?.lockedUntil ? Math.ceil((record.lockedUntil - Date.now()) / 60000) : null
  });
});

// Simulate N failed login attempts
app.post('/test/rate-limit/simulate-failures', async (req, res) => {
  const { email, count = 5 } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'email required' });
  }
  for (let i = 0; i < count; i++) {
    await LoginAttemptService.recordFailedAttempt(email, 1);
  }
  res.json({ simulated: count, email });
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
  console.log(`🔒 Rate Limiting: ENABLED (5 failed logins = 15min lockout)`);
  console.log(`\n🧪 API ENDPOINTS:`);
  console.log(`  GET  http://localhost:${PORT}/health`);
  console.log(`  POST http://localhost:${PORT}/api/auth/login`);
  console.log(`  GET  http://localhost:${PORT}/api/clients?agencyId=1`);
  console.log(`  GET  http://localhost:${PORT}/api/renewals?agencyId=1`);
  console.log(`\n🔑 RATE LIMIT TEST ENDPOINTS:`);
  console.log(`  GET  http://localhost:${PORT}/test/rate-limit/status/:email`);
  console.log(`  POST http://localhost:${PORT}/test/rate-limit/reset (email in body)`);
  console.log(`  POST http://localhost:${PORT}/test/rate-limit/simulate-failures (email, count)`);
  console.log(`\n🔐 TEST CREDENTIALS (with RBAC):`);
  console.log(`  ADMIN:`);
  console.log(`    Email: admin@insuraflow.com`);
  console.log(`    Password: Admin@123`);
  console.log(`    Permissions: All (create/read/update/delete on all resources)`);
  console.log(`\n  AGENT:`);
  console.log(`    Email: agent@insuraflow.com`);
  console.log(`    Password: Agent@123`);
  console.log(`    Permissions: Create/read/update (no delete); read audit logs`);
  console.log(`\n  VIEWER:`);
  console.log(`    Email: viewer@insuraflow.com`);
  console.log(`    Password: Viewer@123`);
  console.log(`    Permissions: Read-only access to clients, policies, renewals, audit logs`);
  console.log('\n');
});
