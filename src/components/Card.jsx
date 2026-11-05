import React from 'react';

/**
 * Card Component - Container for content
 * Props: padding, shadow, border, onClick
 */
export function Card({
  children,
  padding = true,
  shadow = 'md',
  border = true,
  onClick,
  className = '',
  style = {},
  ...props
}) {
  const shadowClass = shadow ? `shadow-${shadow}` : '';
  const paddingClass = padding ? 'p-6' : '';
  const borderClass = border ? 'border' : '';

  return (
    <div
      className={`card ${shadowClass} ${paddingClass} ${borderClass} ${className}`}
      onClick={onClick}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
