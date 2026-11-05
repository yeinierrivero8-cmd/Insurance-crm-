import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { Card, Badge, Button, LoadingSpinner } from '../components';
import { ChevronLeft, ChevronRight, CheckCircle, Clock } from 'lucide-react';

/**
 * RenewalsList Page - Display pending and completed renewals
 */
function RenewalsList() {
  const { get, put, loading } = useApi();
  const [renewals, setRenewals] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [error, setError] = useState(null);

  const limit = 50;

  const fetchRenewals = async (page = 1) => {
    try {
      setError(null);
      const params = new URLSearchParams({
        limit,
        offset: (page - 1) * limit,
        status: statusFilter,
        sort: 'due_date:asc'
      });

      const res = await get(`/api/renewals?${params}`);
      setRenewals(res.data || []);
      setTotal(res.total || 0);
      setCurrentPage(page);
    } catch (err) {
      setError(err.message || 'Failed to load renewals');
    }
  };

  useEffect(() => {
    fetchRenewals(1);
  }, [statusFilter]);

  const handleMarkComplete = async (renewalId) => {
    try {
      await put(`/api/renewals/${renewalId}`, { status: 'completed' });
      fetchRenewals(currentPage);
    } catch (err) {
      setError(err.message || 'Failed to update renewal');
    }
  };

  const pageCount = Math.ceil(total / limit);

  // Calculate days until due
  const daysUntilDue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (loading && renewals.length === 0) {
    return <LoadingSpinner text="Loading renewals..." />;
  }

  return (
    <div style={{ padding: '20px 40px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '700', color: '#111827' }}>
          Renewals
        </h1>
        <p style={{ margin: '0', color: '#6b7280', fontSize: '14px' }}>
          Total: {total} renewals
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

      {/* Status Filter */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setStatusFilter('pending')}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              background: statusFilter === 'pending' ? '#667eea' : '#e5e7eb',
              color: statusFilter === 'pending' ? 'white' : '#6b7280',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
          >
            <Clock size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
            Pending
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              background: statusFilter === 'completed' ? '#10b981' : '#e5e7eb',
              color: statusFilter === 'completed' ? 'white' : '#6b7280',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
          >
            <CheckCircle size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
            Completed
          </button>
        </div>
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
                Client
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#111827' }}>
                Policy #
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#111827' }}>
                Type
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#111827' }}>
                Due Date
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#111827' }}>
                Days Left
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#111827' }}>
                Status
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#111827' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {renewals.map(renewal => {
              const days = daysUntilDue(renewal.due_date);
              return (
                <tr
                  key={renewal.id}
                  style={{ borderBottom: '1px solid #e5e7eb' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 16px', color: '#111827', fontWeight: '500' }}>
                    {renewal.client_name}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6b7280' }}>
                    {renewal.policy_number}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <Badge variant="info">{renewal.policy_type}</Badge>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6b7280' }}>
                    {new Date(renewal.due_date).toLocaleDateString()}
                  </td>
                  <td style={{
                    padding: '12px 16px',
                    color: days <= 7 ? '#dc2626' : days <= 30 ? '#f59e0b' : '#6b7280',
                    fontWeight: days <= 7 ? '600' : '500'
                  }}>
                    {days} days
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <Badge variant={renewal.status === 'pending' ? 'warning' : 'success'}>
                      {renewal.status}
                    </Badge>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    {renewal.status === 'pending' && (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleMarkComplete(renewal.id)}
                      >
                        Mark Done
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
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
          Showing {renewals.length > 0 ? (currentPage - 1) * limit + 1 : 0} to {Math.min(currentPage * limit, total)} of {total}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="secondary"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => fetchRenewals(currentPage - 1)}
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
            onClick={() => fetchRenewals(currentPage + 1)}
          >
            Next <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default RenewalsList;
