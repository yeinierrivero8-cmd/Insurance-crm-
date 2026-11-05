import React from 'react';

/**
 * MetricCard Component - Shows KPI metrics
 * Props: icon, label, value, growth, tone, onClick
 */
export function MetricCard({
  icon: Icon,
  label = '',
  value = 0,
  growth = null,
  tone = 'blue',
  onClick,
  className = '',
  ...props
}) {
  const toneClasses = {
    blue: 'metric-blue',
    pink: 'metric-pink',
    purple: 'metric-purple',
    green: 'metric-green',
  };

  return (
    <button
      className={`metric ${toneClasses[tone]} ${className}`}
      onClick={onClick}
      {...props}
    >
      <div className="metric-icon">
        {Icon && <Icon size={26} />}
      </div>
      <span className="metric-label">{label}</span>
      <div className="metric-value">
        <strong>{value}</strong>
        {growth && <small>↑ {growth}</small>}
      </div>
    </button>
  );
}

export default MetricCard;
