const fs = require('fs');
const path = require('path');

/**
 * Create a backup of the database file
 * Maintains only the latest 7 backups
 */
const backupDatabase = () => {
  const dbPath = path.join(__dirname, '../db/insurance_crm.db');
  const backupDir = path.join(__dirname, '../backups');

  // Create backup directory if it doesn't exist
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Check if database file exists
  if (!fs.existsSync(dbPath)) {
    console.log('[BACKUP] Database file not found. Skipping backup.');
    return;
  }

  try {
    // Create timestamp for backup file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const backupPath = path.join(backupDir, `backup-${timestamp}.db`);

    // Copy database file to backup location
    fs.copyFileSync(dbPath, backupPath);
    console.log(`✅ [BACKUP] Database backup created: ${backupPath}`);

    // Maintain only the latest 7 backups
    const files = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('backup-') && file.endsWith('.db'))
      .sort()
      .reverse();

    if (files.length > 7) {
      const filesToDelete = files.slice(7);
      filesToDelete.forEach(file => {
        const filePath = path.join(backupDir, file);
        fs.unlinkSync(filePath);
        console.log(`🗑️  [BACKUP] Removed old backup: ${file}`);
      });
    }
  } catch (error) {
    console.error('❌ [BACKUP] Error during backup:', error.message);
  }
};

/**
 * Schedule automatic backups
 * Default: every 6 hours
 */
const scheduleBackups = (intervalHours = 6) => {
  // Initial backup on startup
  backupDatabase();

  // Schedule periodic backups
  const intervalMs = intervalHours * 60 * 60 * 1000;
  setInterval(backupDatabase, intervalMs);

  console.log(`📅 [BACKUP] Automatic backups scheduled every ${intervalHours} hours`);
};

module.exports = { backupDatabase, scheduleBackups };
