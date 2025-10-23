import React, { useEffect, useState } from 'react';
import AnimeModal from '../components/AnimeModal';

interface AnimeItem {
  mal_id: number;
  title: string;
  images?: {
    jpg?: {
      image_url: string;
    };
  };
  score?: number;
  year?: number;
  genres?: { name: string }[];
}

const GENRES = [
  { id: 0, name: 'Todos' },
  { id: 1, name: 'Ação' },
  { id: 2, name: 'Aventura' },
  { id: 4, name: 'Comédia' },
  { id: 8, name: 'Drama' },
  { id: 10, name: 'Fantasia' },
];

function shuffle<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function AnimesPage() {
  const [allAnimes, setAllAnimes] = useState<AnimeItem[]>([]);
  const [trending, setTrending] = useState<AnimeItem[]>([]);
  const [recommendations, setRecommendations] = useState<AnimeItem[]>([]);
  const [selectedGenre, setSelectedGenre] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnimeId, setSelectedAnimeId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const loadAnimes = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://api.jikan.moe/v4/top/anime?limit=25');
        const data = await response.json();
        const animes = data.data || [];
        setAllAnimes(animes);
        setTrending(animes.slice(0, 12));
        setRecommendations(shuffle(animes));
      } catch {
        setError('Erro ao carregar animes');
      } finally {
        setLoading(false);
      }
    };
    loadAnimes();
  }, []);

  const handleGenreChange = (genreId: number) => {
    setSelectedGenre(genreId);
    if (genreId === 0) {
      setRecommendations(shuffle(allAnimes));
    } else {
      const filtered = allAnimes.filter(anime => 
        anime.genres?.some(genre => genre.name.toLowerCase().includes(GENRES.find(g => g.id === genreId)?.name.toLowerCase() || ''))
      );
      setRecommendations(shuffle(filtered.length > 0 ? filtered : allAnimes));
    }
  };

  const refreshRecommendations = () => {
    if (selectedGenre === 0) {
      setRecommendations(shuffle(allAnimes));
    } else {
      const filtered = allAnimes.filter(anime => 
        anime.genres?.some(genre => genre.name.toLowerCase().includes(GENRES.find(g => g.id === selectedGenre)?.name.toLowerCase() || ''))
      );
      setRecommendations(shuffle(filtered.length > 0 ? filtered : allAnimes));
    }
  };

  const openAnimeModal = (animeId: number) => {
    setSelectedAnimeId(animeId);
    setIsModalOpen(true);
  };

  if (loading) return <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>Carregando...</div>;
  if (error) return <div style={{ padding: '48px', textAlign: 'center', color: 'salmon' }}>{error}</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <AnimeModal 
        isOpen={isModalOpen} 
        animeId={selectedAnimeId} 
        onClose={() => setIsModalOpen(false)} 
      />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>Animes</h1>
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
          {trending.map(anime => (
            <div 
              key={anime.mal_id}
              style={{ background: '#0f1724', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer' }}
              onClick={() => openAnimeModal(anime.mal_id)}
            >
              <div style={{ height: '270px', background: '#0b1220', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {anime.images?.jpg?.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={anime.images.jpg.image_url} 
                    alt={anime.title} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                ) : (
                  <div style={{ color: '#94a3b8' }}>Sem imagem</div>
                )}
              </div>
              <div style={{ padding: '12px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#e6eef8', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {anime.title}
                </h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
                  {anime.score ? `⭐ ${anime.score}` : 'Sem nota'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0' }}>Recomendações</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
          {recommendations.map(anime => (
            <div 
              key={anime.mal_id}
              style={{ background: '#0f1724', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer' }}
              onClick={() => openAnimeModal(anime.mal_id)}
            >
              <div style={{ height: '270px', background: '#0b1220', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {anime.images?.jpg?.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={anime.images.jpg.image_url} 
                    alt={anime.title} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                ) : (
                  <div style={{ color: '#94a3b8' }}>Sem imagem</div>
                )}
              </div>
              <div style={{ padding: '12px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#e6eef8', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {anime.title}
                </h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
                  {anime.score ? `⭐ ${anime.score}` : 'Sem nota'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}