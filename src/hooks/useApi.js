import { useState, useEffect } from 'react';
import { apiClient } from '../lib/apiClient.js';
import { cacheService } from '../lib/cacheService.js';

// Global map to deduplicate concurrent requests
const pendingRequests = new Map();

export const useApi = (endpoint, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const cache = options.cache !== false; // Default: enabled
  const dedupeWindow = options.dedupeWindow || 500; // ms

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

      // PHASE 1: Check cache
      if (cache) {
        const cached = cacheService.get(endpoint);
        if (cached) {
          setData(cached.data || cached);
          setLoading(false);
          return;
        }
      }

      // PHASE 2: Check pending dedup request
      if (pendingRequests.has(endpoint)) {
        const promise = pendingRequests.get(endpoint);
        const result = await promise;
        setData(result.data || result);
        setLoading(false);
        return;
      }

      // PHASE 3: Fetch from network (create dedup promise)
      const fetchPromise = apiClient.get(endpoint);
      pendingRequests.set(endpoint, fetchPromise);

      const result = await fetchPromise;

      // Cache the result
      if (cache) {
        cacheService.set(endpoint, result);
      }

      setData(result.data || result);

      // Clean up dedup after window
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

  useEffect(() => {
    fetchData();
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
