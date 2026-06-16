// src/hooks/useFetch.js
import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

export function useFetch(url, intervalo = null) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const json = await api.get(url);
      setData(json);
      setError(null);
    } catch (e) {
      console.error(`useFetch error (${url}):`, e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    load();
    
    if (intervalo) {
      const timer = setInterval(load, intervalo);
      return () => clearInterval(timer);
    }
  }, [load, intervalo]);

  const refetch = useCallback(() => {
    load();
  }, [load]);

  return { data, loading, error, refetch };
}