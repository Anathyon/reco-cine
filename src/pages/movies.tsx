import React, { useEffect, useState, useCallback } from 'react';
import { Movie } from '../types';
import { fetchMovies } from '../api/tmdb';
import MovieCard from '../components/MovieCard';
import MovieModal from '../components/MovieModal';
import { useModalStore } from '../store/modalStore';

const GENRES = [
  { id: 0, name: 'Todos' },
  { id: 28, name: 'Ação' },
  { id: 35, name: 'Comédia' },
  { id: 18, name: 'Drama' },
  { id: 27, name: 'Terror' },
  { id: 10759, name: 'Ação & Aventura' },
];

function shuffle<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function MoviesPage() {
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [trending, setTrending] = useState<Movie[]>([]);
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [selectedGenre, setSelectedGenre] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const { openModal } = useModalStore();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const loadMovies = async () => {
      try {
        setLoading(true);
        const data = await fetchMovies('popular');
        const movies = data.results || [];
        setAllMovies(movies);
        setTrending(movies.slice(0, 12));
        setRecommendations(shuffle(movies));
      } catch {
        setError('Erro ao carregar filmes');
      } finally {
        setLoading(false);
      }
    };
    loadMovies();
  }, []);

  const handleGenreChange = useCallback((genreId: number) => {
    setSelectedGenre(genreId);
    if (genreId === 0) {
      setRecommendations(shuffle(allMovies));
    } else {
      const filtered = allMovies.filter(movie => movie.genre_ids?.includes(genreId));
      setRecommendations(shuffle(filtered));
    }
  }, [allMovies]);

  const refreshRecommendations = useCallback(() => {
    if (selectedGenre === 0) {
      setRecommendations(shuffle(allMovies));
    } else {
      const filtered = allMovies.filter(movie => movie.genre_ids?.includes(selectedGenre));
      setRecommendations(shuffle(filtered));
    }
  }, [allMovies, selectedGenre]);

  const handleMovieClick = useCallback((movieId: number) => {
    openModal(movieId, 'movie');
  }, [openModal]);

  if (loading) return <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>Carregando...</div>;
  if (error) return <div style={{ padding: '48px', textAlign: 'center', color: 'salmon' }}>{error}</div>;

  return (
    <div style={{ maxWidth: '75rem', margin: '0 auto', padding: '1rem' }}>
      <MovieModal />
      
      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: '1rem',
        marginBottom: '1.5rem' 
      }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.375rem)', fontWeight: 700, margin: 0 }}>Filmes</h1>
          <p style={{ color: '#94a3b8', marginTop: '0.375rem', fontSize: 'clamp(0.875rem, 2.5vw, 1rem)' }}>Tendências e recomendações</p>
        </div>
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          alignItems: 'center',
          flexWrap: 'wrap',
          width: isMobile ? '100%' : 'auto'
        }}>
          <select 
            value={selectedGenre} 
            onChange={(e) => handleGenreChange(Number(e.target.value))}
            style={{ 
              padding: '0.5rem 0.625rem', 
              background: '#071226', 
              color: '#e6eef8', 
              borderRadius: '0.375rem', 
              border: '1px solid #122032',
              fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
              minWidth: '7rem',
              flex: isMobile ? '1' : 'none'
            }}
          >
            {GENRES.map(genre => (
              <option key={genre.id} value={genre.id}>{genre.name}</option>
            ))}
          </select>
          <button 
            onClick={refreshRecommendations}
            style={{ 
              padding: '0.5rem 0.75rem', 
              background: '#3b82f6', 
              color: 'white', 
              border: 'none', 
              borderRadius: '0.375rem', 
              cursor: 'pointer',
              fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
              whiteSpace: 'nowrap'
            }}
          >
            Aleatório
          </button>
        </div>
      </div>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: 'clamp(1rem, 3vw, 1.125rem)', fontWeight: 700, margin: '0 0 1rem 0' }}>Tendências</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(10rem, 100%), 1fr))', 
          gap: 'clamp(0.75rem, 2vw, 1rem)' 
        }}>
          {trending.map(movie => (
            <MovieCard 
              key={movie.id} 
              item={movie} 
              type="movie" 
              onClick={() => openModal(movie.id, 'movie')} 
            />
          ))}
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 'clamp(1rem, 3vw, 1.125rem)', fontWeight: 700, margin: '0 0 1rem 0' }}>Recomendações</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(10rem, 100%), 1fr))', 
          gap: 'clamp(0.75rem, 2vw, 1rem)' 
        }}>
          {recommendations.map(movie => (
            <MovieCard 
              key={movie.id} 
              item={movie} 
              type="movie" 
              onClick={() => openModal(movie.id, 'movie')} 
            />
          ))}
        </div>
      </section>
    </div>
  );
}