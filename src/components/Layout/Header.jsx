import React, { useState } from 'react';
import { ShieldCheck, Search, Bell, Menu, X, Globe, LogOut } from 'lucide-react';

/**
 * Header Component - Sticky top navigation (69px height)
 * Responsive: hamburger on mobile, full nav on desktop
 */
const Header = ({
  title,
  user,
  onNavigate,
  onLogout,
  onLanguageToggle,
  notifications,
  unreadCount
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const userRoleDisplay = {
    admin: 'Admin',
    agent: 'Agent',
    viewer: 'Viewer'
  };

  const handleLogout = () => {
    setProfileDropdownOpen(false);
    onLogout();
  };

  return (
    <header className="header">
      {/* Left: Logo/Brand */}
      <div className="header-left">
        <button
          className="header-brand"
          onClick={() => onNavigate('home')}
          style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
        >
          <ShieldCheck size={24} />
          <span>Insurance <b>CRM</b></span>
        </button>
      </div>

      {/* Center: Search & Title */}
      <div className="header-center">
        <div className="header-search">
          <Search size={18} />
          <input
            className="header-search-input"
            placeholder="Search clients..."
            type="text"
          />
        </div>
        {title && (
          <div className="header-title">
            <h2>{title}</h2>
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="header-right">
        {/* User Role Badge */}
        <span className="user-role">
          {userRoleDisplay[user?.role] || 'User'}
        </span>

        {/* Notifications */}
        <button
          className="header-icon-button"
          onClick={() => onNavigate('notifications')}
          title="Notifications"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount}</span>
          )}
        </button>

        {/* Language Selector */}
        <button
          className="header-icon-button"
          onClick={onLanguageToggle}
          title="Language"
        >
          <Globe size={20} />
        </button>

        {/* Avatar / Profile Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            className="header-avatar-button"
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            title={user?.email}
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="Profile" />
            ) : (
              <span style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '14px'
              }}>
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </span>
            )}
          </button>

          {/* Profile Dropdown Menu */}
          {profileDropdownOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 10px 15px rgba(0,0,0,0.1)',
              zIndex: 1000,
              minWidth: '200px',
              overflow: 'hidden'
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                  {user?.email}
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                  {userRoleDisplay[user?.role] || 'User'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: '#ef4444',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.target.parentElement.style.background = '#fef2f2'}
                onMouseLeave={e => e.target.parentElement.style.background = 'transparent'}
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
