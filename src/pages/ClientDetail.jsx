import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { Card, Badge, Button, Input, LoadingSpinner } from '../components';
import { ArrowLeft, Edit2, Save, X } from 'lucide-react';

/**
 * ClientDetail Page - Client information with tabs for policies, activity, notes
 */
function ClientDetail({ clientId, onBack }) {
  const { get, put, loading } = useApi();
  const [client, setClient] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [activeTab, setActiveTab] = useState('info');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [error, setError] = useState(null);

  // Fetch client details
  useEffect(() => {
    const fetchClient = async () => {
      try {
        setError(null);
        const res = await get(`/api/clients/${clientId}`);
        setClient(res);
        setEditData(res);

        // Fetch client policies
        const policiesRes = await get(`/api/policies?client_id=${clientId}`);
        setPolicies(policiesRes.data || []);
      } catch (err) {
        setError(err.message || 'Failed to load client');
      }
    };

    if (clientId) {
      fetchClient();
    }
  }, [clientId]);

  // Handle save changes
  const handleSave = async () => {
    try {
      await put(`/api/clients/${clientId}`, editData);
      setClient(editData);
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update client');
    }
  };

  if (loading || !client) {
    return <LoadingSpinner text="Loading client..." />;
  }

  return (
    <div style={{ padding: '20px 40px' }}>
      {/* Header with back button */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
        <Button variant="ghost" onClick={onBack} style={{ marginRight: '16px' }}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 style={{ margin: '0', fontSize: '28px', fontWeight: '700', color: '#111827' }}>
            {client.name}
          </h1>
          <p style={{ margin: '8px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
            {client.email} · {client.phone}
          </p>
        </div>
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

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid #e5e7eb',
        marginBottom: '24px'
      }}>
        {['info', 'policies', 'activity', 'notes'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === tab ? '2px solid #667eea' : '2px solid transparent',
              color: activeTab === tab ? '#667eea' : '#6b7280',
              fontWeight: activeTab === tab ? '600' : '500',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: '0', fontSize: '16px', fontWeight: '600' }}>Client Information</h3>
            {!isEditing ? (
              <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
                <Edit2 size={16} /> Edit
              </Button>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="success" size="sm" onClick={handleSave}>
                  <Save size={16} /> Save
                </Button>
                <Button variant="secondary" size="sm" onClick={() => {
                  setIsEditing(false);
                  setEditData(client);
                }}>
                  <X size={16} /> Cancel
                </Button>
              </div>
            )}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px'
          }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Name</label>
              <div style={{ fontSize: '14px', color: '#111827', marginTop: '4px', fontWeight: '500' }}>
                {isEditing ? (
                  <Input
                    value={editData.name || ''}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  />
                ) : (
                  client.name
                )}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Email</label>
              <div style={{ fontSize: '14px', color: '#111827', marginTop: '4px', fontWeight: '500' }}>
                {isEditing ? (
                  <Input
                    value={editData.email || ''}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  />
                ) : (
                  client.email
                )}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Phone</label>
              <div style={{ fontSize: '14px', color: '#111827', marginTop: '4px', fontWeight: '500' }}>
                {isEditing ? (
                  <Input
                    value={editData.phone || ''}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  />
                ) : (
                  client.phone
                )}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Status</label>
              <div style={{ fontSize: '14px', color: '#111827', marginTop: '4px' }}>
                <Badge variant={client.status === 'active' ? 'success' : 'warning'}>
                  {client.status}
                </Badge>
              </div>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'policies' && (
        <Card>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>Policies</h3>
          {policies.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: '14px' }}>No policies found</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '8px 0', textAlign: 'left', fontWeight: '600' }}>Policy #</th>
                  <th style={{ padding: '8px 0', textAlign: 'left', fontWeight: '600' }}>Type</th>
                  <th style={{ padding: '8px 0', textAlign: 'left', fontWeight: '600' }}>Premium</th>
                  <th style={{ padding: '8px 0', textAlign: 'left', fontWeight: '600' }}>Expiry</th>
                  <th style={{ padding: '8px 0', textAlign: 'left', fontWeight: '600' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {policies.map(policy => (
                  <tr key={policy.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '8px 0', color: '#111827' }}>{policy.policy_number}</td>
                    <td style={{ padding: '8px 0', color: '#6b7280' }}>{policy.type}</td>
                    <td style={{ padding: '8px 0', color: '#111827' }}>${policy.premium?.toFixed(2)}</td>
                    <td style={{ padding: '8px 0', color: '#6b7280' }}>
                      {new Date(policy.expiry_date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '8px 0' }}>
                      <Badge variant={policy.status === 'active' ? 'success' : 'warning'}>
                        {policy.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {activeTab === 'activity' && (
        <Card>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>Activity</h3>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Activity log coming soon</p>
        </Card>
      )}

      {activeTab === 'notes' && (
        <Card>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>Notes</h3>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Notes feature coming soon</p>
        </Card>
      )}
    </div>
  );
}

export default ClientDetail;
