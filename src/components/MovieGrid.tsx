import React, { useEffect, useMemo, useState, useCallback } from 'react';
import useMovies from '../hooks/useMovies';
import MovieCard from './MovieCard';
import MovieModal from './MovieModal';
import { useModalStore } from '../store/modalStore';

const GENRES = [
  { id: 0, name: 'Todos' },
  { id: 28, name: 'Ação' },
  { id: 35, name: 'Comédia' },
  { id: 18, name: 'Drama' },
  { id: 27, name: 'Terror' },
  { id: 10759, name: 'Ação & Aventura' },
];

export default function MovieGrid() {
  const moviesHook = useMovies();
  const seriesHook = useMovies();
  const { openModal } = useModalStore();
  const [selectedGenre, setSelectedGenre] = useState<number>(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    seriesHook.getMovies('tv:popular');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredMovies = useMemo(() => {
    if (!selectedGenre || selectedGenre === 0) return moviesHook.movies;
    return moviesHook.movies.filter((m) => (m.genre_ids || []).includes(selectedGenre));
  }, [moviesHook.movies, selectedGenre]);

  const filteredSeries = useMemo(() => {
    if (!selectedGenre || selectedGenre === 0) return seriesHook.movies;
    return seriesHook.movies.filter((s) => (s.genre_ids || []).includes(selectedGenre));
  }, [seriesHook.movies, selectedGenre]);

  const gridWrapperStyle: React.CSSProperties = {
    maxWidth: 1200,
    marginLeft: 'auto',
    marginRight: 'auto',
    width: '100%',
  };

  const responsiveGridStyle: React.CSSProperties = {
    display: isMobile ? 'flex' : 'grid',
    gridTemplateColumns: isMobile ? 'none' : 'repeat(auto-fill, minmax(10rem, 1fr))',
    overflowX: isMobile ? 'auto' : 'visible',
    gap: isMobile ? '0.75rem' : '1rem',
    paddingBottom: isMobile ? '0.5rem' : '0',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    justifyContent: 'center',
  };

  const handleMovieClick = useCallback((movieId: number, type: 'movie' | 'tv') => {
    openModal(movieId, type);
  }, [openModal]);

  return (
    <section style={{ width: '100%', marginTop: '3rem' }}>
      <MovieModal />

      <div style={{ marginBottom: '1.5rem', ...gridWrapperStyle }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between', 
          alignItems: isMobile ? 'flex-start' : 'center',
          gap: '1rem',
          marginBottom: '0.75rem' 
        }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Filmes Populares</h2>
            <p style={{ color: '#94a3b8', marginTop: '0.375rem' }}>Explore os filmes mais populares</p>
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            alignItems: 'center',
            width: isMobile ? '100%' : 'auto'
          }}>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(Number(e.target.value))}
              style={{ 
                padding: '0.5rem 0.625rem', 
                background: '#071226', 
                color: '#e6eef8', 
                borderRadius: '0.375rem', 
                border: '1px solid #152033',
                fontSize: '0.875rem',
                flex: isMobile ? '1' : 'none'
              }}
            >
              {GENRES.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {moviesHook.loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Carregando...</div>
        ) : filteredMovies.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Nenhum resultado encontrado</div>
        ) : (
          <div style={responsiveGridStyle}>
            {filteredMovies.map((m) => (
              <div key={`movie-${m.id}`} style={{ 
                minWidth: isMobile ? '7.5rem' : 'auto',
                width: isMobile ? '7.5rem' : 'auto'
              }}>
                <MovieCard item={m} type="movie" onClick={() => handleMovieClick(m.id, 'movie')} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '1.5rem', ...gridWrapperStyle }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '0.75rem' 
        }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Séries Populares</h2>
            <p style={{ color: '#94a3b8', marginTop: '0.375rem' }}>Explore as séries mais populares</p>
          </div>
        </div>

        {seriesHook.loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Carregando...</div>
        ) : filteredSeries.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Nenhum resultado encontrado</div>
        ) : (
          <div style={responsiveGridStyle}>
            {filteredSeries.map((s) => (
              <div key={`tv-${s.id}`} style={{ 
                minWidth: isMobile ? '7.5rem' : 'auto',
                width: isMobile ? '7.5rem' : 'auto'
              }}>
                <MovieCard item={s} type="tv" onClick={() => handleMovieClick(s.id, 'tv')} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}