import React from 'react';

/**
 * Badge Component
 * Variants: success, warning, danger, info
 */
export function Badge({
  children,
  variant = 'info',
  size = 'md',
  className = '',
  ...props
}) {
  const sizeClass = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm';

  return (
    <span
      className={`badge badge-${variant} ${sizeClass} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

export default Badge;
