import React, { useState } from 'react';
import { Download, Upload, AlertCircle, CheckCircle, Loader } from 'lucide-react';

export default function ImportExportPanel({ agencyId, onImportSuccess }) {
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleImport = async (file) => {
    if (!file) return;

    // Validate file type
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      setImportStatus({
        error: 'Tipo de archivo no válido',
        details: 'Solo se permiten archivos Excel (.xlsx, .xls) o CSV'
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setImportStatus({
        error: 'Archivo demasiado grande',
        details: 'El tamaño máximo es 10MB'
      });
      return;
    }

    setImporting(true);
    setImportStatus(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('agencyId', agencyId);

    try {
      const response = await fetch('/api/import/clients', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        setImportStatus({
          error: result.error || 'Error en la importación',
          details: result.details
        });
      } else {
        setImportStatus(result);
        if (onImportSuccess) {
          setTimeout(() => {
            onImportSuccess();
          }, 1500);
        }
      }
    } catch (error) {
      setImportStatus({
        error: 'Error de conexión',
        details: error.message
      });
    } finally {
      setImporting(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleImport(e.target.files[0]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImport(e.dataTransfer.files[0]);
    }
  };

  const handleExport = async (format) => {
    setExporting(true);
    try {
      const url = `/api/export/clients/${format}?agencyId=${agencyId}`;
      window.location.href = url;
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="import-export-panel">
      <style>{`
        .import-export-panel {
          background: white;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          padding: 24px;
          margin-bottom: 24px;
        }

        .import-export-panel h3 {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 24px 0;
          color: #111827;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .import-export-sections {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        @media (max-width: 768px) {
          .import-export-sections {
            grid-template-columns: 1fr;
          }
        }

        .import-section,
        .export-section {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          background: #f9fafb;
        }

        .import-section h4,
        .export-section h4 {
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 12px 0;
          color: #374151;
        }

        .import-section p,
        .export-section p {
          font-size: 13px;
          color: #6b7280;
          margin: 0 0 12px 0;
        }

        .file-input-wrapper {
          position: relative;
          margin-bottom: 12px;
        }

        .file-input-label {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 16px;
          border: 2px dashed #d1d5db;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 13px;
          font-weight: 500;
          color: #4b5563;
        }

        .file-input-label:hover {
          border-color: #9ca3af;
          background: #f3f4f6;
        }

        .file-input-label.active {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .file-input-wrapper input[type="file"] {
          display: none;
        }

        .export-buttons {
          display: flex;
          gap: 8px;
        }

        .export-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 14px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          transition: all 0.2s;
        }

        .export-btn:hover:not(:disabled) {
          background: #f3f4f6;
          border-color: #d1d5db;
        }

        .export-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .import-status {
          margin-top: 12px;
          padding: 12px;
          border-radius: 6px;
          font-size: 13px;
        }

        .import-status.success {
          background: #dcfce7;
          border: 1px solid #86efac;
          color: #166534;
        }

        .import-status.error {
          background: #fee2e2;
          border: 1px solid #fca5a5;
          color: #991b1b;
        }

        .import-status.success-header,
        .import-status.error-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .import-status-detail {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 12px;
        }

        .status-item {
          text-align: center;
        }

        .status-number {
          font-size: 20px;
          font-weight: 700;
        }

        .status-label {
          font-size: 11px;
          opacity: 0.8;
          margin-top: 4px;
        }

        .import-errors {
          margin-top: 12px;
        }

        .import-errors summary {
          cursor: pointer;
          font-weight: 500;
          color: inherit;
        }

        .import-errors details[open] summary {
          margin-bottom: 8px;
        }

        .error-list {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 4px;
          padding: 8px;
          max-height: 200px;
          overflow-y: auto;
          font-size: 12px;
        }

        .error-item {
          padding: 4px;
          margin: 2px 0;
        }

        .loading-spinner {
          display: inline-block;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <h3>
        <Upload size={18} />
        Importar/Exportar Clientes
      </h3>

      <div className="import-export-sections">
        {/* Import Section */}
        <div className="import-section">
          <h4>📥 Importar desde archivo</h4>
          <p>Soporta Excel (.xlsx, .xls) y CSV</p>

          <div
            className={`file-input-wrapper ${dragActive ? 'active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <label
              className={`file-input-label ${dragActive ? 'active' : ''}`}
              htmlFor="file-input"
            >
              {importing ? (
                <>
                  <Loader size={16} className="loading-spinner" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Selecciona archivo o arrastra aquí
                </>
              )}
            </label>
            <input
              id="file-input"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              disabled={importing}
            />
          </div>

          {importStatus && (
            <div className={`import-status ${importStatus.error ? 'error' : 'success'}`}>
              <div className={`import-status-${importStatus.error ? 'error' : 'success'}-header`}>
                {importStatus.error ? (
                  <>
                    <AlertCircle size={16} />
                    {importStatus.error}
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Importación completada
                  </>
                )}
              </div>

              {!importStatus.error && (
                <>
                  <div className="import-status-detail">
                    <div className="status-item">
                      <div className="status-number">{importStatus.total}</div>
                      <div className="status-label">Total</div>
                    </div>
                    <div className="status-item">
                      <div className="status-number" style={{ color: '#22c55e' }}>
                        {importStatus.successful}
                      </div>
                      <div className="status-label">Exitosos</div>
                    </div>
                    <div className="status-item">
                      <div className="status-number" style={{ color: '#ef4444' }}>
                        {importStatus.failed}
                      </div>
                      <div className="status-label">Fallidos</div>
                    </div>
                  </div>

                  {importStatus.errors && importStatus.errors.length > 0 && (
                    <div className="import-errors">
                      <details>
                        <summary>Ver {importStatus.errors.length} errores</summary>
                        <div className="error-list">
                          {importStatus.errors.map((err, i) => (
                            <div key={i} className="error-item">
                              <strong>Fila {err.row}:</strong> {err.errors.join(', ')}
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}
                </>
              )}

              {importStatus.error && importStatus.details && (
                <p style={{ margin: '8px 0 0 0', fontSize: '12px' }}>
                  {importStatus.details}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Export Section */}
        <div className="export-section">
          <h4>📥 Exportar clientes</h4>
          <p>Descarga todos los clientes en tu formato preferido</p>

          <div className="export-buttons">
            <button
              className="export-btn"
              onClick={() => handleExport('excel')}
              disabled={exporting}
              title="Descargar en formato Excel"
            >
              {exporting ? (
                <>
                  <Loader size={16} className="loading-spinner" />
                  Descargando...
                </>
              ) : (
                <>
                  <Download size={16} />
                  Excel
                </>
              )}
            </button>
            <button
              className="export-btn"
              onClick={() => handleExport('pdf')}
              disabled={exporting}
              title="Descargar en formato PDF"
            >
              {exporting ? (
                <>
                  <Loader size={16} className="loading-spinner" />
                  Descargando...
                </>
              ) : (
                <>
                  <Download size={16} />
                  PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
