import React, { useState } from 'react';
import useMovies from '../hooks/useMoviesSimple';
import MovieCard from './MovieCard';
import { useModalStore } from '../store/modalStore';

const GENRES = [
  { id: 0, name: 'Todos' },
  { id: 28, name: 'Ação' },
  { id: 35, name: 'Comédia' },
  { id: 18, name: 'Drama' },
  { id: 27, name: 'Terror' },
];

export default function MovieGrid() {
  const [selectedGenre, setSelectedGenre] = useState(0);
  const { openModal } = useModalStore();
  
  const moviesData = useMovies('popular');
  const seriesData = useMovies('tv:popular');

  const filterByGenre = (items: any[], genreId: number) => {
    if (genreId === 0) return items;
    return items.filter(item => item.genre_ids?.includes(genreId));
  };

  const filteredMovies = filterByGenre(moviesData.movies, selectedGenre);
  const filteredSeries = filterByGenre(seriesData.movies, selectedGenre);

  return (
    <div style={{ padding: '2rem 1rem', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Filmes Section */}
      <section style={{ marginBottom: '3rem' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '1.5rem' 
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
              Filmes Populares
            </h2>
            <p style={{ margin: '0.5rem 0 0 0', color: '#94a3b8' }}>
              Descubra os filmes mais populares
            </p>
          </div>
          
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(Number(e.target.value))}
            style={{
              padding: '0.5rem',
              borderRadius: '0.375rem',
              border: '1px solid #374151',
              backgroundColor: '#1f2937',
              color: '#e5e7eb',
            }}
          >
            {GENRES.map(genre => (
              <option key={genre.id} value={genre.id}>
                {genre.name}
              </option>
            ))}
          </select>
        </div>

        {moviesData.loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
            Carregando...
          </div>
        ) : moviesData.error ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444' }}>
            {moviesData.error}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '1rem',
          }}>
            {filteredMovies.map(movie => (
              <MovieCard
                key={movie.id}
                item={movie}
                onClick={() => openModal(movie.id, 'movie')}
              />
            ))}
          </div>
        )}
      </section>

      {/* Séries Section */}
      <section>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
            Séries Populares
          </h2>
          <p style={{ margin: '0.5rem 0 0 0', color: '#94a3b8' }}>
            Descubra as séries mais populares
          </p>
        </div>

        {seriesData.loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
            Carregando...
          </div>
        ) : seriesData.error ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444' }}>
            {seriesData.error}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '1rem',
          }}>
            {filteredSeries.map(series => (
              <MovieCard
                key={series.id}
                item={series}
                onClick={() => openModal(series.id, 'tv')}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}