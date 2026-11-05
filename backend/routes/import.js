const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool } = require('../db/sqlite-pool');
const { parseExcel, parseCSV, validateClientRow } = require('../middleware/fileParser');
const auditLog = require('../middleware/auditLogger');
const { authenticate } = require('../middleware/authMiddleware');
const allowedRoles = require('../middleware/roleBasedAccess');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for file upload
const upload = multer({
  dest: uploadsDir,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.xlsx', '.xls', '.csv'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls) o CSV (.csv)'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});

// POST /api/import/clients - Solo admin puede importar
router.post('/clients', authenticate, allowedRoles(['admin']), upload.single('file'), async (req, res) => {
  try {
    // Usar agencyId del usuario autenticado
    const agencyId = req.user.agencyId;

    // Check if file exists
    if (!req.file) {
      return res.status(400).json({ error: 'Archivo requerido' });
    }

    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();

    // Parse file based on extension
    let clients = [];
    try {
      if (['.xlsx', '.xls'].includes(ext)) {
        clients = parseExcel(filePath);
      } else if (ext === '.csv') {
        clients = await parseCSV(filePath);
      }
    } catch (parseError) {
      fs.unlinkSync(filePath);
      return res.status(400).json({
        error: 'Error al procesar archivo',
        details: parseError.message
      });
    }

    if (!clients || clients.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'El archivo no contiene datos' });
    }

    // Process and insert clients
    const results = {
      total: clients.length,
      successful: 0,
      failed: 0,
      errors: []
    };

    for (let i = 0; i < clients.length; i++) {
      const row = clients[i];
      const errors = validateClientRow(row);

      if (errors.length > 0) {
        results.failed++;
        results.errors.push({
          row: i + 2, // +2 because row 1 is header, i is 0-indexed
          errors: errors
        });
        continue;
      }

      try {
        // Prepare data
        const name = row.name.toString().trim();
        const email = row.email ? row.email.toString().trim() || null : null;
        const phone = row.phone ? row.phone.toString().trim() || null : null;
        const type = (row.type || 'personal').toString().toLowerCase().trim();
        const status = (row.status || 'active').toString().toLowerCase().trim();
        const notes = row.notes ? row.notes.toString().trim() || null : null;

        // Insert client
        await new Promise((resolve, reject) => {
          pool.run(
            `INSERT INTO clients (agency_id, name, email, phone, type, status, notes, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [agencyId, name, email, phone, type, status, notes],
            function(err) {
              if (err) reject(err);
              else resolve({ lastID: this.lastID });
            }
          );
        });

        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: i + 2,
          errors: [error.message]
        });
      }
    }

    // Clean up upload file
    try {
      fs.unlinkSync(filePath);
    } catch (cleanupError) {
      console.error('Error deleting temp file:', cleanupError);
    }

    // Audit log
    try {
      auditLog(req, 'BULK_IMPORT_CLIENTS', {
        agencyId,
        total: results.total,
        successful: results.successful,
        failed: results.failed
      });
    } catch (auditError) {
      console.error('Error writing audit log:', auditError);
    }

    res.json(results);
  } catch (error) {
    // Clean up file if error occurs
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error('Error cleaning up file:', e);
      }
    }

    res.status(500).json({
      error: 'Error procesando importación',
      details: error.message
    });
  }
});

module.exports = router;
