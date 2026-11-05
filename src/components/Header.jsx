import React from 'react';
import { Search, Bell, ShieldCheck } from 'lucide-react';
import { Avatar } from './Avatar';

/**
 * Header Component - Top navigation bar
 * Props: title, subtitle, searchValue, onSearchChange, onNotifications, user, avatarUrl, onProfileClick
 */
export function Header({
  title = 'Dashboard',
  subtitle = '',
  searchValue = '',
  onSearchChange = () => {},
  showSearch = false,
  showNotifications = false,
  notificationCount = 0,
  onNotifications = () => {},
  user = null,
  avatarUrl = null,
  onProfileClick = () => {},
  onBrandClick = () => {},
}) {
  const userInitial = user?.email?.charAt(0).toUpperCase() || '?';
  const userRole = user?.role === 'admin' ? 'Admin' : user?.role === 'agent' ? 'Agent' : 'Viewer';

  return (
    <header className="header">
      <div className="header-left">
        <button
          className="header-brand"
          onClick={onBrandClick}
          aria-label="Home"
        >
          <ShieldCheck size={24} />
          <span>
            Insurance
            <b>CRM</b>
          </span>
        </button>
      </div>

      <div className="header-center">
        {showSearch && (
          <div className="header-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchValue}
              onChange={onSearchChange}
              className="header-search-input"
            />
          </div>
        )}

        {title && (
          <div className="header-title">
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
        )}
      </div>

      <div className="header-right">
        <span className="user-role">
          {userRole}
        </span>

        <button
          className="header-icon-button"
          onClick={onNotifications}
          aria-label="Notifications"
        >
          <Bell size={22} />
          {notificationCount > 0 && (
            <span className="notification-badge">{notificationCount}</span>
          )}
        </button>

        <button
          className="header-avatar-button"
          onClick={onProfileClick}
          aria-label="Profile"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="Profile" />
          ) : (
            <Avatar initials={userInitial} size="md" color="blue" />
          )}
        </button>
      </div>
    </header>
  );
}

export default Header;
