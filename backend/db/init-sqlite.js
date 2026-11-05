const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.resolve(__dirname, 'insurance_crm.db');
const db = new sqlite3.Database(dbPath);

// Helper to run queries sequentially
const runAsync = (sql) => new Promise((resolve, reject) => {
  db.run(sql, (err) => {
    if (err) reject(err);
    else resolve();
  });
});

const getAsync = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => {
    if (err) reject(err);
    else resolve(row);
  });
});

const runWithParams = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function(err) {
    if (err) reject(err);
    else resolve({ lastID: this.lastID, changes: this.changes });
  });
});

// Initialize SQLite database schema
async function initDatabase() {
  try {
    console.log('Initializing SQLite database...');

    // Enable foreign keys
    await runAsync('PRAGMA foreign_keys = ON');

    // Create agencies table
    await runAsync(`
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
    await runAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agency_id INTEGER NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'agent',
        is_active BOOLEAN DEFAULT TRUE,
        two_factor_enabled BOOLEAN DEFAULT 0,
        two_factor_secret TEXT,
        backup_codes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (agency_id) REFERENCES agencies(id)
      )
    `);

    // Create clients table
    await runAsync(`
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
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        deleted_at DATETIME,
        FOREIGN KEY (agency_id) REFERENCES agencies(id)
      )
    `);

    // Create policies table
    await runAsync(`
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
    await runAsync(`
      CREATE TABLE IF NOT EXISTS renewals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        policy_id INTEGER NOT NULL,
        client_id INTEGER NOT NULL,
        agency_id INTEGER NOT NULL,
        renewal_date DATE,
        due_date DATE,
        status TEXT DEFAULT 'pending',
        commission DECIMAL(10, 2),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (policy_id) REFERENCES policies(id),
        FOREIGN KEY (client_id) REFERENCES clients(id),
        FOREIGN KEY (agency_id) REFERENCES agencies(id)
      )
    `);

    // Create refresh_tokens table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        device_info TEXT,
        ip_address TEXT,
        is_revoked BOOLEAN DEFAULT 0,
        last_used_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create audit_logs table
    await runAsync(`
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
    await seedData();
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  }
}

async function seedData() {
  try {
    // Check if admin already exists
    const existingAdmin = await getAsync('SELECT * FROM users WHERE email = ?', ['admin@insuraflow.com']);

    if (existingAdmin) {
      console.log('ℹ️ Admin user already exists, skipping seed');
      return;
    }

    // Create default agency
    const agencyInfo = await runWithParams(
      `INSERT INTO agencies (name, email, phone, city, state) VALUES (?, ?, ?, ?, ?)`,
      ['InsuraFlow Agency', 'info@insuraflow.com', '(305) 555-0000', 'Miami', 'FL']
    );
    const agencyId = agencyInfo.lastID;

    // Hash password
    const passwordHash = bcrypt.hashSync('Admin@123', 10);

    // Create admin user
    await runWithParams(
      `INSERT INTO users (agency_id, email, password_hash, name, role, is_active) VALUES (?, ?, ?, ?, ?, ?)`,
      [agencyId, 'admin@insuraflow.com', passwordHash, 'Admin User', 'admin', 1]
    );

    // Create agent user
    const agentHash = bcrypt.hashSync('Agent@123', 10);
    await runWithParams(
      `INSERT INTO users (agency_id, email, password_hash, name, role, is_active) VALUES (?, ?, ?, ?, ?, ?)`,
      [agencyId, 'agent@insuraflow.com', agentHash, 'Agent User', 'agent', 1]
    );

    // Create viewer user
    const viewerHash = bcrypt.hashSync('Viewer@123', 10);
    await runWithParams(
      `INSERT INTO users (agency_id, email, password_hash, name, role, is_active) VALUES (?, ?, ?, ?, ?, ?)`,
      [agencyId, 'viewer@insuraflow.com', viewerHash, 'Viewer User', 'viewer', 1]
    );

    console.log('✅ Seed data created successfully');
  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
  }
}

// Run initialization
if (require.main === module) {
  initDatabase().then(() => {
    console.log('✅ Database ready');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

module.exports = { initDatabase };
