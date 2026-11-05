import React from 'react';
import { X } from 'lucide-react';

/**
 * Modal Component
 * Props: isOpen, onClose, title, children, footer
 */
export function Modal({
  isOpen = false,
  onClose,
  title = '',
  children,
  footer = null,
  size = 'md',
  className = '',
  ...props
}) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'modal-sm',
    md: 'modal-md',
    lg: 'modal-lg',
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      {...props}
    >
      <div
        className={`modal ${sizeClasses[size]} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="modal-header">
            <h2>{title}</h2>
            <button
              className="modal-close"
              onClick={onClose}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        )}
        <div className="modal-content">
          {children}
        </div>
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal;
