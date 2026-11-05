import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { Card, Badge, Button, Input, LoadingSpinner } from '../components';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

/**
 * PoliciesList Page - Display all policies with filtering and pagination
 */
function PoliciesList() {
  const { get, loading } = useApi();
  const [policies, setPolicies] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [clientFilter, setClientFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState(null);

  const limit = 50;

  const fetchPolicies = async (page = 1) => {
    try {
      setError(null);
      const params = new URLSearchParams({
        limit,
        offset: (page - 1) * limit,
        client_id: clientFilter,
        type: typeFilter,
        status: statusFilter
      });

      const res = await get(`/api/policies?${params}`);
      setPolicies(res.data || []);
      setTotal(res.total || 0);
      setCurrentPage(page);
    } catch (err) {
      setError(err.message || 'Failed to load policies');
    }
  };

  useEffect(() => {
    fetchPolicies(1);
  }, [clientFilter, typeFilter, statusFilter]);

  const pageCount = Math.ceil(total / limit);

  if (loading && policies.length === 0) {
    return <LoadingSpinner text="Loading policies..." />;
  }

  return (
    <div style={{ padding: '20px 40px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '700', color: '#111827' }}>
          Policies
        </h1>
        <p style={{ margin: '0', color: '#6b7280', fontSize: '14px' }}>
          Total: {total} policies
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
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          <option value="">All Types</option>
          <option value="auto">Auto</option>
          <option value="home">Home</option>
          <option value="life">Life</option>
          <option value="health">Health</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="expired">Expired</option>
        </select>
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
                Policy #
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#111827' }}>
                Client
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#111827' }}>
                Type
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#111827' }}>
                Premium
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#111827' }}>
                Expiry Date
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#111827' }}>
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {policies.map(policy => (
              <tr
                key={policy.id}
                style={{ borderBottom: '1px solid #e5e7eb' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '12px 16px', color: '#111827', fontWeight: '500' }}>
                  {policy.policy_number}
                </td>
                <td style={{ padding: '12px 16px', color: '#6b7280' }}>
                  {policy.client_name}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <Badge variant="info">{policy.type}</Badge>
                </td>
                <td style={{ padding: '12px 16px', color: '#111827', fontWeight: '500' }}>
                  ${policy.premium?.toFixed(2) || '0.00'}
                </td>
                <td style={{ padding: '12px 16px', color: '#6b7280' }}>
                  {new Date(policy.expiry_date).toLocaleDateString()}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <Badge variant={policy.status === 'active' ? 'success' : 'warning'}>
                    {policy.status}
                  </Badge>
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
          Showing {policies.length > 0 ? (currentPage - 1) * limit + 1 : 0} to {Math.min(currentPage * limit, total)} of {total}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="secondary"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => fetchPolicies(currentPage - 1)}
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
            onClick={() => fetchPolicies(currentPage + 1)}
          >
            Next <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PoliciesList;
