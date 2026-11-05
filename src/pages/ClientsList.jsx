import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useResponsive } from '../hooks/useResponsive';
import { Card, Button, Badge, Input, LoadingSpinner } from '../components';
import { ChevronLeft, ChevronRight, Search, Plus, Eye, Edit, Trash2 } from 'lucide-react';

/**
 * ClientsList Page - Paginated table with search, filter, and sorting
 * Features: Search by name/email/phone, filter by status, sort, pagination
 */
function ClientsList({ onSelectClient }) {
  const { get, post, delete: apiDelete, loading } = useApi();
  const { isMobile } = useResponsive();
  const [clients, setClients] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('created_at:desc');
  const [error, setError] = useState(null);
  const [showNewClientForm, setShowNewClientForm] = useState(false);

  const limit = 50;
  const offset = (currentPage - 1) * limit;

  // Fetch clients
  const fetchClients = async (pg = 1, s = search, st = status) => {
    try {
      setError(null);
      const params = new URLSearchParams({
        limit,
        offset: (pg - 1) * limit,
        search: s,
        status: st,
        sort
      });

      const res = await get(`/api/clients?${params}`);
      setClients(res.data || []);
      setTotal(res.total || 0);
      setCurrentPage(pg);
    } catch (err) {
      setError(err.message || 'Failed to load clients');
    }
  };

  // Initial fetch and search effect
  useEffect(() => {
    fetchClients(1, search, status);
  }, [search, status, sort]);

  // Handle delete
  const handleDelete = async (clientId) => {
    if (!confirm('Are you sure you want to delete this client?')) return;

    try {
      await apiDelete(`/api/clients/${clientId}`);
      fetchClients(currentPage, search, status);
    } catch (err) {
      setError(err.message || 'Failed to delete client');
    }
  };

  const pageCount = Math.ceil(total / limit);

  if (loading && clients.length === 0) {
    return <LoadingSpinner text="Loading clients..." />;
  }

  // Mobile card view
  if (isMobile) {
    return (
      <div style={{ padding: '16px', maxWidth: '100%' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h1 style={{ margin: '0', fontSize: '24px', fontWeight: '700' }}>Clients</h1>
          <Button variant="primary" size="sm" onClick={() => setShowNewClientForm(true)}>
            <Plus size={16} /> New
          </Button>
        </div>

        {error && (
          <div style={{
            padding: '12px',
            background: '#fee2e2',
            borderRadius: '6px',
            color: '#991b1b',
            fontSize: '12px',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        {/* Search */}
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginBottom: '16px' }}
        />

        {/* Cards */}
        {clients.map(client => (
          <Card key={client.id} style={{ marginBottom: '12px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}>
              <div>
                <div style={{ fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                  {client.name}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                  {client.email}
                </div>
                <Badge variant={client.status === 'active' ? 'success' : 'warning'}>
                  {client.status}
                </Badge>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelectClient?.(client.id)}
                >
                  <Eye size={14} />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(client.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {/* Pagination */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          marginTop: '16px',
          fontSize: '12px'
        }}>
          <Button
            variant="secondary"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => fetchClients(currentPage - 1, search, status)}
          >
            Prev
          </Button>
          <span style={{ alignSelf: 'center' }}>
            {currentPage} / {pageCount}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={currentPage === pageCount}
            onClick={() => fetchClients(currentPage + 1, search, status)}
          >
            Next
          </Button>
        </div>
      </div>
    );
  }

  // Desktop table view
  return (
    <div style={{ padding: '20px 40px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '700', color: '#111827' }}>
            Clients
          </h1>
          <p style={{ margin: '0', color: '#6b7280', fontSize: '14px' }}>
            Total: {total} clients
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowNewClientForm(true)}>
          <Plus size={18} /> New Client
        </Button>
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
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: '200px' }}
          icon={<Search size={16} />}
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
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
          <option value="prospect">Prospect</option>
          <option value="archived">Archived</option>
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
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#111827'
              }}>
                Name
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#111827'
              }}>
                Email
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#111827'
              }}>
                Phone
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#111827'
              }}>
                Type
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#111827'
              }}>
                Status
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'right',
                fontWeight: '600',
                color: '#111827'
              }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {clients.map(client => (
              <tr
                key={client.id}
                style={{
                  borderBottom: '1px solid #e5e7eb',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '12px 16px', color: '#111827', fontWeight: '500' }}>
                  {client.name}
                </td>
                <td style={{ padding: '12px 16px', color: '#6b7280' }}>
                  {client.email}
                </td>
                <td style={{ padding: '12px 16px', color: '#6b7280' }}>
                  {client.phone}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <Badge variant="info">
                    {client.type}
                  </Badge>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <Badge variant={client.status === 'active' ? 'success' : 'warning'}>
                    {client.status}
                  </Badge>
                </td>
                <td style={{
                  padding: '12px 16px',
                  textAlign: 'right',
                  display: 'flex',
                  gap: '8px',
                  justifyContent: 'flex-end'
                }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSelectClient?.(client.id)}
                  >
                    <Eye size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(client.id)}
                  >
                    <Trash2 size={16} />
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
          Showing {clients.length > 0 ? offset + 1 : 0} to {Math.min(offset + limit, total)} of {total}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="secondary"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => fetchClients(currentPage - 1, search, status)}
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
            onClick={() => fetchClients(currentPage + 1, search, status)}
          >
            Next <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ClientsList;
