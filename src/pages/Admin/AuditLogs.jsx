import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { Card, Badge, Button, Input, LoadingSpinner } from '../../components';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';

/**
 * Admin - Audit Logs Page
 * Display audit logs with filtering by action, user, and date range
 */
function AuditLogs() {
  const { get, loading } = useApi();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [error, setError] = useState(null);

  const limit = 100;

  const fetchLogs = async (page = 1) => {
    try {
      setError(null);
      const params = new URLSearchParams({
        limit,
        offset: (page - 1) * limit,
        action: actionFilter,
        user_id: userFilter
      });

      const res = await get(`/api/admin/audit-logs?${params}`);
      setLogs(res.data || []);
      setTotal(res.total || 0);
      setCurrentPage(page);
    } catch (err) {
      setError(err.message || 'Failed to load audit logs');
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [actionFilter, userFilter]);

  const pageCount = Math.ceil(total / limit);

  if (loading && logs.length === 0) {
    return <LoadingSpinner text="Loading audit logs..." />;
  }

  const getActionColor = (action) => {
    if (action.includes('CREATE')) return 'success';
    if (action.includes('DELETE')) return 'danger';
    if (action.includes('UPDATE')) return 'warning';
    return 'info';
  };

  return (
    <div style={{ padding: '20px 40px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '700', color: '#111827' }}>
          Audit Logs
        </h1>
        <p style={{ margin: '0', color: '#6b7280', fontSize: '14px' }}>
          Track all system actions and changes
        </p>
      </div>

      {error && (
        <div style={{
          padding: '12px 16px',
          background: '#fee2e2',
          border: '1px solid #fca5a5',
          borderRadius: '8px',
          color: '#991b1b',
          fontSize: '14px',
          marginBottom: '24px'
        }}>
          {error}
        </div>
      )}

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <Input
          placeholder="Filter by action..."
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          style={{ flex: 1, minWidth: '200px' }}
        />
        <Input
          placeholder="Filter by user ID..."
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          style={{ minWidth: '150px' }}
        />
      </div>

      {/* Table */}
      <Card>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px'
        }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#111827' }}>
                Timestamp
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#111827' }}>
                User
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#111827' }}>
                Action
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#111827' }}>
                Resource
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#111827' }}>
                Details
              </th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr
                key={log.id}
                style={{ borderBottom: '1px solid #e5e7eb' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: '13px', whiteSpace: 'nowrap' }}>
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td style={{ padding: '12px 16px', color: '#111827', fontWeight: '500' }}>
                  {log.user_name || log.user_email || 'System'}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <Badge variant={getActionColor(log.action)}>
                    {log.action}
                  </Badge>
                </td>
                <td style={{ padding: '12px 16px', color: '#6b7280' }}>
                  {log.resource || '-'}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <Button variant="ghost" size="sm">
                    <Eye size={16} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Pagination */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '24px',
        fontSize: '14px',
        color: '#6b7280'
      }}>
        <div>
          Showing {logs.length > 0 ? (currentPage - 1) * limit + 1 : 0} to {Math.min(currentPage * limit, total)} of {total}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="secondary"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => fetchLogs(currentPage - 1)}
          >
            <ChevronLeft size={16} /> Previous
          </Button>
          <span style={{ padding: '6px 12px' }}>
            Page {currentPage} of {pageCount}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={currentPage === pageCount}
            onClick={() => fetchLogs(currentPage + 1)}
          >
            Next <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AuditLogs;
