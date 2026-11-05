import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useApi } from './hooks/useApi';
import { Home, Users, ShieldCheck, CalendarDays, Coins, Phone, MessageCircle, Mail, Plus, Search, SlidersHorizontal, ChevronLeft, ChevronRight, X, Loader, AlertCircle, ClipboardList, Bell, Globe, LogOut, Clock3, Target, MoreHorizontal, BriefcaseBusiness, ChartNoAxesCombined } from 'lucide-react';
import './styles/index.css';
console.log('main.jsx loaded');

const API = typeof window !== 'undefined' ? `${window.location.origin}/api` : 'http://localhost:5000/api';

const seed = [
  { id: 1, name: 'Juan Pérez', initials: 'JP', type: 'Salud (ACA)', date: '15 Dic 2026', status: 'Activo', color: 'blue', phone: '(786) 555-0147', email: 'juan@example.com' },
  { id: 2, name: 'María González', initials: 'MG', type: 'Medicare', date: '20 Ene 2027', status: 'Activo', color: 'lavender', phone: '(305) 555-0172', email: 'maria@example.com' },
  { id: 3, name: 'Roberto López', initials: 'RL', type: 'Vida', date: '10 Mar 2027', status: 'Activo', color: 'purple', phone: '(786) 555-0193', email: 'roberto@example.com' },
  { id: 4, name: 'Carolina Álvarez', initials: 'CA', type: 'Auto', date: '05 Feb 2027', status: 'Activo', color: 'violet', phone: '(305) 555-0166', email: 'carolina@example.com' },
  { id: 5, name: 'Fernando Medina', initials: 'FM', type: 'Salud (ACA)', date: '18 Dic 2026', status: 'Renovación', color: 'blue', phone: '(786) 555-0124', email: 'fernando@example.com' }
];

const translations = {
  es: {
    hello: 'Hola, María',
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
    info: 'Información',
    policies: 'Pólizas',
    notes: 'Notas',
    history: 'Historial',
    call: 'Llamar',
    message: 'Mensaje',
    email: 'Email',
    phone: 'Teléfono',
    insurance: 'Tipo de seguro',
    expiry: 'Vencimiento',
    upcoming: 'Renovaciones próximas',
    new: 'Nuevo',
    login: 'Iniciar sesión',
    register: 'Crear cuenta',
    tagline: 'CRM para Agentes de Seguros',
    feature1: 'Clientes y prospectos',
    feature2: 'Renovaciones automáticas',
    feature3: 'Pólizas y comisiones',
    feature4: 'Reportes y crecimiento',
    email_label: 'Correo electrónico',
    password: 'Contraseña',
    signin_button: 'Iniciar sesión',
    logout: 'Cerrar sesión',
    error: 'Error',
    invalid_credentials: 'Correo o contraseña incorrectos',
    loading: 'Cargando...',
  },
  en: {
    hello: 'Hello, Maria',
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
    info: 'Information',
    policies: 'Policies',
    notes: 'Notes',
    history: 'History',
    call: 'Call',
    message: 'Message',
    email: 'Email',
    phone: 'Phone',
    insurance: 'Insurance type',
    expiry: 'Expiration',
    upcoming: 'Upcoming renewals',
    new: 'New',
    login: 'Sign in',
    register: 'Create account',
    tagline: 'CRM for Insurance Agents',
    feature1: 'Clients and prospects',
    feature2: 'Automatic renewals',
    feature3: 'Policies and commissions',
    feature4: 'Reports and growth',
    email_label: 'Email address',
    password: 'Password',
    signin_button: 'Sign in',
    logout: 'Sign out',
    error: 'Error',
    invalid_credentials: 'Invalid email or password',
    loading: 'Loading...',
  }
};

function App() {
  return <div style={{padding: '20px'}}><h1>Insurance CRM</h1><p>Login test</p><input type="email" placeholder="Email" /><input type="password" placeholder="Password" /><button>Sign In</button></div>;
}

function AppOld() {
  const [lang, setLang] = useState('es');
  const [page, setPage] = useState('welcome');
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('Todos');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('Información');
  const [modal, setModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [notifications, setNotifications] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'Salud (ACA)', phone: '', email: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [avatarUrl, setAvatarUrl] = useState(() => {
    try { return localStorage.getItem('userAvatar') || null; } catch { return null; }
  });

  // Auth state
  const [user, setUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // API hooks - FASE 2: Conectar a datos reales
  // Only fetch when user is authenticated
  const { data: clients = [], loading: clientsLoading, error: clientsError, refetch: refetchClients } = useApi(user ? '/clients?agencyId=1' : null);
  const { data: policies = [], loading: policiesLoading, error: policiesError, refetch: refetchPolicies } = useApi(user ? '/policies?agencyId=1' : null);
  const { data: renewals = [], loading: renewalsLoading, error: renewalsError, refetch: refetchRenewals } = useApi(user ? '/renewals?agencyId=1' : null);

  // Set selected client to first client when data loads
  useEffect(() => {
    if (clients && clients.length > 0 && !selected) {
      setSelected(clients[0]);
    }
  }, [clients, selected]);

  const t = translations[lang];

  // Check for existing token on mount + setup token refresh
  useEffect(() => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const decoded = JSON.parse(atob(token.split('.')[1]));
          setUser(decoded);
          setPage('home');
        } catch (e) {
          localStorage.removeItem('accessToken');
        }
      }
    } catch (e) {
      console.warn('localStorage access failed', e);
    }

    // Auto-refresh token every 20 minutes
    const refreshInterval = setInterval(async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        if (accessToken && refreshToken) {
          const res = await fetch(`${API}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
          });
          if (res.ok) {
            const data = await res.json();
            localStorage.setItem('accessToken', data.accessToken);
            if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
          }
        }
      } catch (e) {
        console.log('Token refresh error', e);
      }
    }, 20 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginForm.email,
          password: loginForm.password
        })
      });

      if (!res.ok) {
        const data = await res.json();
        setLoginError(data.error || t.invalid_credentials);
        return;
      }

      const data = await res.json();
      localStorage.setItem('accessToken', data.accessToken);
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);

      const decoded = JSON.parse(atob(data.accessToken.split('.')[1]));
      setUser(decoded);
      setLoginForm({ email: '', password: '' });
      setPage('home');
    } catch (err) {
      setLoginError('Error de conexión con el servidor');
    } finally {
      setLoginLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem('accessToken');
    setUser(null);
    setPage('welcome');
  }

  function navigate(p) {
    setPage(p);
    setNotifications(false);
    window.scrollTo(0, 0);
  }

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  function validateForm(data) {
    const errors = {};
    if (!data.name?.trim()) errors.name = 'Nombre requerido';
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Email inválido';
    }
    if (data.phone && !/^[\d\-\(\)\+\s]{7,}$/.test(data.phone)) {
      errors.phone = 'Teléfono inválido';
    }
    return errors;
  }

  function handleAvatarUpload(e) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result;
        setAvatarUrl(dataUrl);
        localStorage.setItem('userAvatar', dataUrl);
        showToast('Foto de perfil actualizada', 'success');
      };
      reader.readAsDataURL(file);
    }
  }

  function selectClient(c) {
    setSelected(c);
    setTab('Información');
    navigate('detail');
  }

  async function handleClientFormSubmit(e) {
    e.preventDefault();
    setValidationErrors({});

    // Validar formulario
    const errors = validateForm(form);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showToast('Por favor corrige los errores en el formulario', 'error');
      return;
    }

    // RBAC: Check permissions
    if (user?.role === 'viewer') {
      setFormError('No tienes permiso para realizar esta acción');
      showToast('Permisos insuficientes', 'error');
      return;
    }

    if (modalMode === 'create' && user?.role !== 'admin' && user?.role !== 'agent') {
      setFormError('Solo admins y agentes pueden crear clientes');
      showToast('Permisos insuficientes', 'error');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Sesión expirada. Por favor inicia sesión de nuevo');
      }

      const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      let res;
      try {
        if (modalMode === 'create') {
          res = await fetch(`${API}/clients`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ ...form, agencyId: 1 }),
            signal: controller.signal
          });
        } else if (selected?.id) {
          res = await fetch(`${API}/clients/${selected.id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(form),
            signal: controller.signal
          });
        }
        clearTimeout(timeoutId);
      } catch (fetchErr) {
        if (fetchErr.name === 'AbortError') {
          throw new Error('Tiempo de espera agotado. Intenta de nuevo');
        }
        throw fetchErr;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMsg = errorData.error || errorData.message || `Error ${res.status}`;
        throw new Error(errorMsg);
      }

      if (modalMode === 'edit' && selected?.id) {
        setSelected({ ...selected, ...form });
      }

      setModal(false);
      setForm({ name: '', type: 'Salud (ACA)', phone: '', email: '' });
      setModalMode('create');
      showToast(modalMode === 'create' ? 'Cliente creado' : 'Cliente actualizado', 'success');

      // FASE 6: Invalidate cache after client mutation
      cacheService.invalidate('/clients');

      refetchClients();
    } catch (err) {
      console.error('Form error:', err);
      const errorMsg = err.message || 'Error al guardar cliente';
      setFormError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setFormLoading(false);
    }
  }

  const nav = [
    ['home', Home, t.home],
    ['clients', Users, t.clients],
    ['prospects', Target, t.prospects],
    ['calendar', CalendarDays, t.calendar],
    ['more', MoreHorizontal, t.more]
  ];

  // If not authenticated and not on welcome page, show login
  if (!user && page !== 'welcome') {
    return (
      <div className="app-shell">
        <div className="app">
          <div className="status"><span>9:41</span><span>●●● ▰</span></div>
          <div className="login-page">
            <div className="login-container">
              <div className="login-header">
                <div className="big-shield"><ShieldCheck size={64} strokeWidth={1.7} /></div>
                <h1>Insurance <span>CRM</span></h1>
              </div>

              <form onSubmit={handleLogin} className="login-form">
                {loginError && (
                  <div className="login-error">
                    <AlertCircle size={18} />
                    {loginError}
                  </div>
                )}

                <label>
                  {t.email_label}
                  <input
                    type="email"
                    required
                    value={loginForm.email}
                    onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                    placeholder="admin@insuraflow.com"
                    disabled={loginLoading}
                  />
                </label>

                <label>
                  {t.password}
                  <input
                    type="password"
                    required
                    value={loginForm.password}
                    onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="Admin@123"
                    disabled={loginLoading}
                  />
                </label>

                <button
                  type="submit"
                  className="primary wide"
                  disabled={loginLoading}
                >
                  {loginLoading ? t.loading : t.signin_button}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('welcome')}
                  className="outline wide"
                >
                  {t.register}
                </button>
              </form>

              <div className="login-footer">
                <p><strong>Test Credentials:</strong></p>
                <p>📧 admin@insuraflow.com / Admin@123</p>
                <p>📧 agent@insuraflow.com / Agent@123</p>
                <p>📧 viewer@insuraflow.com / Viewer@123</p>
              </div>

              <div className="language">
                <button onClick={() => setLang('es')} className={lang === 'es' ? 'chosen' : ''}>🇪🇸 Español</button>
                <i />
                <button onClick={() => setLang('en')} className={lang === 'en' ? 'chosen' : ''}>🇺🇸 English</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="app">
        <div className="status"><span>9:41</span><span>●●● ▰</span></div>

        {page === 'welcome' ? (
          <main className="content white-content">
            <div className="welcome">
              <div className="welcome-glow" />
              <div className="brand-center">
                <div className="big-shield"><ShieldCheck size={74} strokeWidth={1.7} /></div>
                <h1>Insurance <span>CRM</span></h1>
                <p>{t.tagline}</p>
              </div>
              <div className="welcome-lower">
                <div className="features">
                  {[[Users, t.feature1], [CalendarDays, t.feature2], [BriefcaseBusiness, t.feature3], [ChartNoAxesCombined, t.feature4]].map(([Icon, label]) =>
                    <div key={label}><Icon size={22} /><span>{label}</span></div>
                  )}
                </div>
                <button className="primary wide" onClick={() => navigate('login')}>{t.login}</button>
                <button className="outline wide" onClick={() => navigate('login')}>{t.register}</button>
                <div className="language">
                  <button onClick={() => setLang('es')} className={lang === 'es' ? 'chosen' : ''}>🇪🇸 Español</button>
                  <i />
                  <button onClick={() => setLang('en')} className={lang === 'en' ? 'chosen' : ''}>🇺🇸 English</button>
                </div>
              </div>
            </div>
          </main>
        ) : page === 'login' ? (
          <div className="login-page">
            <div className="login-container">
              <div className="login-header">
                <div className="big-shield"><ShieldCheck size={64} strokeWidth={1.7} /></div>
                <h1>Insurance <span>CRM</span></h1>
              </div>

              <form onSubmit={handleLogin} className="login-form">
                {loginError && (
                  <div className="login-error">
                    <AlertCircle size={18} />
                    {loginError}
                  </div>
                )}

                <label>
                  {t.email_label}
                  <input
                    type="email"
                    required
                    value={loginForm.email}
                    onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                    placeholder="admin@insuraflow.com"
                    disabled={loginLoading}
                  />
                </label>

                <label>
                  {t.password}
                  <input
                    type="password"
                    required
                    value={loginForm.password}
                    onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="Admin@123"
                    disabled={loginLoading}
                  />
                </label>

                <button
                  type="submit"
                  className="primary wide"
                  disabled={loginLoading}
                >
                  {loginLoading ? t.loading : t.signin_button}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('welcome')}
                  className="outline wide"
                >
                  {t.register}
                </button>
              </form>

              <div className="language">
                <button onClick={() => setLang('es')} className={lang === 'es' ? 'chosen' : ''}>🇪🇸 Español</button>
                <i />
                <button onClick={() => setLang('en')} className={lang === 'en' ? 'chosen' : ''}>🇺🇸 English</button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <header className="topbar">
              <div className="header-brand" onClick={() => navigate('home')}><ShieldCheck size={29} /><span>Insurance <b>CRM</b></span></div>
              <div className="header-actions">
                <span style={{ fontSize: '11px', color: '#666', marginRight: '12px', padding: '4px 8px', backgroundColor: '#f0f0f0', borderRadius: '12px' }}>
                  {user?.role === 'admin' ? 'Admin' : user?.role === 'agent' ? 'Agent' : 'Viewer'}
                </span>
                <button aria-label="Notificaciones" className="icon-button" onClick={() => setNotifications(!notifications)}><Bell size={22} /><span className="dot" /></button>
                <button className="avatar-photo" onClick={() => navigate('more')} style={{ padding: 0, overflow: 'hidden' }}>
                  {avatarUrl ? <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : user?.email?.charAt(0).toUpperCase()}
                </button>
              </div>
            </header>

            {notifications && <div className="notification-pop"><b>Notificaciones</b><p>🔔 Tienes 3 renovaciones para revisar esta semana.</p><button onClick={() => navigate('renewals')}>Ver renovaciones →</button></div>}

            {page === 'home' ? (
              <main className="content dashboard">
                {(clientsLoading || policiesLoading || renewalsLoading) ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <Loader size={40} style={{ margin: '0 auto 20px', animation: 'spin 1s linear infinite' }} />
                    <p>{t.loading}</p>
                  </div>
                ) : (clientsError || policiesError || renewalsError) ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: '#ef4444' }}>
                    <AlertCircle size={40} style={{ margin: '0 auto 20px' }} />
                    <p>Error cargando datos</p>
                    <button
                      className="primary small"
                      onClick={() => { refetchClients(); refetchPolicies(); refetchRenewals(); }}
                      style={{ marginTop: '10px' }}
                    >
                      Reintentar
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="greeting">
                      <div><h2>{t.hello}</h2><p>{t.role}</p></div>
                      <button className="month-pill">{t.month}⌄</button>
                    </div>
                    <div className="metrics">
                      <Metric icon={Users} label={t.clients} value={clients?.length || 0} growth="+8%" tone="blue" onClick={() => navigate('clients')} />
                      <Metric icon={ShieldCheck} label={t.activePolicies} value={policies?.length || 0} growth="+5%" tone="blue" onClick={() => navigate('clients')} />
                      <Metric icon={CalendarDays} label={t.renewals} value={renewals?.length || 0} tone="pink" onClick={() => navigate('renewals')} />
                      <Metric icon={Clock3} label={t.quotes} value="12" tone="purple" onClick={() => navigate('prospects')} />
                    </div>
                    <div className="commission card">
                      <div><span className="commission-icon"><Coins size={27} /></span><div><p>{t.commissions}</p><strong>$3,450</strong></div></div>
                      <div className="trend"><small>↑ +12%</small><svg width="86" height="42" viewBox="0 0 86 42"><path d="M2 35 L18 19 L30 23 L43 10 L58 14 L70 5 L83 2" stroke="#07995d" fill="none" strokeWidth="2.5" strokeLinecap="round" /></svg></div>
                    </div>
                    <div className="task-card card">
                      <div className="section-title"><h3>{t.tasks}</h3><button onClick={() => navigate('calendar')}>{t.seeAll}</button></div>
                      {[[Phone, 'Llamar a 3 prospectos', 'Hoy, 10:00 AM', 'green'], [CalendarDays, 'Seguimiento de cotización', 'Hoy, 11:30 AM', 'mint'], [Bell, 'Recordatorio de renovación', 'Juan Pérez — Vence pronto', 'coral']].map(([Icon, title, sub, tone]) =>
                        <button className="task" key={title} onClick={() => navigate('calendar')}><span className={'task-icon ' + tone}><Icon size={21} /></span><span><b>{title}</b><small>{sub}</small></span><ChevronRight size={16} /></button>
                      )}
                    </div>
                  </>
                )}
              </main>
            ) : page === 'clients' ? (
              <main className="content white-content">
                <div className="page-heading"><h2>{t.clients}</h2>{(user?.role === 'admin' || user?.role === 'agent') && <button className="primary small" onClick={() => { setModalMode('create'); setForm({ name: '', type: 'Salud (ACA)', phone: '', email: '' }); setModal(true); }}><Plus size={16} />{t.new}</button>}</div>

                {clientsLoading ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <Loader size={32} style={{ margin: '0 auto 15px', animation: 'spin 1s linear infinite' }} />
                    <p>{t.loading}</p>
                  </div>
                ) : clientsError ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: '#ef4444' }}>
                    <AlertCircle size={32} style={{ margin: '0 auto 15px' }} />
                    <p>Error cargando clientes</p>
                    <button className="primary small" onClick={refetchClients} style={{ marginTop: '10px' }}>Reintentar</button>
                  </div>
                ) : (
                  <>
                    <div className="searchbox"><Search size={19} /><input placeholder={t.search} value={search} onChange={e => setSearch(e.target.value)} /><SlidersHorizontal size={19} /></div>
                    <div className="filters">{[t.all, t.active, t.renew].map((v, i) => <button key={v} className={filter == ['Todos', 'Activos', 'Renovaciones'][i] ? 'on' : ''} onClick={() => setFilter(['Todos', 'Activos', 'Renovaciones'][i])}>{v} {i === 0 ? `(${clients?.length || 0})` : i === 1 ? `(${clients?.filter(c => c.status === 'Activo').length || 0})` : `(${clients?.filter(c => c.status === 'Renovación').length || 0})`}</button>)}</div>
                    <div className="client-list">{clients.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()) && (filter === 'Todos' || (filter === 'Activos' ? c.status === 'Activo' : c.status === 'Renovación'))).map(c => <button className="client-row" key={c.id} onClick={() => selectClient(c)}><span className={'initials ' + (c.color || 'blue')}>{c.initials || c.name?.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase()}</span><span className="client-name"><b>{c.name}</b><small>{c.type}</small></span><span className="client-meta"><span className={'badge ' + (c.status === 'Activo' ? 'success' : 'warning')}>{c.status}</span><small>Vence: {c.date || 'Por definir'}</small></span></button>)}{clients.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()) && (filter === 'Todos' || (filter === 'Activos' ? c.status === 'Activo' : c.status === 'Renovación'))).length === 0 && <p className="empty">No se encontraron clientes.</p>}</div>
                  </>
                )}
              </main>
            ) : page === 'detail' ? (
              <main className="content detail">
                <div className="detail-toolbar"><button onClick={() => navigate('clients')}><ChevronLeft /></button>{(user?.role === 'admin' || user?.role === 'agent') && <button onClick={() => { setModalMode('edit'); setForm({ name: selected.name, type: selected.type, phone: selected.phone, email: selected.email }); setModal(true); }}>✎</button>}</div>
                <div className="profile">
                  <div className="avatar-section">
                    <span className={'initials large ' + selected.color}>{selected.initials}</span>
                  </div>
                  <div className="profile-info">
                    <div className="profile-header">
                      <h2>{selected.name}</h2>
                      <span className="badge success">{t.active || 'Activo'}</span>
                    </div>
                    <div className="profile-meta">
                      <div className="meta-item">
                        <span className="meta-label">{t.insurance}</span>
                        <span className="meta-value">{selected.type}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">{t.phone}</span>
                        <span className="meta-value">{selected.phone}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">{t.expiry}</span>
                        <span className="meta-value">{selected.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="contact-actions">
                    <div className="contact-actions-label">Acciones</div>
                    <a href={'tel:' + selected.phone}><Phone size={16} />{t.call}</a>
                    <a href={'sms:' + selected.phone}><MessageCircle size={16} />{t.message}</a>
                    <a href={'mailto:' + selected.email}><Mail size={16} />{t.email}</a>
                  </div>
                </div>
                <div className="detail-panel"><div className="tabs">{[t.info, t.policies, t.notes, t.history].map((label, i) => <button key={label} className={tab == ['Información', 'Pólizas', 'Notas', 'Historial'][i] ? 'active' : ''} onClick={() => setTab(['Información', 'Pólizas', 'Notas', 'Historial'][i])}>{label}</button>)}</div>{tab === 'Información' ? <div className="detail-rows">{[[Users, t.phone, selected.phone], [Mail, 'Correo', selected.email], [ShieldCheck, t.insurance, selected.type], [CalendarDays, t.expiry, selected.date]].map(([Icon, label, value]) => <div className="detail-row" key={label}><Icon size={17} /><span>{label}</span><b>{value}</b></div>)}</div> : <div className="placeholder"><ClipboardList size={32} /><h3>{tab}</h3><p>Vista de demostración. Claude Code podrá conectar esta sección con los datos reales.</p></div>}</div>
              </main>
            ) : page === 'renewals' ? (
              <main className="content white-content">
                <div className="page-heading"><button className="back" onClick={() => navigate('home')}><ChevronLeft /></button><h2>{t.upcoming}</h2></div>

                {renewalsLoading ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <Loader size={32} style={{ margin: '0 auto 15px', animation: 'spin 1s linear infinite' }} />
                    <p>{t.loading}</p>
                  </div>
                ) : renewalsError ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: '#ef4444' }}>
                    <AlertCircle size={32} style={{ margin: '0 auto 15px' }} />
                    <p>Error cargando renovaciones</p>
                    <button className="primary small" onClick={refetchRenewals} style={{ marginTop: '10px' }}>Reintentar</button>
                  </div>
                ) : (
                  <div className="renew-list">
                    {renewals && renewals.length > 0 ? (
                      renewals.map((r, i) => (
                        <button className="renew-row" key={r.id} onClick={() => selectClient(r)}>
                          <span className="renew-icon"><CalendarDays size={22} /></span>
                          <span>
                            <b>{r.name}</b>
                            <small>{r.type}</small>
                          </span>
                          <span className={'days ' + (i === 0 ? 'red' : i === 1 ? 'amber' : 'green')}>
                            {r.days_until_renewal || (i + 1) * 15} días
                          </span>
                        </button>
                      ))
                    ) : (
                      <p className="empty">No hay renovaciones pendientes</p>
                    )}
                  </div>
                )}
              </main>
            ) : page === 'prospects' ? (
              <main className="content white-content">
                <div className="page-heading"><h2>{t.prospects}</h2><button className="primary small" onClick={() => { setModalMode('create'); setForm({ name: '', type: 'Salud (ACA)', phone: '', email: '' }); setModal(true); }}><Plus size={16} />{t.new}</button></div>
                <div className="placeholder expanded"><Target size={48} /><h3>Gestiona tus oportunidades</h3><p>Visualiza prospectos, cotizaciones y seguimiento comercial desde un mismo lugar.</p><div className="pipeline"><span>Nuevo</span><ChevronRight /><span>Contactado</span><ChevronRight /><span>Cotización</span></div></div>
              </main>
            ) : page === 'calendar' ? (
              <main className="content white-content">
                <div className="page-heading"><h2>{t.calendar}</h2></div>
                <div className="calendar-card"><div className="calendar-head"><h3>Noviembre 2026</h3><CalendarDays /></div><div className="calendar-grid">{['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => <b key={i}>{d}</b>)}{Array.from({ length: 35 }, (_, i) => <span key={i} className={i === 10 ? 'today' : ''}>{i < 30 ? i + 1 : ''}</span>)}</div></div>
                <div className="task-card card"><div className="section-title"><h3>Próximas tareas</h3></div><div className="task"><span className="task-icon green"><Phone /></span><span><b>Llamar a prospectos</b><small>10:00 AM</small></span></div><div className="task"><span className="task-icon mint"><CalendarDays /></span><span><b>Seguimiento de cotización</b><small>11:30 AM</small></span></div></div>
              </main>
            ) : (
              <main className="content white-content">
                <div className="page-heading"><h2>Configuración</h2></div>
                <div className="settings-card">
                  <div className="settings-user" style={{ position: 'relative' }}>
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)', cursor: 'pointer' }} onClick={() => document.getElementById('avatar-input')?.click()} />
                    ) : (
                      <span className="avatar-photo" style={{ cursor: 'pointer' }} onClick={() => document.getElementById('avatar-input')?.click()}>{user?.email?.charAt(0).toUpperCase()}</span>
                    )}
                    <input id="avatar-input" type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                    <span>
                      <b>{user?.email}</b>
                      <small>{user?.role === 'admin' ? 'Administrador' : user?.role === 'agent' ? 'Agente' : 'Solo Lectura'}</small>
                    </span>
                  </div>
                  <button onClick={() => setLang(lang === 'es' ? 'en' : 'es')}><Globe /> Idioma / Language <span>{lang === 'es' ? 'Español' : 'English'} →</span></button>
                  <button onClick={() => navigate('renewals')}><Bell /> Renovaciones <ChevronRight /></button>
                  <button onClick={logout}><LogOut /> {t.logout} <ChevronRight /></button>
                </div>
              </main>
            )}

            <nav className="bottom-nav">{nav.map(([id, Icon, label]) => <button key={id} className={(page === id || (page === 'detail' && id === 'clients') || (page === 'renewals' && id === 'home')) ? 'active' : ''} onClick={() => navigate(id)}><Icon size={22} strokeWidth={2} /><span>{label}</span></button>)}</nav>
          </>
        )}

        {modal && (
          <div className="modal-backdrop" onClick={() => setModal(false)}>
            <form className="modal" onClick={e => e.stopPropagation()} onSubmit={handleClientFormSubmit}>
              <div className="modal-head"><h3>{modalMode === 'edit' ? 'Editar cliente' : 'Nuevo cliente'}</h3><button type="button" onClick={() => setModal(false)}><X /></button></div>
              {formError && <div className="login-error" style={{ marginBottom: '15px' }}><AlertCircle size={18} />{formError}</div>}
              <label>Nombre completo<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nombre y apellido" disabled={formLoading} />{validationErrors.name && <small style={{ color: '#dc2626', marginTop: '4px', display: 'block' }}>⚠️ {validationErrors.name}</small>}</label>
              <label>Tipo de seguro<select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} disabled={formLoading}>{['Salud (ACA)', 'Medicare', 'Vida', 'Auto', 'Hogar'].map(x => <option key={x}>{x}</option>)}</select></label>
              <label>Teléfono<input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(305) 555-0000" disabled={formLoading} />{validationErrors.phone && <small style={{ color: '#dc2626', marginTop: '4px', display: 'block' }}>⚠️ {validationErrors.phone}</small>}</label>
              <label>Correo electrónico<input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="correo@ejemplo.com" disabled={formLoading} />{validationErrors.email && <small style={{ color: '#dc2626', marginTop: '4px', display: 'block' }}>⚠️ {validationErrors.email}</small>}</label>
              <button className="primary wide" type="submit" disabled={formLoading}>{formLoading ? t.loading : 'Guardar cliente'}</button>
            </form>
          </div>
        )}

        {toast && (
          <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: toast.type === 'success' ? '#10b981' : toast.type === 'error' ? '#ef4444' : '#f59e0b',
            color: 'white',
            padding: '14px 20px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            fontSize: '13px',
            fontWeight: '700',
            zIndex: 100,
            maxWidth: '380px',
            animation: 'slideUp 0.3s ease-out',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {toast.type === 'success' ? '✓' : toast.type === 'error' ? '⚠️' : 'ℹ️'}
            {toast.message}
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, growth, tone, onClick }) {
  return <button onClick={onClick} className={'metric ' + tone}><Icon size={26} /><span>{label}</span><div><strong>{value}</strong>{growth && <small>↑ {growth}</small>}</div></button>;
}

createRoot(document.getElementById('root')).render(<AppOld />);
