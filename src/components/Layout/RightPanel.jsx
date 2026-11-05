import React from 'react';
import { X, Calendar, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * RightPanel Component - Desktop-only sidebar (280px)
 * Shows upcoming tasks, renewals, or quick info
 */
const RightPanel = ({
  items = [],
  title = 'Tasks',
  type = 'tasks', // 'tasks', 'renewals', 'alerts'
  onClose,
  isOpen = true
}) => {
  if (!isOpen) return null;

  const getIcon = (item) => {
    switch(type) {
      case 'renewals':
        return <Calendar size={16} />;
      case 'alerts':
        return <AlertCircle size={16} />;
      default:
        return <CheckCircle size={16} />;
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high':
        return '#ef4444'; // red
      case 'medium':
        return '#f59e0b'; // amber
      default:
        return '#10b981'; // green
    }
  };

  return (
    <aside
      className="right-panel"
      style={{
        width: '280px',
        background: '#f9fafb',
        borderLeft: '1px solid #e5e7eb',
        overflowY: 'auto',
        display: 'none',
        flexDirection: 'column'
      }}
      css={{ '@media (min-width: 1440px)': { display: 'flex' } }}
    >
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0
      }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#111827' }}>
          {title}
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#6b7280',
              padding: 0,
              display: 'flex'
            }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {items.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
            color: '#9ca3af',
            textAlign: 'center'
          }}>
            <Calendar size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: '13px' }}>No items to show</p>
          </div>
        ) : (
          items.map((item, idx) => (
            <div
              key={idx}
              style={{
                padding: '12px',
                marginBottom: '8px',
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                borderLeft: `3px solid ${getPriorityColor(item.priority)}`,
                cursor: item.onClick ? 'pointer' : 'default',
                transition: 'all 0.2s'
              }}
              onClick={item.onClick}
              onMouseEnter={e => {
                if (item.onClick) {
                  e.currentTarget.style.background = '#f3f4f6';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span style={{ color: getPriorityColor(item.priority), marginTop: '2px', flexShrink: 0 }}>
                  {getIcon(item)}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    margin: 0,
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#111827',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {item.title}
                  </p>
                  {item.subtitle && (
                    <p style={{
                      margin: '4px 0 0 0',
                      fontSize: '12px',
                      color: '#6b7280',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {item.subtitle}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
};

export default RightPanel;
