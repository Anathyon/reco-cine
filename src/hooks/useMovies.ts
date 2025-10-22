import { useEffect, useState } from 'react';
import { fetchMovies, fetchMovieDetails } from '../api/tmdb';
import { Movie } from '../types';

const useMovies = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const getMovies = async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMovies(query);
      setMovies(data.results);
    } catch (err) {
      setError('Failed to fetch movies');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getMovieDetails = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const details = await fetchMovieDetails(id);
      return details;
    } catch (err) {
      setError('Failed to fetch movie details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getMovies('popular'); // Fetch popular movies on initial load
  }, []);

  return { movies, loading, error, getMovies, getMovieDetails };
};

export default useMovies;