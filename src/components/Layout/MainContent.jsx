import React from 'react';

/**
 * MainContent Component - Responsive main content area wrapper
 * Manages responsive padding and layout for different screen sizes
 */
const MainContent = ({ children, className = '' }) => {
  return (
    <main
      className={`content ${className}`}
      style={{
        flex: 1,
        overflowY: 'auto',
        paddingBottom: '80px' // Space for bottom nav on mobile
      }}
    >
      {children}
    </main>
  );
};

export default MainContent;
