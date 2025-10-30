import React, { useEffect, useState, useCallback } from 'react';
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const loadAnimes = async () => {
      try {
        setLoading(true);
        // Carregar múltiplas fontes para ter mais variedade
        const [topAnimes, seasonalAnimes, popularAnimes] = await Promise.all([
          fetch('https://api.jikan.moe/v4/top/anime?limit=25').then(r => r.json()),
          fetch('https://api.jikan.moe/v4/seasons/now?limit=25').then(r => r.json()),
          fetch('https://api.jikan.moe/v4/anime?order_by=popularity&limit=25').then(r => r.json())
        ]);
        const allAnimesData = [...(topAnimes.data || []), ...(seasonalAnimes.data || []), ...(popularAnimes.data || [])];
        // Remover duplicatas baseado no mal_id
        const uniqueAnimes = allAnimesData.filter((anime, index, self) => 
          index === self.findIndex(a => a.mal_id === anime.mal_id)
        );
        setAllAnimes(uniqueAnimes);
        setTrending(topAnimes.data?.slice(0, 12) || []);
        setRecommendations(shuffle(uniqueAnimes.slice(12))); // Excluir os 12 primeiros das recomendações
      } catch {
        setError('Erro ao carregar animes');
      } finally {
        setLoading(false);
      }
    };
    loadAnimes();
  }, []);

  const handleGenreChange = useCallback(async (genreId: number) => {
    setSelectedGenre(genreId);
    setLoading(true);
    
    try {
      if (genreId === 0) {
        // Sem filtro - tendências permanecem top animes, recomendações são aleatórias
        const topData = await fetch('https://api.jikan.moe/v4/top/anime?limit=25').then(r => r.json());
        setTrending(topData.data?.slice(0, 12) || []);
        setRecommendations(shuffle(allAnimes.slice(12)));
      } else {
        // Com filtro - buscar animes do gênero específico
        const genreData = await fetch(`https://api.jikan.moe/v4/anime?genres=${genreId}&limit=25`).then(r => r.json());
        const genreAnimes = genreData.data || [];
        setTrending(genreAnimes.slice(0, 12));
        setRecommendations(shuffle(genreAnimes.slice(12)));
      }
    } catch {
      setError('Erro ao filtrar animes');
    } finally {
      setLoading(false);
    }
  }, [allAnimes]);

  const refreshRecommendations = useCallback(async () => {
    setLoading(true);
    
    try {
      if (selectedGenre === 0) {
        // Buscar animes aleatórios de diferentes fontes
        const randomSources = [
          'https://api.jikan.moe/v4/anime?order_by=popularity&limit=25',
          'https://api.jikan.moe/v4/anime?order_by=score&limit=25',
          'https://api.jikan.moe/v4/anime?order_by=members&limit=25'
        ];
        const randomSource = randomSources[Math.floor(Math.random() * randomSources.length)];
        const randomData = await fetch(randomSource).then(r => r.json());
        setRecommendations(shuffle(randomData.data || []));
      } else {
        // Buscar animes aleatórios do gênero específico
        const genreData = await fetch(`https://api.jikan.moe/v4/anime?genres=${selectedGenre}&order_by=popularity&limit=25`).then(r => r.json());
        setRecommendations(shuffle(genreData.data || []));
      }
    } catch {
      setError('Erro ao atualizar recomendações');
    } finally {
      setLoading(false);
    }
  }, [selectedGenre]);

  const openAnimeModal = useCallback((animeId: number) => {
    setSelectedAnimeId(animeId);
    setIsModalOpen(true);
  }, []);

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Carregando...</div>;
  if (error) return <div style={{ padding: '3rem', textAlign: 'center', color: 'salmon' }}>{error}</div>;

  return (
    <div style={{ maxWidth: '75rem', margin: '0 auto', padding: '1rem' }}>
      <AnimeModal 
        isOpen={isModalOpen} 
        animeId={selectedAnimeId} 
        onClose={() => setIsModalOpen(false)} 
      />
      
      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: '1rem',
        marginBottom: '1.5rem' 
      }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, margin: 0 }}>Animes</h1>
          <p style={{ color: '#94a3b8', marginTop: '0.375rem' }}>Tendências e recomendações</p>
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
              fontSize: '0.875rem',
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
              fontSize: '0.875rem',
              whiteSpace: 'nowrap'
            }}
          >
            Aleatório
          </button>
        </div>
      </div>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1rem 0' }}>Tendências</h2>
        <div style={{ 
          display: isMobile ? 'flex' : 'grid',
          gridTemplateColumns: isMobile ? 'none' : 'repeat(auto-fill, minmax(10rem, 1fr))',
          overflowX: isMobile ? 'auto' : 'visible',
          gap: isMobile ? '0.75rem' : '1rem',
          paddingBottom: isMobile ? '0.5rem' : '0',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          {trending.map(anime => (
            <div key={anime.mal_id} style={{ 
              minWidth: isMobile ? '7.5rem' : 'auto',
              width: isMobile ? '7.5rem' : 'auto'
            }}>
              <div 
                style={{ background: '#0f1724', borderRadius: '0.5rem', overflow: 'hidden', cursor: 'pointer' }}
                onClick={() => openAnimeModal(anime.mal_id)}
              >
                <div style={{ height: isMobile ? '10rem' : '16.875rem', background: '#0b1220', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {anime.images?.jpg?.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={anime.images.jpg.image_url} 
                      alt={anime.title} 
                      loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    <div style={{ color: '#94a3b8' }}>Sem imagem</div>
                  )}
                </div>
                <div style={{ padding: '0.75rem' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#e6eef8', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {anime.title}
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.375rem' }}>
                    {anime.score ? `⭐ ${anime.score}` : 'Sem nota'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1rem 0' }}>Recomendações</h2>
        <div style={{ 
          display: isMobile ? 'flex' : 'grid',
          gridTemplateColumns: isMobile ? 'none' : 'repeat(auto-fill, minmax(10rem, 1fr))',
          overflowX: isMobile ? 'auto' : 'visible',
          gap: isMobile ? '0.75rem' : '1rem',
          paddingBottom: isMobile ? '0.5rem' : '0',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          {recommendations.map(anime => (
            <div key={anime.mal_id} style={{ 
              minWidth: isMobile ? '7.5rem' : 'auto',
              width: isMobile ? '7.5rem' : 'auto'
            }}>
              <div 
                style={{ background: '#0f1724', borderRadius: '0.5rem', overflow: 'hidden', cursor: 'pointer' }}
                onClick={() => openAnimeModal(anime.mal_id)}
              >
                <div style={{ height: isMobile ? '10rem' : '16.875rem', background: '#0b1220', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {anime.images?.jpg?.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={anime.images.jpg.image_url} 
                      alt={anime.title} 
                      loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    <div style={{ color: '#94a3b8' }}>Sem imagem</div>
                  )}
                </div>
                <div style={{ padding: '0.75rem' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#e6eef8', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {anime.title}
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.375rem' }}>
                    {anime.score ? `⭐ ${anime.score}` : 'Sem nota'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}