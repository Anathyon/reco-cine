import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { fetchMovieDetails } from '../api/tmdb';
import { Movie } from '../types';

export default function Details() {
  const router = useRouter();
  const { id } = router.query;
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getMovieDetails = async () => {
      try {
        const data = await fetchMovieDetails(Number(id));
        setMovie(data);
      } catch (err) {
        setError('Failed to fetch movie details');
        console.error(err);       
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      getMovieDetails();
    }
  }, [id]);

  if (loading) return <div style={{ padding: '2rem', color: 'white' }}>Carregando...</div>;
  if (error) return <div style={{ padding: '2rem', color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: '2rem', backgroundColor: '#0f172a', color: 'white', minHeight: '100vh' }}>
      {movie && (
        <>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>{movie.title}</h1>
          <p style={{ marginBottom: '0.5rem' }}>Avaliação: {movie.vote_average}</p>
          <p style={{ marginBottom: '0.5rem' }}>{movie.overview}</p>
          <p style={{ marginBottom: '0.5rem' }}>Data de Lançamento: {movie.release_date}</p>
        </>
      )}
    </div>
  );
}