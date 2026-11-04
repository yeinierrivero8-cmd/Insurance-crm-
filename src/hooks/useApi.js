import { useState, useEffect } from 'react';
import { apiClient } from '../lib/apiClient.js';
import { cacheService } from '../lib/cacheService.js';

// Global map to deduplicate concurrent requests
const pendingRequests = new Map();

export const useApi = (endpoint, options = {}) => {
  // Always declare hooks at the top, in the same order (React rule)
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const cache = options.cache !== false;
  const dedupeWindow = options.dedupeWindow || 500;

  const getErrorMessage = (err) => {
    if (err.message === 'Network request failed') {
      return 'No hay conexión. Verifica tu red y reintentas.';
    }
    if (err.message === 'Request timeout') {
      return 'Conexión lenta. Intenta de nuevo.';
    }
    if (err.message === 'Unauthorized') {
      return 'Sesión expirada. Por favor inicia sesión de nuevo.';
    }
    return err.message || 'Error al cargar datos. Intenta de nuevo.';
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const cached = cache && cacheService.get(endpoint);
      if (cached) {
        setData(cached.data || cached);
        setLoading(false);
        return;
      }

      if (pendingRequests.has(endpoint)) {
        const promise = pendingRequests.get(endpoint);
        const result = await promise;
        setData(result.data || result);
        setLoading(false);
        return;
      }

      const fetchPromise = apiClient.get(endpoint);
      pendingRequests.set(endpoint, fetchPromise);

      const result = await fetchPromise;
      if (cache) {
        cacheService.set(endpoint, result);
      }

      setData(result.data || result);
      setTimeout(() => pendingRequests.delete(endpoint), dedupeWindow);
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      setData(null);
      console.error(`[API Error] ${endpoint}:`, err);
      pendingRequests.delete(endpoint);
    } finally {
      setLoading(false);
    }
  };

  // Only fetch if endpoint exists
  useEffect(() => {
    if (endpoint) {
      fetchData();
    }
  }, [endpoint]);

  const refetch = async () => {
    setRetryCount(prev => prev + 1);
    // Invalidate cache on refetch
    if (cache) {
      cacheService.invalidate(endpoint);
    }
    await fetchData();
  };

  return { data, loading, error, refetch, retryCount };
};
