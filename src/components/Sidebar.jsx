import React from 'react';
import { Home, Users, Target, CalendarDays, MoreHorizontal, ShieldCheck } from 'lucide-react';

/**
 * Sidebar Component - Desktop navigation
 * Props: currentPage, onNavigate, user
 */
export function Sidebar({
  currentPage = 'home',
  onNavigate = () => {},
  user = null,
}) {
  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'clients', icon: Users, label: 'Clients' },
    { id: 'prospects', icon: Target, label: 'Prospects' },
    { id: 'calendar', icon: CalendarDays, label: 'Calendar' },
    { id: 'more', icon: MoreHorizontal, label: 'More' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <ShieldCheck size={24} />
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id ||
                          (currentPage === 'detail' && item.id === 'clients') ||
                          (currentPage === 'renewals' && item.id === 'home');

          return (
            <button
              key={item.id}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
              title={item.label}
              aria-label={item.label}
            >
              <Icon size={22} strokeWidth={2} />
              <span className="sidebar-nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-cta">
          <p>Protege más familias</p>
          <button className="btn btn-primary btn-sm" onClick={() => onNavigate('prospects')}>
            Agregar cliente
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
