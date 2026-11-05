import React from 'react';

/**
 * Input Component
 * Props: type, placeholder, value, onChange, disabled, icon, error
 */
export function Input({
  type = 'text',
  placeholder = '',
  value = '',
  onChange,
  disabled = false,
  error = false,
  label = '',
  helpText = '',
  className = '',
  ...props
}) {
  return (
    <div className="input-wrapper">
      {label && (
        <label className="input-label">
          {label}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`input ${error ? 'input-error' : ''} ${className}`}
        {...props}
      />
      {helpText && (
        <small className="input-help">
          {helpText}
        </small>
      )}
      {error && (
        <small className="input-error-text">
          {error}
        </small>
      )}
    </div>
  );
}

export default Input;
