import React, { useEffect, useMemo, useState } from 'react';
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
  // adicione mais conforme desejar
];

export default function MovieGrid() {
  const moviesHook = useMovies();
  const seriesHook = useMovies();
  const { openModal } = useModalStore();
  const [selectedGenre, setSelectedGenre] = useState<number>(0);

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
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: 16,
    justifyContent: 'center',
  };

  return (
    <section style={{ width: '100%', marginTop: 48 }}>
      <MovieModal />

      <div style={{ marginBottom: 24, ...gridWrapperStyle }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Filmes Populares</h2>
            <p style={{ color: '#94a3b8', marginTop: 6 }}>Explore os filmes mais populares</p>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(Number(e.target.value))}
              style={{ padding: '8px 10px', background: '#071226', color: '#e6eef8', borderRadius: 6, border: '1px solid #152033' }}
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
          <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>Carregando...</div>
        ) : filteredMovies.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>Nenhum resultado encontrado</div>
        ) : (
          <div style={responsiveGridStyle}>
            {filteredMovies.map((m) => (
              <MovieCard key={`movie-${m.id}`} item={m} type="movie" onClick={() => openModal(m.id, 'movie')} />
            ))}
          </div>
        )}
      </div>

      <div style={{ marginBottom: 24, ...gridWrapperStyle }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Séries Populares</h2>
            <p style={{ color: '#94a3b8', marginTop: 6 }}>Explore as séries mais populares</p>
          </div>
        </div>

        {seriesHook.loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>Carregando...</div>
        ) : filteredSeries.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>Nenhum resultado encontrado</div>
        ) : (
          <div style={responsiveGridStyle}>
            {filteredSeries.map((s) => (
              <MovieCard key={`tv-${s.id}`} item={s} type="tv" onClick={() => openModal(s.id, 'tv')} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}