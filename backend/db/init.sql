-- Create agencies table
CREATE TABLE IF NOT EXISTS agencies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subscription_tier VARCHAR(50) DEFAULT 'free',
  plan_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  agency_id INTEGER NOT NULL REFERENCES agencies(id),
  role VARCHAR(50) DEFAULT 'agent' CHECK(role IN ('admin', 'agent', 'viewer')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  type VARCHAR(50) DEFAULT 'prospect' CHECK(type IN ('prospect', 'customer', 'renewal')),
  status VARCHAR(50) DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'pending')),
  agency_id INTEGER NOT NULL REFERENCES agencies(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Create policies table
CREATE TABLE IF NOT EXISTS policies (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id),
  type VARCHAR(50) NOT NULL,
  policy_number VARCHAR(100) UNIQUE,
  premium DECIMAL(10, 2),
  expiry_date DATE,
  agency_id INTEGER NOT NULL REFERENCES agencies(id),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create renewals table
CREATE TABLE IF NOT EXISTS renewals (
  id SERIAL PRIMARY KEY,
  policy_id INTEGER NOT NULL REFERENCES policies(id),
  due_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK(status IN ('pending', 'renewed', 'expired')),
  agency_id INTEGER NOT NULL REFERENCES agencies(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  resource VARCHAR(100),
  resource_id INTEGER,
  changes JSONB,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_users_agency ON users(agency_id);
CREATE INDEX idx_clients_agency ON clients(agency_id);
CREATE INDEX idx_policies_agency ON policies(agency_id);
CREATE INDEX idx_renewals_agency ON renewals(agency_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
