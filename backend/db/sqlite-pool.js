const Database = require('better-sqlite3');
const path = require('path');

// Create/open SQLite database
const dbPath = path.resolve(__dirname, 'insurance_crm.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Pool-like wrapper to maintain same interface as PostgreSQL pool
const pool = {
  async query(sql, params = []) {
    try {
      // Convert PostgreSQL placeholders ($1, $2) to ? for SQLite
      let sqliteQuery = sql;
      if (sql.includes('$')) {
        let paramIndex = 1;
        sqliteQuery = sql.replace(/\$\d+/g, () => '?');
      }

      // Execute query
      const stmt = db.prepare(sqliteQuery);

      // Determine if this is a SELECT or INSERT/UPDATE/DELETE
      const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
      const isInsert = sql.trim().toUpperCase().startsWith('INSERT');
      const isReturning = sql.includes('RETURNING');

      if (isSelect) {
        const rows = stmt.all(...params);
        return { rows: rows || [] };
      } else if (isInsert && isReturning) {
        // For INSERT ... RETURNING, execute and return last insert row
        const info = stmt.run(...params);
        // Execute a SELECT to get the inserted row
        const selectSql = sql.substring(0, sql.indexOf('RETURNING')).trim();
        const selectStmt = db.prepare(`SELECT * FROM (${selectSql}) LIMIT 1`);
        const rows = selectStmt.all(...params);
        return { rows: rows || [] };
      } else {
        // For UPDATE, DELETE, or simple INSERT
        const info = stmt.run(...params);
        return {
          rows: [],
          rowCount: info.changes,
          lastID: info.lastInsertRowid
        };
      }
    } catch (error) {
      console.error('SQLite Query Error:', error.message, 'SQL:', sql);
      throw error;
    }
  },

  close() {
    db.close();
  }
};

module.exports = { pool, db };
