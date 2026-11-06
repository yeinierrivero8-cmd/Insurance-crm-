const Database = require('better-sqlite3');
const path = require('path');

// Create/open SQLite database
const dbPath = path.resolve(__dirname, 'insurance_crm.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');
console.log('✅ Connected to SQLite database at', dbPath);

// Pool-like wrapper to maintain same interface as PostgreSQL pool
const pool = {
  async query(sql, params = []) {
    return new Promise((resolve, reject) => {
      try {
        // Convert PostgreSQL placeholders ($1, $2) to ? for SQLite
        let sqliteQuery = sql;
        let sqlParams = params;

        if (sql.includes('$')) {
          // Replace $1, $2, $3... with ? in order (maintain param order)
          sqliteQuery = sql.replace(/\$\d+/g, () => '?');
        }

        // Check if query contains RETURNING (for INSERT/UPDATE with RETURNING *)
        const hasReturning = sqliteQuery.toUpperCase().includes('RETURNING');
        const isSelect = sql.trim().toUpperCase().startsWith('SELECT');

        try {
          if (isSelect || hasReturning) {
            const rows = db.prepare(sqliteQuery).all(...sqlParams);
            resolve({ rows: rows || [] });
          } else {
            const stmt = db.prepare(sqliteQuery);
            const info = stmt.run(...sqlParams);
            resolve({
              rows: [],
              rowCount: info.changes,
              lastID: info.lastInsertRowid
            });
          }
        } catch (err) {
          console.error('SQLite Query Error:', err.message, 'SQL:', sql);
          reject(err);
        }
      } catch (error) {
        console.error('SQLite Query Error:', error.message, 'SQL:', sql);
        reject(error);
      }
    });
  },

  close() {
    try {
      db.close();
    } catch (err) {
      console.error('Error closing database:', err.message);
    }
  }
};

module.exports = { pool, db };
