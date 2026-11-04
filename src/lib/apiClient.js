const API_BASE = typeof window !== 'undefined' ? `${window.location.origin}/api` : 'http://localhost:5000/api';
const REQUEST_TIMEOUT = 10000; // 10 seconds

const createAbortController = (timeout) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  return { controller, timeoutId };
};

const handleFetchError = (err) => {
  if (err instanceof TypeError) {
    if (err.message.includes('Failed to fetch')) {
      throw new Error('Network request failed');
    }
  }
  if (err.name === 'AbortError') {
    throw new Error('Request timeout');
  }
  throw err;
};

const getErrorMessage = (status) => {
  const messages = {
    400: 'Solicitud inválida',
    401: 'Unauthorized',
    403: 'Acceso denegado',
    404: 'No encontrado',
    429: 'Demasiadas solicitudes. Intenta de nuevo más tarde',
    500: 'Error del servidor. Intenta de nuevo',
    502: 'Servidor no disponible',
    503: 'Servicio no disponible',
  };
  return messages[status] || `Error ${status}`;
};

export const apiClient = {
  async get(endpoint, options = {}) {
    const { controller, timeoutId } = createAbortController(REQUEST_TIMEOUT);

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          ...options.headers,
        },
        signal: controller.signal,
        ...options,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorMsg = getErrorMessage(response.status);
        throw new Error(errorMsg);
      }

      return response.json();
    } catch (err) {
      clearTimeout(timeoutId);
      handleFetchError(err);
    }
  },

  async post(endpoint, body, options = {}) {
    const { controller, timeoutId } = createAbortController(REQUEST_TIMEOUT);

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          ...options.headers,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
        ...options,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorMsg = getErrorMessage(response.status);
        throw new Error(errorMsg);
      }

      return response.json();
    } catch (err) {
      clearTimeout(timeoutId);
      handleFetchError(err);
    }
  },
};
