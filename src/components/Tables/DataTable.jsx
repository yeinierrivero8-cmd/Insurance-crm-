import React, { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * DataTable Component - Sortable, paginated table
 * Supports: sorting, pagination, responsive layout
 */
const DataTable = ({
  columns, // [{ key, label, sortable, render }]
  data = [],
  pageSize = 20,
  onRowClick,
  isLoading = false,
  error = null,
  emptyMessage = 'No data'
}) => {
  const [sortKey, setSortKey] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(0);

  // Sort data
  let sortedData = [...data];
  if (sortKey) {
    sortedData.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (typeof aVal === 'string') {
        return sortOrder === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortOrder === 'asc'
        ? aVal - bVal
        : bVal - aVal;
    });
  }

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const pageData = sortedData.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );

  // Handle sort
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
    setCurrentPage(0);
  };

  // Loading state
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px 20px',
        color: '#6b7280'
      }}>
        Loading...
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px 20px',
        color: '#ef4444',
        textAlign: 'center'
      }}>
        <p>{error}</p>
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px 20px',
        color: '#9ca3af',
        textAlign: 'center'
      }}>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      {/* Table */}
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '14px'
      }}>
        <thead>
          <tr style={{
            background: '#f9fafb',
            borderBottom: '2px solid #e5e7eb'
          }}>
            {columns.map(col => (
              <th
                key={col.key}
                onClick={() => col.sortable && handleSort(col.key)}
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: '#374151',
                  cursor: col.sortable ? 'pointer' : 'default',
                  userSelect: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {col.label}
                {col.sortable && (
                  sortKey === col.key ? (
                    sortOrder === 'asc'
                      ? <ChevronUp size={16} />
                      : <ChevronDown size={16} />
                  ) : (
                    <span style={{ opacity: 0.3 }}><ChevronUp size={16} /></span>
                  )
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pageData.map((row, idx) => (
            <tr
              key={idx}
              onClick={() => onRowClick && onRowClick(row)}
              style={{
                borderBottom: '1px solid #e5e7eb',
                background: onRowClick ? '#f9fafb' : 'white',
                cursor: onRowClick ? 'pointer' : 'default',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => {
                if (onRowClick) e.currentTarget.style.background = '#f3f4f6';
              }}
              onMouseLeave={e => {
                if (onRowClick) e.currentTarget.style.background = '#f9fafb';
              }}
            >
              {columns.map(col => (
                <td
                  key={col.key}
                  style={{
                    padding: '12px 16px',
                    color: '#111827'
                  }}
                >
                  {col.render
                    ? col.render(row[col.key], row)
                    : row[col.key]
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 16px',
          borderTop: '1px solid #e5e7eb',
          background: '#f9fafb'
        }}>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>
            Page {currentPage + 1} of {totalPages} ({data.length} total)
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              style={{
                padding: '6px 12px',
                background: currentPage === 0 ? '#f3f4f6' : 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: currentPage === 0 ? 'default' : 'pointer',
                color: currentPage === 0 ? '#9ca3af' : '#374151',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px'
              }}
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1}
              style={{
                padding: '6px 12px',
                background: currentPage === totalPages - 1 ? '#f3f4f6' : 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: currentPage === totalPages - 1 ? 'default' : 'pointer',
                color: currentPage === totalPages - 1 ? '#9ca3af' : '#374151',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px'
              }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
