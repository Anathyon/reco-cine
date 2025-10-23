import React, { useEffect, useState } from 'react';
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
  const { openModal } = useModalStore();

  useEffect(() => {
    const loadSeries = async () => {
      try {
        setLoading(true);
        const data = await fetchMovies('tv:popular');
        const series = data.results || [];
        setAllSeries(series);
        setTrending(series.slice(0, 12));
        setRecommendations(shuffle(series));
      } catch {
        setError('Erro ao carregar séries');
      } finally {
        setLoading(false);
      }
    };
    loadSeries();
  }, []);

  const handleGenreChange = (genreId: number) => {
    setSelectedGenre(genreId);
    if (genreId === 0) {
      setRecommendations(shuffle(allSeries));
    } else {
      const filtered = allSeries.filter(series => series.genre_ids?.includes(genreId));
      setRecommendations(shuffle(filtered));
    }
  };

  const refreshRecommendations = () => {
    if (selectedGenre === 0) {
      setRecommendations(shuffle(allSeries));
    } else {
      const filtered = allSeries.filter(series => series.genre_ids?.includes(selectedGenre));
      setRecommendations(shuffle(filtered));
    }
  };

  if (loading) return <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>Carregando...</div>;
  if (error) return <div style={{ padding: '48px', textAlign: 'center', color: 'salmon' }}>{error}</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <MovieModal />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>Séries</h1>
          <p style={{ color: '#94a3b8', marginTop: '6px' }}>Tendências e recomendações</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select 
            value={selectedGenre} 
            onChange={(e) => handleGenreChange(Number(e.target.value))}
            style={{ padding: '8px 10px', background: '#071226', color: '#e6eef8', borderRadius: '6px', border: '1px solid #122032' }}
          >
            {GENRES.map(genre => (
              <option key={genre.id} value={genre.id}>{genre.name}</option>
            ))}
          </select>
          <button 
            onClick={refreshRecommendations}
            style={{ padding: '8px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            Aleatório
          </button>
        </div>
      </div>

      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0' }}>Tendências</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
          {trending.map(series => (
            <MovieCard 
              key={series.id} 
              item={series} 
              type="tv" 
              onClick={() => openModal(series.id, 'tv')} 
            />
          ))}
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0' }}>Recomendações</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
          {recommendations.map(series => (
            <MovieCard 
              key={series.id} 
              item={series} 
              type="tv" 
              onClick={() => openModal(series.id, 'tv')} 
            />
          ))}
        </div>
      </section>
    </div>
  );
}