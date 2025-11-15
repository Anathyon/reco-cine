import { useState, useEffect } from 'react';
import { fetchMovies } from '../api/tmdb';
import { Movie } from '../types';

interface UseMoviesResult {
  movies: Movie[];
  loading: boolean;
  error: string | null;
}

// Cache simples para evitar requisições desnecessárias
const cache = new Map<string, Movie[]>();

export default function useMoviesSimple(query: string): UseMoviesResult {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query) {
      setMovies([]);
      setLoading(false);
      setError(null);
      return;
    }

    // Verificar cache primeiro
    if (cache.has(query)) {
      setMovies(cache.get(query) || []);
      setLoading(false);
      setError(null);
      return;
    }

    let isCancelled = false;

    const loadMovies = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchMovies(query);
        
        if (!isCancelled) {
          const moviesList = result.results || [];
          setMovies(moviesList);
          cache.set(query, moviesList);
          setError(null);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Erro ao carregar filmes:', err);
          setMovies([]);
          setError('Erro ao carregar dados');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadMovies();

    return () => {
      isCancelled = true;
    };
  }, [query]);

  return { movies, loading, error };
}