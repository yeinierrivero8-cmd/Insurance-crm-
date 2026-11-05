const express = require('express');
const router = express.Router();
const xlsx = require('xlsx');
const PDFDocument = require('pdfkit');
const { pool } = require('../db/sqlite-pool');
const auditLog = require('../middleware/auditLogger');
const { authenticate } = require('../middleware/authMiddleware');
const allowedRoles = require('../middleware/roleBasedAccess');

// Helper to get all clients for a given agency
const getClientsForAgency = (agencyId) => {
  return new Promise((resolve, reject) => {
    pool.all(
      `SELECT id, name, email, phone, address, city, state, zip_code, type, status, notes, created_at, updated_at
       FROM clients
       WHERE agency_id = ? AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [agencyId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      }
    );
  });
};

// GET /api/export/clients/excel - Solo ver datos de su agencia
router.get('/clients/excel', authenticate, allowedRoles(['admin', 'agent']), async (req, res) => {
  try {
    // Usar agencyId del usuario autenticado
    const agencyId = req.user.agencyId;

    // Fetch clients
    const clients = await getClientsForAgency(agencyId);

    // Format data for Excel
    const excelData = clients.map(client => ({
      ID: client.id,
      Nombre: client.name,
      Email: client.email || '',
      Teléfono: client.phone || '',
      Dirección: client.address || '',
      Ciudad: client.city || '',
      Estado: client.state || '',
      'Código Postal': client.zip_code || '',
      Tipo: client.type || '',
      Estado_Cliente: client.status || '',
      Notas: client.notes || '',
      'Fecha Creación': client.created_at ? new Date(client.created_at).toLocaleDateString('es-ES') : '',
      'Última Actualización': client.updated_at ? new Date(client.updated_at).toLocaleDateString('es-ES') : ''
    }));

    // Create workbook
    const ws = xlsx.utils.json_to_sheet(excelData);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Clientes');

    // Set column widths
    ws['!cols'] = [
      { wch: 5 },   // ID
      { wch: 25 },  // Nombre
      { wch: 30 },  // Email
      { wch: 15 },  // Teléfono
      { wch: 25 },  // Dirección
      { wch: 15 },  // Ciudad
      { wch: 12 },  // Estado
      { wch: 12 },  // Código Postal
      { wch: 12 },  // Tipo
      { wch: 12 },  // Estado_Cliente
      { wch: 30 },  // Notas
      { wch: 15 },  // Fecha Creación
      { wch: 15 }   // Última Actualización
    ];

    // Generate Excel buffer
    const buffer = xlsx.write(wb, { bookType: 'xlsx', type: 'buffer' });

    // Send file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=clientes_${new Date().toISOString().split('T')[0]}.xlsx`);

    // Audit log
    try {
      auditLog(req, 'EXPORT_CLIENTS_EXCEL', { agencyId, count: clients.length });
    } catch (auditError) {
      console.error('Error writing audit log:', auditError);
    }

    res.send(buffer);
  } catch (error) {
    console.error('Export Excel error:', error);
    res.status(500).json({
      error: 'Error exportando a Excel',
      details: error.message
    });
  }
});

// GET /api/export/clients/pdf - Solo ver datos de su agencia
router.get('/clients/pdf', authenticate, allowedRoles(['admin', 'agent']), async (req, res) => {
  try {
    // Usar agencyId del usuario autenticado
    const agencyId = req.user.agencyId;

    // Fetch clients
    const clients = await getClientsForAgency(agencyId);

    // Create PDF document
    const doc = new PDFDocument({
      size: 'letter',
      margin: 50
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=clientes_${new Date().toISOString().split('T')[0]}.pdf`);

    doc.pipe(res);

    // Title
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('Reporte de Clientes', { align: 'center' });

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, { align: 'center' })
      .text(`Total de clientes: ${clients.length}`, { align: 'center' });

    doc.moveDown();

    // Table headers
    const pageWidth = 612;
    const colWidth = (pageWidth - 100) / 5;

    doc
      .fontSize(9)
      .font('Helvetica-Bold');

    const headerY = doc.y;
    doc.text('Nombre', 50, headerY, { width: colWidth, ellipsis: true });
    doc.text('Email', 50 + colWidth, headerY, { width: colWidth, ellipsis: true });
    doc.text('Teléfono', 50 + colWidth * 2, headerY, { width: colWidth, ellipsis: true });
    doc.text('Tipo', 50 + colWidth * 3, headerY, { width: colWidth, ellipsis: true });
    doc.text('Estado', 50 + colWidth * 4, headerY, { width: colWidth, ellipsis: true });

    doc.moveTo(50, doc.y + 5).lineTo(pageWidth - 50, doc.y + 5).stroke();
    doc.moveDown();

    // Table rows
    doc.fontSize(8).font('Helvetica');

    clients.forEach((client, index) => {
      const y = doc.y;

      doc.text(client.name || '-', 50, y, { width: colWidth, ellipsis: true });
      doc.text(client.email || '-', 50 + colWidth, y, { width: colWidth, ellipsis: true });
      doc.text(client.phone || '-', 50 + colWidth * 2, y, { width: colWidth, ellipsis: true });
      doc.text(client.type || '-', 50 + colWidth * 3, y, { width: colWidth, ellipsis: true });
      doc.text(client.status || '-', 50 + colWidth * 4, y, { width: colWidth, ellipsis: true });

      doc.moveDown();

      // Add a new page if we're running out of space
      if (doc.y > 700) {
        doc.addPage();
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('Nombre', 50, doc.y, { width: colWidth, ellipsis: true });
        doc.text('Email', 50 + colWidth, doc.y, { width: colWidth, ellipsis: true });
        doc.text('Teléfono', 50 + colWidth * 2, doc.y, { width: colWidth, ellipsis: true });
        doc.text('Tipo', 50 + colWidth * 3, doc.y, { width: colWidth, ellipsis: true });
        doc.text('Estado', 50 + colWidth * 4, doc.y, { width: colWidth, ellipsis: true });
        doc.moveTo(50, doc.y + 5).lineTo(pageWidth - 50, doc.y + 5).stroke();
        doc.moveDown();
        doc.fontSize(8).font('Helvetica');
      }
    });

    // Footer with page numbers
    doc.fontSize(8).text(`Generado el ${new Date().toLocaleString('es-ES')}`, 50, 750, { align: 'center' });

    // Audit log
    try {
      auditLog(req, 'EXPORT_CLIENTS_PDF', { agencyId, count: clients.length });
    } catch (auditError) {
      console.error('Error writing audit log:', auditError);
    }

    doc.end();
  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({
      error: 'Error exportando a PDF',
      details: error.message
    });
  }
});

module.exports = router;
