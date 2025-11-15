import { useState, useEffect, useRef } from 'react';
import { fetchMovies } from '../api/tmdb';
import { Movie } from '../types';

interface UseMoviesResult {
  movies: Movie[];
  loading: boolean;
  error: string | null;
}

const cache = new Map<string, { data: Movie[]; timestamp: number }>();
const errorCount = new Map<string, number>();
const CACHE_TIME = 5 * 60 * 1000; // 5 minutos
const MAX_RETRIES = 3;

export default function useMovies(query: string): UseMoviesResult {
  const [state, setState] = useState<UseMoviesResult>({
    movies: [],
    loading: true,
    error: null,
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    
    if (!query) {
      if (mountedRef.current) {
        setState({ movies: [], loading: false, error: null });
      }
      return;
    }

    // Circuit breaker - se muitos erros, não tenta mais
    const errors = errorCount.get(query) || 0;
    if (errors >= MAX_RETRIES) {
      if (mountedRef.current) {
        setState({ movies: [], loading: false, error: 'Muitas tentativas falharam' });
      }
      return;
    }

    // Verificar cache
    const cached = cache.get(query);
    if (cached && Date.now() - cached.timestamp < CACHE_TIME) {
      if (mountedRef.current) {
        setState({ movies: cached.data, loading: false, error: null });
      }
      return;
    }

    let cancelled = false;
    
    const loadData = async () => {
      try {
        if (mountedRef.current && !cancelled) {
          setState(prev => ({ ...prev, loading: true, error: null }));
        }
        
        const result = await fetchMovies(query);
        
        if (mountedRef.current && !cancelled) {
          const movies = result.results || [];
          cache.set(query, { data: movies, timestamp: Date.now() });
          errorCount.delete(query); // Reset error count on success
          setState({ movies, loading: false, error: null });
        }
      } catch (error) {
        if (mountedRef.current && !cancelled) {
          const currentErrors = errorCount.get(query) || 0;
          errorCount.set(query, currentErrors + 1);
          console.error('Erro ao buscar filmes:', error);
          setState({ movies: [], loading: false, error: 'Erro ao carregar dados' });
        }
      }
    };

    const timeoutId = setTimeout(loadData, 100);

    return () => {
      cancelled = true;
      mountedRef.current = false;
      clearTimeout(timeoutId);
    };
  }, [query]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return state;
}