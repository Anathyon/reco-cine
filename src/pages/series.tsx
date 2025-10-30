import React, { useEffect, useState, useCallback } from 'react';
import { Movie } from '../types';
import { fetchMovies } from '../api/tmdb';
import MovieCard from '../components/MovieCard';
import MovieModal from '../components/MovieModal';
import { useModalStore } from '../store/modalStore';

const GENRES = [
  { id: 0, name: 'Todos' },
  { id: 10759, name: 'Ação & Aventura' },
  { id: 18, name: 'Drama' },
  { id: 35, name: 'Comédia' },
  { id: 9648, name: 'Mistério' },
  { id: 10765, name: 'Fantasia & Ficção' },
];

function shuffle<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function SeriesPage() {
  const [allSeries, setAllSeries] = useState<Movie[]>([]);
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
    const loadSeries = async () => {
      try {
        setLoading(true);
        // Carregar múltiplas páginas para ter mais variedade
        const [page1, page2, page3] = await Promise.all([
          fetchMovies('tv:popular'),
          fetch(`https://api.themoviedb.org/3/tv/popular?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=pt-BR&page=2`).then(r => r.json()),
          fetch(`https://api.themoviedb.org/3/tv/top_rated?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=pt-BR&page=1`).then(r => r.json())
        ]);
        const allSeriesData = [...(page1.results || []), ...(page2.results || []), ...(page3.results || [])];
        setAllSeries(allSeriesData);
        setTrending(page1.results?.slice(0, 12) || []);
        setRecommendations(shuffle(allSeriesData.slice(12))); // Excluir os 12 primeiros das recomendações
      } catch {
        setError('Erro ao carregar séries');
      } finally {
        setLoading(false);
      }
    };
    loadSeries();
  }, []);

  const handleGenreChange = useCallback(async (genreId: number) => {
    setSelectedGenre(genreId);
    setLoading(true);
    
    try {
      if (genreId === 0) {
        // Sem filtro - tendências permanecem populares, recomendações são aleatórias
        const data = await fetchMovies('tv:popular');
        setTrending(data.results?.slice(0, 12) || []);
        setRecommendations(shuffle(allSeries.slice(12)));
      } else {
        // Com filtro - buscar séries do gênero específico
        const genreData = await fetch(`https://api.themoviedb.org/3/discover/tv?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=pt-BR&with_genres=${genreId}&page=1`).then(r => r.json());
        const genreSeries = genreData.results || [];
        setTrending(genreSeries.slice(0, 12));
        setRecommendations(shuffle(genreSeries.slice(12)));
      }
    } catch {
      setError('Erro ao filtrar séries');
    } finally {
      setLoading(false);
    }
  }, [allSeries]);

  const refreshRecommendations = useCallback(async () => {
    setLoading(true);
    
    try {
      if (selectedGenre === 0) {
        // Buscar página aleatória para mais variedade
        const randomPage = Math.floor(Math.random() * 5) + 1;
        const randomData = await fetch(`https://api.themoviedb.org/3/tv/popular?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=pt-BR&page=${randomPage}`).then(r => r.json());
        setRecommendations(shuffle(randomData.results || []));
      } else {
        // Buscar página aleatória do gênero específico
        const randomPage = Math.floor(Math.random() * 3) + 1;
        const genreData = await fetch(`https://api.themoviedb.org/3/discover/tv?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=pt-BR&with_genres=${selectedGenre}&page=${randomPage}`).then(r => r.json());
        setRecommendations(shuffle(genreData.results || []));
      }
    } catch {
      setError('Erro ao atualizar recomendações');
    } finally {
      setLoading(false);
    }
  }, [selectedGenre]);

  const handleSeriesClick = useCallback((seriesId: number) => {
    openModal(seriesId, 'tv');
  }, [openModal]);

  if (loading) return <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>Carregando...</div>;
  if (error) return <div style={{ padding: '48px', textAlign: 'center', color: 'salmon' }}>{error}</div>;

  return (
    <div style={{ maxWidth: '75rem', margin: '0 auto', padding: 'clamp(1rem, 3vw, 1.5rem)' }}>
      <MovieModal />
      
      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: '1rem',
        marginBottom: 'clamp(1rem, 3vw, 1.5rem)' 
      }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.375rem)', fontWeight: 700, margin: 0 }}>Séries</h1>
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
              padding: 'clamp(0.5rem, 2vw, 0.625rem)', 
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
              padding: 'clamp(0.5rem, 2vw, 0.75rem)', 
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

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: 'clamp(1.125rem, 4vw, 1.25rem)', fontWeight: 700, margin: '0 0 1rem 0' }}>Tendências</h2>
        <div style={{ 
          display: isMobile ? 'flex' : 'grid',
          gridTemplateColumns: isMobile ? 'none' : 'repeat(auto-fill, minmax(min(10rem, 100%), 1fr))',
          overflowX: isMobile ? 'auto' : 'visible',
          gap: isMobile ? '0.75rem' : 'clamp(0.75rem, 2vw, 1rem)',
          paddingBottom: isMobile ? '0.5rem' : '0',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          {trending.map(series => (
            <div key={series.id} style={{ 
              minWidth: isMobile ? '7.5rem' : 'auto',
              width: isMobile ? '7.5rem' : 'auto'
            }}>
              <MovieCard 
                item={series} 
                type="tv" 
                onClick={() => handleSeriesClick(series.id)} 
              />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 'clamp(1.125rem, 4vw, 1.25rem)', fontWeight: 700, margin: '0 0 1rem 0' }}>Recomendações</h2>
        <div style={{ 
          display: isMobile ? 'flex' : 'grid',
          gridTemplateColumns: isMobile ? 'none' : 'repeat(auto-fill, minmax(min(10rem, 100%), 1fr))',
          overflowX: isMobile ? 'auto' : 'visible',
          gap: isMobile ? '0.75rem' : 'clamp(0.75rem, 2vw, 1rem)',
          paddingBottom: isMobile ? '0.5rem' : '0',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          {recommendations.map(series => (
            <div key={series.id} style={{ 
              minWidth: isMobile ? '7.5rem' : 'auto',
              width: isMobile ? '7.5rem' : 'auto'
            }}>
              <MovieCard 
                item={series} 
                type="tv" 
                onClick={() => handleSeriesClick(series.id)} 
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}