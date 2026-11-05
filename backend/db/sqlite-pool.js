const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create/open SQLite database
const dbPath = path.resolve(__dirname, 'insurance_crm.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database at', dbPath);
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');
  }
});

// Pool-like wrapper to maintain same interface as PostgreSQL pool
const pool = {
  async query(sql, params = []) {
    return new Promise((resolve, reject) => {
      try {
        // Convert PostgreSQL placeholders ($1, $2) to ? for SQLite
        let sqliteQuery = sql;
        let sqlParams = [];

        if (sql.includes('$')) {
          // Replace $1, $2, $3... with ? and reorder params
          sqliteQuery = sql.replace(/\$\d+/g, () => '?');
          sqlParams = params;
        } else {
          sqlParams = params;
        }

        // Check if query contains RETURNING (for INSERT/UPDATE with RETURNING *)
        const hasReturning = sqliteQuery.toUpperCase().includes('RETURNING');
        const isSelect = sql.trim().toUpperCase().startsWith('SELECT');

        if (isSelect || hasReturning) {
          db.all(sqliteQuery, sqlParams, (err, rows) => {
            if (err) {
              console.error('SQLite Query Error:', err.message, 'SQL:', sql);
              reject(err);
            } else {
              resolve({ rows: rows || [] });
            }
          });
        } else {
          db.run(sqliteQuery, sqlParams, function(err) {
            if (err) {
              console.error('SQLite Query Error:', err.message, 'SQL:', sql);
              reject(err);
            } else {
              resolve({
                rows: [],
                rowCount: this.changes,
                lastID: this.lastID
              });
            }
          });
        }
      } catch (error) {
        console.error('SQLite Query Error:', error.message, 'SQL:', sql);
        reject(error);
      }
    });
  },

  close() {
    db.close((err) => {
      if (err) console.error('Error closing database:', err.message);
    });
  }
};

module.exports = { pool, db };
