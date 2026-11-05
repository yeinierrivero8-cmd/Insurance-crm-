import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * MetricCard Component - KPI display card
 * Responsive: 4-col on desktop, 2-col on tablet, 1-col on mobile
 */
const MetricCard = ({
  icon: Icon,
  label,
  value,
  growth,
  trend = 'up', // 'up', 'down', 'neutral'
  tone = 'blue', // 'blue', 'green', 'purple', 'pink', 'orange'
  onClick
}) => {
  const toneColors = {
    blue: { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', trend: '#3b82f6' },
    green: { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', trend: '#22c55e' },
    purple: { bg: '#faf5ff', border: '#e9d5ff', text: '#6b21a8', trend: '#a855f7' },
    pink: { bg: '#fdf2f8', border: '#fbce7b', text: '#be185d', trend: '#ec4899' },
    orange: { bg: '#fffbeb', border: '#fcd34d', text: '#b45309', trend: '#f59e0b' }
  };

  const colors = toneColors[tone];
  const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown;
  const trendColor = trend === 'up' ? '#10b981' : '#ef4444';

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '20px',
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: '12px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        flexGrow: 1,
        minHeight: '140px'
      }}
      onMouseEnter={e => {
        if (onClick) {
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Icon & Label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: colors.text, display: 'flex', flexShrink: 0 }}>
          <Icon size={24} />
        </span>
        <span style={{
          fontSize: '13px',
          fontWeight: '500',
          color: '#6b7280',
          flex: 1,
          textAlign: 'left'
        }}>
          {label}
        </span>
      </div>

      {/* Value & Trend */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <strong style={{
          fontSize: '28px',
          color: colors.text,
          lineHeight: '1',
          fontWeight: '700'
        }}>
          {value}
        </strong>
        {growth && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: trendColor,
            fontSize: '13px',
            fontWeight: '600'
          }}>
            <TrendIcon size={16} />
            <span>{growth}</span>
          </div>
        )}
      </div>
    </button>
  );
};

export default MetricCard;
