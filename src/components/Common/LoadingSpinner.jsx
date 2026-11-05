import React from 'react';
import { Loader } from 'lucide-react';

/**
 * LoadingSpinner Component - Reusable loading state UI
 */
const LoadingSpinner = ({
  size = 32,
  text = 'Loading...',
  fullscreen = false
}) => {
  const content = (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      padding: '40px 20px'
    }}>
      <Loader
        size={size}
        style={{
          animation: 'spin 1s linear infinite',
          color: '#667eea'
        }}
      />
      {text && <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>{text}</p>}
    </div>
  );

  if (fullscreen) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.5)',
        zIndex: 9998
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '40px'
        }}>
          {content}
        </div>
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;
