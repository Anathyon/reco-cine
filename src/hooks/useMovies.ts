import { useState, useEffect } from 'react';
import { fetchMovies } from '../api/tmdb';
import { Movie } from '../types';

interface UseMoviesResult {
  movies: Movie[];
  loading: boolean;
  error: string | null;
}

const cache = new Map<string, { data: Movie[]; timestamp: number }>();
const CACHE_TIME = 5 * 60 * 1000; // 5 minutos

export default function useMovies(query: string): UseMoviesResult {
  const [state, setState] = useState<UseMoviesResult>({
    movies: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!query) return;

    // Verificar cache
    const cached = cache.get(query);
    if (cached && Date.now() - cached.timestamp < CACHE_TIME) {
      setState({ movies: cached.data, loading: false, error: null });
      return;
    }

    let cancelled = false;

    const loadData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        
        const result = await fetchMovies(query);
        
        if (!cancelled) {
          const movies = result.results || [];
          cache.set(query, { data: movies, timestamp: Date.now() });
          setState({ movies, loading: false, error: null });
        }
      } catch {
        if (!cancelled) {
          setState({ movies: [], loading: false, error: 'Erro ao carregar' });
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [query]);

  return state;
}