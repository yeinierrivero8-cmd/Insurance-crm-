const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function seedDatabase() {
  try {
    console.log('🌱 Seeding database...');

    // Clear existing data
    await pool.query('TRUNCATE TABLE audit_logs RESTART IDENTITY CASCADE');
    await pool.query('TRUNCATE TABLE renewals RESTART IDENTITY CASCADE');
    await pool.query('TRUNCATE TABLE policies RESTART IDENTITY CASCADE');
    await pool.query('TRUNCATE TABLE clients RESTART IDENTITY CASCADE');
    await pool.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE');
    await pool.query('TRUNCATE TABLE agencies RESTART IDENTITY CASCADE');

    // Create agency
    const agencyRes = await pool.query(
      `INSERT INTO agencies (name, subscription_tier)
       VALUES ($1, $2) RETURNING id`,
      ['InsuraFlow Demo Agency', 'premium']
    );
    const agencyId = agencyRes.rows[0].id;
    console.log(`✅ Agency created: ${agencyId}`);

    // Create admin user
    const adminPassword = await bcrypt.hash('Admin@123', 12);
    const adminRes = await pool.query(
      `INSERT INTO users (email, name, password_hash, agency_id, role)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      ['admin@insuraflow.com', 'Admin User', adminPassword, agencyId, 'admin']
    );
    console.log(`✅ Admin user created`);

    // Create agent users
    const agentPassword = await bcrypt.hash('Agent@123', 12);
    for (let i = 1; i <= 3; i++) {
      await pool.query(
        `INSERT INTO users (email, name, password_hash, agency_id, role)
         VALUES ($1, $2, $3, $4, $5)`,
        [`agent${i}@insuraflow.com`, `Agent ${i}`, agentPassword, agencyId, 'agent']
      );
    }
    console.log(`✅ 3 agent users created`);

    // Create test clients
    const clientNames = [
      'Maria Garcia', 'Carlos Rodriguez', 'Ana Martinez',
      'Juan Pérez', 'Sofia López', 'Miguel Fernández',
      'Isabel Ruiz', 'Diego Sánchez', 'Laura Jiménez', 'Francisco Torres'
    ];

    const clientIds = [];
    for (let i = 0; i < clientNames.length; i++) {
      const res = await pool.query(
        `INSERT INTO clients (name, email, phone, type, status, agency_id)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [
          clientNames[i],
          `${clientNames[i].toLowerCase().replace(' ', '.')}@email.com`,
          `+1-555-${String(1000 + i).padStart(4, '0')}`,
          i < 3 ? 'customer' : 'prospect',
          i < 3 ? 'active' : 'pending',
          agencyId
        ]
      );
      clientIds.push(res.rows[0].id);
    }
    console.log(`✅ 10 test clients created`);

    // Create policies for active customers
    for (let i = 0; i < 3; i++) {
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + (3 + i));

      const res = await pool.query(
        `INSERT INTO policies (client_id, type, policy_number, premium, expiry_date, agency_id, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [
          clientIds[i],
          ['auto', 'home', 'life'][i],
          `POL-${String(100001 + i).padStart(6, '0')}`,
          [250.00, 450.00, 75.00][i],
          expiryDate,
          agencyId,
          'active'
        ]
      );

      // Create renewal for each policy
      const renewalDate = new Date(expiryDate);
      renewalDate.setDate(renewalDate.getDate() - 30);

      await pool.query(
        `INSERT INTO renewals (policy_id, due_date, status, agency_id)
         VALUES ($1, $2, $3, $4)`,
        [res.rows[0].id, renewalDate, 'pending', agencyId]
      );
    }
    console.log(`✅ 3 policies + renewals created`);

    // Create audit log for seed
    await pool.query(
      `INSERT INTO audit_logs (action, resource, changes)
       VALUES ($1, $2, $3)`,
      ['SEED', 'database', JSON.stringify({ action: 'database seeded', timestamp: new Date() })]
    );

    console.log('✅ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
}

seedDatabase();
