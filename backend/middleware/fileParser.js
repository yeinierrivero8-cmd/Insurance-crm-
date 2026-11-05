const xlsx = require('xlsx');
const Papa = require('papaparse');
const fs = require('fs');
const path = require('path');

const parseExcel = (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  return xlsx.utils.sheet_to_json(worksheet);
};

const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const file = fs.createReadStream(filePath);
    const results = [];

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: () => resolve(results),
      error: (error) => reject(error),
      step: (row) => {
        if (row.data && Object.keys(row.data).length > 0) {
          results.push(row.data);
        }
      }
    });
  });
};

const validateClientRow = (row) => {
  const errors = [];

  // Validate name
  if (!row.name || row.name.toString().trim().length < 2) {
    errors.push('Nombre requerido (mín 2 caracteres)');
  }

  // Validate email format
  if (row.email && row.email.toString().trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(row.email.toString().trim())) {
      errors.push('Email inválido');
    }
  }

  // Validate phone (at least 10 digits)
  if (row.phone && row.phone.toString().trim() !== '') {
    const phoneDigits = row.phone.toString().replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      errors.push('Teléfono debe tener al menos 10 dígitos');
    }
  }

  // Validate type
  if (row.type && row.type.toString().trim() !== '') {
    const validTypes = ['personal', 'empresa', 'prospecto'];
    if (!validTypes.includes(row.type.toString().toLowerCase().trim())) {
      errors.push('Tipo debe ser: personal, empresa o prospecto');
    }
  }

  // Validate status
  if (row.status && row.status.toString().trim() !== '') {
    const validStatuses = ['active', 'inactive', 'archived'];
    if (!validStatuses.includes(row.status.toString().toLowerCase().trim())) {
      errors.push('Estado debe ser: active, inactive o archived');
    }
  }

  return errors;
};

module.exports = { parseExcel, parseCSV, validateClientRow };
