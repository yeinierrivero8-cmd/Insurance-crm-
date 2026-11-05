import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * ErrorBoundary Component - Catches React errors and displays fallback UI
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log to console for debugging
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          minHeight: '400px',
          gap: '20px'
        }}>
          <AlertCircle size={48} style={{ color: '#ef4444' }} />
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 8px 0', color: '#111827' }}>
              Something went wrong
            </h2>
            <p style={{
              margin: '0 0 16px 0',
              color: '#6b7280',
              fontSize: '14px'
            }}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
          </div>
          <button
            onClick={this.handleReset}
            style={{
              background: '#667eea',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            <RefreshCw size={16} /> Try Again
          </button>
          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <details style={{
              marginTop: '20px',
              padding: '12px',
              background: '#f3f4f6',
              borderRadius: '6px',
              width: '100%',
              maxWidth: '500px',
              fontSize: '12px',
              color: '#6b7280'
            }}>
              <summary style={{ cursor: 'pointer', fontWeight: '600' }}>
                Error Details (dev only)
              </summary>
              <pre style={{
                margin: '12px 0 0 0',
                overflow: 'auto',
                maxHeight: '200px',
                background: 'white',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #e5e7eb'
              }}>
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
