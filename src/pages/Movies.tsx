import React from 'react';
import useMovies from '../hooks/useMovies';
import MovieCard from '../components/MovieCard';
import SearchBar from '../components/SearchBar';
import { Movie } from '../types';

const Movies = () => {
  const { movies, loading, error, getMovies } = useMovies();

  const handleSearch = (params: { query: string; genre: string; releaseYear: string; popularity: string }) => {
    getMovies(params.query || 'popular');
  };

  return (
    <div style={{ padding: 16 }}>
      <h1 className="text-2xl font-bold" style={{ marginBottom: 16 }}>Movies</h1>
      <SearchBar onSearch={handleSearch} />
      {loading && <p>Loading...</p>}
      {error && <p>Error fetching movies: {error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" style={{ gap: 16 }}>
        {movies.map((movie: Movie) => (
          <MovieCard 
            key={movie.id}
            item={movie}
            onClick={() => {}}
          />
        ))}
      </div>
    </div>
  );
};

export default Movies;