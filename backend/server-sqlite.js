const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const dbPath = path.join(__dirname, '..', 'insuraflow.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
function initDatabase() {
  console.log('📦 Initializing SQLite database...');

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS agencies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      subscription_tier TEXT DEFAULT 'free',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      agency_id INTEGER NOT NULL,
      role TEXT DEFAULT 'agent',
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(agency_id) REFERENCES agencies(id)
    );

    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      type TEXT DEFAULT 'prospect',
      status TEXT DEFAULT 'active',
      agency_id INTEGER NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted_at DATETIME,
      FOREIGN KEY(agency_id) REFERENCES agencies(id)
    );

    CREATE TABLE IF NOT EXISTS policies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      policy_number TEXT,
      premium REAL,
      expiry_date DATE,
      agency_id INTEGER NOT NULL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(client_id) REFERENCES clients(id),
      FOREIGN KEY(agency_id) REFERENCES agencies(id)
    );

    CREATE TABLE IF NOT EXISTS renewals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      policy_id INTEGER NOT NULL,
      due_date DATE,
      status TEXT DEFAULT 'pending',
      agency_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(policy_id) REFERENCES policies(id),
      FOREIGN KEY(agency_id) REFERENCES agencies(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT,
      resource TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('✅ Database initialized');
}

// Seed database
function seedDatabase() {
  const countAgencies = db.prepare('SELECT COUNT(*) as count FROM agencies').get();

  if (countAgencies.count > 0) {
    console.log('✅ Database already seeded');
    return;
  }

  console.log('🌱 Seeding database...');

  // Create agency
  const agencyStmt = db.prepare('INSERT INTO agencies (name, subscription_tier) VALUES (?, ?)');
  const agencyRes = agencyStmt.run('InsuraFlow Demo Agency', 'premium');
  const agencyId = agencyRes.lastInsertRowid;

  // Create users
  const adminPassword = bcrypt.hashSync('Admin@123', 12);
  const agentPassword = bcrypt.hashSync('Agent@123', 12);

  const userStmt = db.prepare('INSERT INTO users (email, name, password_hash, agency_id, role) VALUES (?, ?, ?, ?, ?)');
  userStmt.run('admin@insuraflow.com', 'Admin User', adminPassword, agencyId, 'admin');
  userStmt.run('agent1@insuraflow.com', 'Agent 1', agentPassword, agencyId, 'agent');
  userStmt.run('agent2@insuraflow.com', 'Agent 2', agentPassword, agencyId, 'agent');

  // Create clients
  const clientNames = [
    'Maria Garcia', 'Carlos Rodriguez', 'Ana Martinez',
    'Juan Pérez', 'Sofia López', 'Miguel Fernández',
    'Isabel Ruiz', 'Diego Sánchez', 'Laura Jiménez', 'Francisco Torres'
  ];

  const clientStmt = db.prepare('INSERT INTO clients (name, email, phone, type, status, agency_id) VALUES (?, ?, ?, ?, ?, ?)');
  const clientIds = [];

  clientNames.forEach((name, i) => {
    const res = clientStmt.run(
      name,
      name.toLowerCase().replace(' ', '.') + '@email.com',
      '+1-555-' + String(1000 + i).padStart(4, '0'),
      i < 3 ? 'customer' : 'prospect',
      i < 3 ? 'active' : 'pending',
      agencyId
    );
    clientIds.push(res.lastInsertRowid);
  });

  // Create policies & renewals
  const policyTypes = ['auto', 'home', 'life'];
  const policyStmt = db.prepare('INSERT INTO policies (client_id, type, policy_number, premium, expiry_date, agency_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const renewalStmt = db.prepare('INSERT INTO renewals (policy_id, due_date, status, agency_id) VALUES (?, ?, ?, ?)');

  for (let i = 0; i < 3; i++) {
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 3 + i);

    const policyRes = policyStmt.run(
      clientIds[i],
      policyTypes[i],
      'POL-' + String(100001 + i).padStart(6, '0'),
      [250, 450, 75][i],
      expiryDate.toISOString().split('T')[0],
      agencyId,
      'active'
    );

    const renewalDate = new Date(expiryDate);
    renewalDate.setDate(renewalDate.getDate() - 30);

    renewalStmt.run(
      policyRes.lastInsertRowid,
      renewalDate.toISOString().split('T')[0],
      'pending',
      agencyId
    );
  }

  console.log('✅ Database seeded successfully!');
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', db: 'sqlite', timestamp: new Date().toISOString() });
});

// Auth routes
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get(email);

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accessToken = jwt.sign(
      { userId: user.id, agencyId: user.agency_id, role: user.role },
      process.env.JWT_SECRET || 'dev-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      accessToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clients routes
app.get('/api/clients', (req, res) => {
  try {
    const agencyId = req.query.agencyId;
    const clients = db.prepare('SELECT * FROM clients WHERE agency_id = ? AND deleted_at IS NULL ORDER BY created_at DESC').all(agencyId);
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/clients/:id', (req, res) => {
  try {
    const client = db.prepare('SELECT * FROM clients WHERE id = ? AND deleted_at IS NULL').get(req.params.id);
    if (!client) return res.status(404).json({ error: 'Not found' });
    res.json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/clients', (req, res) => {
  try {
    const { name, email, phone, type, status, agencyId, notes } = req.body;
    const result = db.prepare('INSERT INTO clients (name, email, phone, type, status, agency_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      name, email, phone, type || 'prospect', status || 'active', agencyId, notes
    );
    res.status(201).json({ id: result.lastInsertRowid, name, email });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Renewals routes
app.get('/api/renewals', (req, res) => {
  try {
    const agencyId = req.query.agencyId;
    const renewals = db.prepare(`
      SELECT r.*, p.policy_number, c.name as client_name
      FROM renewals r
      JOIN policies p ON r.policy_id = p.id
      JOIN clients c ON p.client_id = c.id
      WHERE r.agency_id = ?
      ORDER BY r.due_date ASC
    `).all(agencyId);
    res.json(renewals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;

// Start server
initDatabase();
seedDatabase();

app.listen(PORT, () => {
  console.log(`✅ InsuraFlow API running on http://localhost:${PORT}`);
  console.log(`📊 Database: ${dbPath}`);
  console.log('\n🧪 TEST CREDENTIALS:');
  console.log('  Email: admin@insuraflow.com');
  console.log('  Password: Admin@123');
});
