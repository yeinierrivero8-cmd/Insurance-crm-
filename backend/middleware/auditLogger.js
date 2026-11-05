const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFile = path.join(logsDir, 'audit.log');

/**
 * Log an audit entry for sensitive operations
 * @param {Object} req - Express request object
 * @param {string} action - Action being performed (e.g., 'LOGIN_SUCCESS', 'CLIENT_CREATED')
 * @param {Object} details - Additional details about the action
 */
const auditLog = (req, action, details = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    userId: req.user?.id || 'anonymous',
    userEmail: req.user?.email || 'anonymous',
    action,
    endpoint: req.path,
    method: req.method,
    ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
    details,
    userAgent: req.headers['user-agent'] || 'unknown'
  };

  try {
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
    console.log(`[AUDIT] ${action} by ${logEntry.userEmail} at ${logEntry.timestamp}`);
  } catch (error) {
    console.error('Error writing audit log:', error.message);
  }
};

module.exports = auditLog;
