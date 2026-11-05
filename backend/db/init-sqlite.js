const { db } = require('./sqlite-pool');
const bcrypt = require('bcrypt');

// Initialize SQLite database schema
function initDatabase() {
  console.log('Initializing SQLite database...');

  // Create agencies table
  db.exec(`
    CREATE TABLE IF NOT EXISTS agencies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      email TEXT,
      phone TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      zip_code TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agency_id INTEGER NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'agent',
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agency_id) REFERENCES agencies(id)
    )
  `);

  // Create clients table
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agency_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      zip_code TEXT,
      type TEXT DEFAULT 'personal',
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agency_id) REFERENCES agencies(id)
    )
  `);

  // Create policies table
  db.exec(`
    CREATE TABLE IF NOT EXISTS policies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      agency_id INTEGER NOT NULL,
      policy_number TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      start_date DATE,
      end_date DATE,
      premium DECIMAL(10, 2),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (agency_id) REFERENCES agencies(id)
    )
  `);

  // Create renewals table
  db.exec(`
    CREATE TABLE IF NOT EXISTS renewals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      policy_id INTEGER NOT NULL,
      client_id INTEGER NOT NULL,
      agency_id INTEGER NOT NULL,
      renewal_date DATE,
      status TEXT DEFAULT 'pending',
      commission DECIMAL(10, 2),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (policy_id) REFERENCES policies(id),
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (agency_id) REFERENCES agencies(id)
    )
  `);

  // Create refresh_tokens table
  db.exec(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      device_info TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Create audit_logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id INTEGER,
      changes TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  console.log('✅ Tables created successfully');

  // Seed default data
  seedData();
}

function seedData() {
  try {
    // Check if admin already exists
    const existingAdmin = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@insuraflow.com');

    if (existingAdmin) {
      console.log('ℹ️ Admin user already exists, skipping seed');
      return;
    }

    // Create default agency
    const agencyStmt = db.prepare(`
      INSERT INTO agencies (name, email, phone, city, state)
      VALUES (?, ?, ?, ?, ?)
    `);
    const agencyInfo = agencyStmt.run('InsuraFlow Agency', 'info@insuraflow.com', '(305) 555-0000', 'Miami', 'FL');
    const agencyId = agencyInfo.lastInsertRowid;

    // Hash password
    const passwordHash = bcrypt.hashSync('Admin@123', 10);

    // Create admin user
    const userStmt = db.prepare(`
      INSERT INTO users (agency_id, email, password_hash, name, role, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    userStmt.run(agencyId, 'admin@insuraflow.com', passwordHash, 'Admin User', 'admin', true);

    // Create agent user
    const agentHash = bcrypt.hashSync('Agent@123', 10);
    userStmt.run(agencyId, 'agent@insuraflow.com', agentHash, 'Agent User', 'agent', true);

    // Create viewer user
    const viewerHash = bcrypt.hashSync('Viewer@123', 10);
    userStmt.run(agencyId, 'viewer@insuraflow.com', viewerHash, 'Viewer User', 'viewer', true);

    console.log('✅ Seed data created successfully');
  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
  }
}

// Run initialization
if (require.main === module) {
  try {
    initDatabase();
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  }
}

module.exports = { initDatabase };
