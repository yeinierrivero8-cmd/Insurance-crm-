import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import AppLayout from './components/Layout/AppLayout';
import MainContent from './components/Layout/MainContent';
import LoadingSpinner from './components/Common/LoadingSpinner';
import Toast from './components/Common/Toast';
import ErrorBoundary from './components/Common/ErrorBoundary';
import { ShieldCheck, AlertCircle } from 'lucide-react';

/**
 * App Component - Main router and layout orchestrator
 * Handles: Authentication, navigation, responsive layout
 */
function App() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const [currentRoute, setCurrentRoute] = useState('home');
  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem('language') || 'es';
    } catch {
      return 'es';
    }
  });
  const [toasts, setToasts] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Translations (extend as needed)
  const translations = {
    es: {
      hello: 'Bienvenido, María',
      role: 'Agente de Seguros',
      month: 'Este mes',
      clients: 'Clientes',
      activePolicies: 'Pólizas activas',
      renewals: 'Renovaciones',
      quotes: 'Cotizaciones',
      commissions: 'Comisiones estimadas',
      tasks: 'Tareas de hoy',
      seeAll: 'Ver todo',
      home: 'Inicio',
      prospects: 'Prospectos',
      calendar: 'Calendario',
      more: 'Más',
      search: 'Buscar cliente...',
      all: 'Todos',
      active: 'Activos',
      renew: 'Renovaciones',
      loading: 'Cargando...',
    },
    en: {
      hello: 'Welcome, Maria',
      role: 'Insurance Agent',
      month: 'This month',
      clients: 'Clients',
      activePolicies: 'Active policies',
      renewals: 'Renewals',
      quotes: 'Quotes',
      commissions: 'Estimated commissions',
      tasks: "Today's tasks",
      seeAll: 'See all',
      home: 'Home',
      prospects: 'Prospects',
      calendar: 'Calendar',
      more: 'More',
      search: 'Search clients...',
      all: 'All',
      active: 'Active',
      renew: 'Renewals',
      loading: 'Loading...',
    }
  };

  const t = translations[language];

  // Show toast notification
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  // Remove toast
  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Navigation handler
  const handleNavigate = (route) => {
    setCurrentRoute(route);
    window.scrollTo(0, 0);
  };

  // Logout handler
  const handleLogout = () => {
    logout();
    setCurrentRoute('home');
  };

  // Language toggle
  const handleLanguageToggle = () => {
    const newLang = language === 'es' ? 'en' : 'es';
    setLanguage(newLang);
    try {
      localStorage.setItem('language', newLang);
    } catch {
      // Fallback if localStorage not available
    }
  };

  // Loading state
  if (authLoading) {
    return <LoadingSpinner fullscreen={true} text={t.loading} />;
  }

  // Not authenticated - show login page
  if (!user) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '40px',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            color: 'white'
          }}>
            <ShieldCheck size={32} />
          </div>
          <h1 style={{ margin: '0 0 8px 0', color: '#111827' }}>
            Insurance <span style={{ color: '#667eea' }}>CRM</span>
          </h1>
          <p style={{ margin: '0 0 32px 0', color: '#6b7280', fontSize: '14px' }}>
            Enterprise insurance management platform
          </p>
          <button
            onClick={() => handleNavigate('login')}
            style={{
              width: '100%',
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 10px 20px rgba(102,126,234,0.3)';
            }}
            onMouseLeave={e => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // Authenticated - show app layout
  return (
    <ErrorBoundary>
      <AppLayout
        title={currentRoute === 'home' ? 'Dashboard' : currentRoute.charAt(0).toUpperCase() + currentRoute.slice(1)}
        user={user}
        activeRoute={currentRoute}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        onLanguageToggle={handleLanguageToggle}
        unreadNotifications={unreadNotifications}
      >
        <MainContent>
          <div style={{ padding: '20px' }}>
            <h2>{t.hello}</h2>
            <p style={{ color: '#6b7280' }}>{t.role}</p>
            <p>Current page: {currentRoute}</p>
          </div>
        </MainContent>
      </AppLayout>

      {/* Toast Notifications */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </ErrorBoundary>
  );
}

export default App;
