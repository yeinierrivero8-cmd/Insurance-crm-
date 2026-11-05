import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { MetricCard, Card, Button, LoadingSpinner } from '../components';
import { TrendingUp, Users, FileText, RefreshCw } from 'lucide-react';

/**
 * Dashboard Page - KPI overview and activity feed
 * Displays: Total clients, Active policies, Pending renewals, YTD commissions
 */
function Dashboard() {
  const { get, loading } = useApi();
  const [stats, setStats] = useState(null);
  const [renewalsUpcoming, setRenewalsUpcoming] = useState([]);
  const [error, setError] = useState(null);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);

        // Get dashboard statistics
        const statsRes = await get('/api/dashboard/stats');
        setStats(statsRes.metrics || {});

        // Get upcoming renewals (next 30 days)
        const renewalsRes = await get('/api/renewals?status=pending&limit=10&sort=due_date:asc');
        setRenewalsUpcoming(renewalsRes.data || []);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard');
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  return (
    <div style={{ padding: '20px 40px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '700', color: '#111827' }}>
          Dashboard
        </h1>
        <p style={{ margin: '0', color: '#6b7280', fontSize: '14px' }}>
          Overview of your insurance portfolio
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

      {/* KPI Cards - 4 columns on desktop */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <MetricCard
          title="Total Clients"
          value={stats?.total_clients || 0}
          icon={<Users size={20} />}
          color="#667eea"
        />
        <MetricCard
          title="Active Policies"
          value={stats?.active_policies || 0}
          icon={<FileText size={20} />}
          color="#06b6d4"
        />
        <MetricCard
          title="Pending Renewals"
          value={stats?.pending_renewals_30d || 0}
          icon={<RefreshCw size={20} />}
          color="#f59e0b"
        />
        <MetricCard
          title="YTD Commissions"
          value={`$${(stats?.ytd_commissions || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<TrendingUp size={20} />}
          color="#10b981"
        />
      </div>

      {/* Upcoming Renewals */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px'
      }}>
        <Card title="Upcoming Renewals" style={{ gridColumn: 'span 1' }}>
          {renewalsUpcoming.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: '14px' }}>No upcoming renewals</p>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {renewalsUpcoming.map(renewal => (
                <div
                  key={renewal.id}
                  style={{
                    padding: '12px',
                    background: '#f9fafb',
                    borderRadius: '6px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '14px'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', color: '#111827' }}>
                      {renewal.client_name}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '12px' }}>
                      Policy: {renewal.policy_number}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '600', color: '#111827' }}>
                      {new Date(renewal.due_date).toLocaleDateString()}
                    </div>
                    <div style={{ color: '#f59e0b', fontSize: '12px' }}>
                      {renewal.policy_type}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card title="Quick Actions" style={{ gridColumn: 'span 1' }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <Button
              variant="primary"
              fullWidth
              onClick={() => window.location.hash = '#/clients'}
            >
              New Client
            </Button>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => window.location.hash = '#/renewals'}
            >
              View All Renewals
            </Button>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => window.location.hash = '#/policies'}
            >
              View Policies
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;
