import React from 'react';
import {
  Home, Users, Target, CalendarDays, Settings, LogOut, ShieldCheck,
  MoreHorizontal, BarChart3, HelpCircle
} from 'lucide-react';

/**
 * Sidebar Component - Desktop-only navigation (192px)
 * Hidden on mobile/tablet, visible on desktop (1024px+)
 */
const Sidebar = ({ activeRoute, onNavigate, user, onLogout }) => {
  const mainNavItems = [
    { id: 'home', label: 'Dashboard', icon: Home },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'prospects', label: 'Prospects', icon: Target },
    { id: 'renewals', label: 'Renewals', icon: CalendarDays },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  const secondaryNavItems = [
    { id: 'help', label: 'Help', icon: HelpCircle },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const userRoleDisplay = {
    admin: 'Administrator',
    agent: 'Insurance Agent',
    viewer: 'Viewer'
  };

  return (
    <aside className="sidebar">
      {/* Logo Section */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <ShieldCheck size={24} />
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="sidebar-nav">
        {mainNavItems.map(item => {
          const Icon = item.icon;
          const isActive = activeRoute === item.id;
          return (
            <button
              key={item.id}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
              title={item.label}
            >
              <Icon size={20} />
              <span className="sidebar-nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Section */}
      <div className="sidebar-footer">
        {/* User Info Card */}
        <div className="sidebar-cta">
          <p>{userRoleDisplay[user?.role] || 'User'}</p>
          <small style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
            {user?.email}
          </small>
        </div>

        {/* Secondary Nav */}
        <nav className="sidebar-nav" style={{ marginTop: '12px' }}>
          {secondaryNavItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className="sidebar-nav-item"
                onClick={() => onNavigate(item.id)}
                title={item.label}
              >
                <Icon size={20} />
                <span className="sidebar-nav-label">{item.label}</span>
              </button>
            );
          })}
          <button
            className="sidebar-nav-item"
            onClick={onLogout}
            title="Sign Out"
            style={{ color: 'rgba(255,99,71,0.7)' }}
          >
            <LogOut size={20} />
            <span className="sidebar-nav-label">Sign Out</span>
          </button>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
