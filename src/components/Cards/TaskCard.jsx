import React from 'react';
import { ChevronRight } from 'lucide-react';

/**
 * TaskCard Component - Single task/action item
 */
const TaskCard = ({
  icon: Icon,
  title,
  subtitle,
  tone = 'blue', // 'blue', 'green', 'mint', 'pink', 'coral'
  onClick,
  action
}) => {
  const toneColors = {
    blue: '#3b82f6',
    green: '#10b981',
    mint: '#14b8a6',
    pink: '#ec4899',
    coral: '#ff6b6b',
    orange: '#f59e0b'
  };

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px',
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '10px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        width: '100%',
        textAlign: 'left'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = '#f9fafb';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'white';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Icon */}
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '40px',
          height: '40px',
          background: `${toneColors[tone]}20`,
          borderRadius: '8px',
          color: toneColors[tone],
          flexShrink: 0
        }}
      >
        <Icon size={20} />
      </span>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0,
          fontSize: '14px',
          fontWeight: '600',
          color: '#111827'
        }}>
          {title}
        </p>
        {subtitle && (
          <p style={{
            margin: '4px 0 0 0',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Action Icon */}
      {action ? (
        <span style={{ color: toneColors[tone], flexShrink: 0 }}>
          {action}
        </span>
      ) : (
        <ChevronRight size={18} style={{ color: '#9ca3af', flexShrink: 0 }} />
      )}
    </button>
  );
};

export default TaskCard;
