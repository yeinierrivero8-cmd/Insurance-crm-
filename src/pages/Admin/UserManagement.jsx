import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { Card, Badge, Button, Input, Modal, LoadingSpinner } from '../../components';
import { Plus, Edit2, Trash2 } from 'lucide-react';

/**
 * Admin - User Management Page
 * CRUD for agency users with role-based access control
 */
function UserManagement() {
  const { get, post, put, delete: apiDelete, loading } = useApi();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    role: 'agent'
  });

  // Fetch users
  const fetchUsers = async () => {
    try {
      setError(null);
      const res = await get('/api/admin/users');
      setUsers(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle create user
  const handleCreateUser = async () => {
    if (!formData.email || !formData.name || !formData.password || !formData.role) {
      setError('All fields are required');
      return;
    }

    try {
      await post('/api/admin/users', formData);
      setFormData({ email: '', name: '', password: '', role: 'agent' });
      setShowNewUserForm(false);
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to create user');
    }
  };

  // Handle update user
  const handleUpdateUser = async () => {
    if (!editingUser || !formData.name || !formData.role) {
      setError('Name and role are required');
      return;
    }

    try {
      await put(`/api/admin/users/${editingUser.id}`, {
        name: formData.name,
        role: formData.role
      });
      setEditingUser(null);
      setFormData({ email: '', name: '', password: '', role: 'agent' });
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to update user');
    }
  };

  // Handle delete user
  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await apiDelete(`/api/admin/users/${userId}`);
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to delete user');
    }
  };

  const handleOpenNewForm = () => {
    setEditingUser(null);
    setFormData({ email: '', name: '', password: '', role: 'agent' });
    setShowNewUserForm(true);
    setError(null);
  };

  const handleOpenEditForm = (user) => {
    setEditingUser(user);
    setFormData({ email: user.email, name: user.name, password: '', role: user.role });
    setShowNewUserForm(true);
    setError(null);
  };

  const handleCloseForm = () => {
    setShowNewUserForm(false);
    setEditingUser(null);
    setFormData({ email: '', name: '', password: '', role: 'agent' });
    setError(null);
  };

  if (loading && users.length === 0) {
    return <LoadingSpinner text="Loading users..." />;
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'danger';
      case 'agent':
        return 'warning';
      case 'viewer':
        return 'info';
      default:
        return 'secondary';
    }
  };

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
            User Management
          </h1>
          <p style={{ margin: '0', color: '#6b7280', fontSize: '14px' }}>
            Total: {users.length} users
          </p>
        </div>
        <Button variant="primary" onClick={handleOpenNewForm}>
          <Plus size={18} /> New User
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

      {/* Users Table */}
      <Card>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px'
        }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#111827' }}>
                Name
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#111827' }}>
                Email
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#111827' }}>
                Role
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#111827' }}>
                Status
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#111827' }}>
                Created
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#111827' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr
                key={user.id}
                style={{ borderBottom: '1px solid #e5e7eb' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '12px 16px', color: '#111827', fontWeight: '500' }}>
                  {user.name}
                </td>
                <td style={{ padding: '12px 16px', color: '#6b7280' }}>
                  {user.email}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <Badge variant={getRoleColor(user.role)}>
                    {user.role}
                  </Badge>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <Badge variant={user.is_active ? 'success' : 'secondary'}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: '13px' }}>
                  {new Date(user.created_at).toLocaleDateString()}
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
                    onClick={() => handleOpenEditForm(user)}
                  >
                    <Edit2 size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Form Modal */}
      {showNewUserForm && (
        <Modal
          title={editingUser ? 'Edit User' : 'Create New User'}
          onClose={handleCloseForm}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter user name"
              disabled={!!editingUser}
            />
            <Input
              label="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter email"
              disabled={!!editingUser}
            />
            {!editingUser && (
              <Input
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter password"
              />
            )}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#111827', marginBottom: '6px' }}>
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                <option value="viewer">Viewer (read-only)</option>
                <option value="agent">Agent (can edit)</option>
                <option value="admin">Admin (full access)</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <Button
                variant="primary"
                fullWidth
                onClick={editingUser ? handleUpdateUser : handleCreateUser}
              >
                {editingUser ? 'Update User' : 'Create User'}
              </Button>
              <Button
                variant="secondary"
                fullWidth
                onClick={handleCloseForm}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default UserManagement;
