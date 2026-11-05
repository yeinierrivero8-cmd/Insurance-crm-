import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import MainContent from './MainContent';
import RightPanel from './RightPanel';
import { useResponsive } from '../../hooks/useResponsive';

/**
 * AppLayout Component - Main layout wrapper for authenticated views
 * Responsive: Desktop (sidebar + header + content + rightpanel)
 *             Tablet/Mobile (header + content)
 */
const AppLayout = ({
  title,
  user,
  activeRoute,
  onNavigate,
  onLogout,
  onLanguageToggle,
  rightPanelItems = [],
  rightPanelTitle = 'Tasks',
  rightPanelType = 'tasks',
  unreadNotifications = 0,
  children
}) => {
  const { isDesktop } = useResponsive();
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr',
      gridTemplateRows: 'auto 1fr',
      height: '100vh',
      background: '#ffffff',
      gap: 0
    }}>
      {/* Sidebar - Desktop only */}
      {isDesktop && (
        <div style={{ gridRow: '1 / -1', gridColumn: 1 }}>
          <Sidebar
            activeRoute={activeRoute}
            onNavigate={onNavigate}
            user={user}
            onLogout={onLogout}
          />
        </div>
      )}

      {/* Header */}
      <div style={{
        gridColumn: isDesktop ? 2 : 1,
        gridRow: 1,
        display: 'flex',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <Header
          title={title}
          user={user}
          onNavigate={onNavigate}
          onLogout={onLogout}
          onLanguageToggle={onLanguageToggle}
          unreadCount={unreadNotifications}
        />
      </div>

      {/* Main Content Area */}
      <div style={{
        gridColumn: isDesktop ? 2 : 1,
        gridRow: 2,
        display: 'flex',
        gap: 0,
        overflow: 'hidden'
      }}>
        <MainContent className={isDesktop ? 'white-content' : ''}>
          {children}
        </MainContent>

        {/* Right Panel - Desktop only */}
        {isDesktop && (
          <RightPanel
            items={rightPanelItems}
            title={rightPanelTitle}
            type={rightPanelType}
            isOpen={rightPanelOpen}
            onClose={() => setRightPanelOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default AppLayout;
