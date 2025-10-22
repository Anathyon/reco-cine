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
      } finally {
        setLoading(false);
      }
    };

    getMovieDetails();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="p-4 bg-gray-950 text-white">
      {movie && (
        <>
          <h1 className="text-3xl font-bold">{movie.title}</h1>
          <p className="mt-2">Rating: {movie.vote_average}</p>
          <p className="mt-2">{movie.overview}</p>
          <p className="mt-2">Release Date: {movie.release_date}</p>
          {/* Add more movie details as needed */}
        </>
      )}
    </div>
  );
}