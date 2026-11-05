import React from 'react';

/**
 * Avatar Component
 * Props: initials, src, size, color
 * Colors: blue, pink, purple, green, lavender
 */
export function Avatar({
  initials = '',
  src = null,
  size = 'md',
  color = 'blue',
  className = '',
  style = {},
  ...props
}) {
  const sizeMap = {
    sm: 32,
    md: 40,
    lg: 56,
    xl: 64,
  };

  const colorGradients = {
    blue: 'linear-gradient(135deg, #1e40af 0%, #2e7dd4 100%)',
    pink: 'linear-gradient(135deg, #f43f5e 0%, #fda4af 100%)',
    purple: 'linear-gradient(135deg, #7c3aed 0%, #e9d5ff 100%)',
    green: 'linear-gradient(135deg, #059669 0%, #a7f3d0 100%)',
    lavender: 'linear-gradient(135deg, #8b5cf6 0%, #d4bfff 100%)',
  };

  const size_px = sizeMap[size] || sizeMap.md;
  const gradient = colorGradients[color] || colorGradients.blue;

  if (src) {
    return (
      <img
        src={src}
        alt={initials}
        className={`avatar avatar-${size} ${className}`}
        style={{
          width: `${size_px}px`,
          height: `${size_px}px`,
          borderRadius: '50%',
          objectFit: 'cover',
          ...style,
        }}
        {...props}
      />
    );
  }

  return (
    <div
      className={`avatar avatar-${size} ${className}`}
      style={{
        width: `${size_px}px`,
        height: `${size_px}px`,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: gradient,
        color: 'white',
        fontSize: `${Math.max(12, size_px / 2.5)}px`,
        fontWeight: '700',
        ...style,
      }}
      {...props}
    >
      {initials}
    </div>
  );
}

export default Avatar;
