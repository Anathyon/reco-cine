import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import MovieCard from '../components/MovieCard';
import { useModalStore } from '../store/modalStore';

type ResultItem = {
  id: number;
  title: string;
  image?: string;
  poster_path?: string | null;
  type: 'movie' | 'tv' | 'anime';
  vote_average?: number;
  overview?: string;
};

export default function SearchPage(): React.JSX.Element {
  const [query, setQuery] = useState<string>('');
  const [type, setType] = useState<'movie' | 'tv' | 'anime'>('movie');
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [animeModalOpen, setAnimeModalOpen] = useState(false);
  const [selectedAnime, setSelectedAnime] = useState<ResultItem | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // <-- get function reference directly to avoid selector object identity changes
  const openModal = useModalStore((s) => s.openModal);

  async function handleSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      if (type === 'anime') {
        const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=30`);
        const json = await res.json();
        const items: ResultItem[] = (json.data || []).map((a: any) => ({
          id: a.mal_id,
          title: a.title,
          image: a.images?.jpg?.image_url,
          type: 'anime',
          overview: a.synopsis ?? '',
        }));
        setResults(items);
      } else {
        if (!TMDB_KEY) throw new Error('TMDB API key not configured (NEXT_PUBLIC_TMDB_API_KEY).');
        const res = await fetch(`https://api.themoviedb.org/3/search/${type}?api_key=${TMDB_KEY}&language=pt-BR&query=${encodeURIComponent(query)}&page=1`);
        const json = await res.json();
        const items: ResultItem[] = (json.results || []).map((r: any) => ({
          id: r.id,
          title: r.title ?? r.name ?? '',
          poster_path: r.poster_path ?? null,
          image: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : undefined,
          type: type,
          vote_average: r.vote_average,
          overview: r.overview ?? '',
        }));
        setResults(items);
      }
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function handleCardClick(item: ResultItem) {
    if (item.type === 'anime') {
      setSelectedAnime(item);
      setAnimeModalOpen(true);
    } else {
      openModal(item.id, item.type === 'tv' ? 'tv' : 'movie');
    }
  }

  return (
    <>
      <Head>
        <title>Buscar — CineExplorer</title>
      </Head>

      <div style={{ maxWidth: '75rem', marginLeft: 'auto', marginRight: 'auto', padding: 'clamp(1rem, 3vw, 1.5rem)' }}>
        <header style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(0.5rem, 2vw, 0.75rem)', marginBottom: 'clamp(1rem, 3vw, 1.5rem)' }}>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.25rem, 4vw, 1.375rem)', fontWeight: 700 }}>Buscar</h1>

          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar filmes, séries ou animes..."
              style={{ 
                flex: '1 1 16rem', 
                minWidth: '12rem', 
                padding: 'clamp(0.5rem, 2vw, 0.75rem)', 
                borderRadius: '0.375rem', 
                border: '1px solid rgba(255,255,255,0.06)', 
                background: '#071226', 
                color: '#e6eef8',
                fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
              }}
            />

            <select 
              value={type} 
              onChange={(e) => setType(e.target.value as any)} 
              style={{ 
                padding: 'clamp(0.5rem, 2vw, 0.6rem)', 
                borderRadius: '0.375rem', 
                background: '#071226', 
                color: '#e6eef8', 
                border: '1px solid rgba(255,255,255,0.06)',
                fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                minWidth: '5rem'
              }}
            >
              <option value="movie">Filmes</option>
              <option value="tv">Séries</option>
              <option value="anime">Animes</option>
            </select>

            <button 
              type="submit" 
              style={{ 
                padding: 'clamp(0.5rem, 2vw, 0.6rem) clamp(0.75rem, 3vw, 0.9rem)', 
                borderRadius: '0.375rem', 
                cursor: 'pointer',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                whiteSpace: 'nowrap'
              }}
            >
              Buscar
            </button>
          </form>
        </header>

        {loading ? (
          <div style={{ padding: '1.5rem', color: '#94a3b8' }}>Buscando...</div>
        ) : (
          <section>
            {results.length === 0 ? (
              <div style={{ padding: '1.5rem', color: '#94a3b8' }}>Nenhum resultado</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(10rem, 100%), 1fr))', gap: 'clamp(0.75rem, 2vw, 1rem)' }}>
                {results.map((r) =>
                  r.type === 'anime' ? (
                    <div
                      key={`anime-${r.id}`}
                      onClick={() => handleCardClick(r)}
                      style={{ 
                        background: '#0f1724', 
                        borderRadius: '0.5rem', 
                        overflow: 'hidden', 
                        cursor: 'pointer',
                        width: '100%',
                        maxWidth: '11.25rem',
                        minWidth: '8rem'
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={r.image ?? ''} 
                        alt={r.title} 
                        style={{ 
                          width: '100%', 
                          height: 'clamp(12rem, 20vw, 14rem)', 
                          objectFit: 'cover' 
                        }} 
                      />
                      <div style={{ padding: 'clamp(0.5rem, 2vw, 0.75rem)' }}>
                        <h3 style={{ 
                          margin: 0, 
                          fontSize: 'clamp(0.75rem, 2.5vw, 0.9375rem)', 
                          color: '#e6eef8',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {r.title}
                        </h3>
                      </div>
                    </div>
                  ) : (
                    // passe onClick direto para MovieCard (evita wrappers que possam disparar lógica)
                    <MovieCard
                      key={`${r.type}-${r.id}`}
                      item={{ id: r.id, title: r.title, poster_path: r.poster_path } as any}
                      type={r.type === 'tv' ? 'tv' : 'movie'}
                      onClick={() => handleCardClick(r)}
                    />
                  )
                )}
              </div>
            )}
          </section>
        )}
      </div>

      {animeModalOpen && selectedAnime && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)',
            zIndex: 2000
          }}
          onClick={() => setAnimeModalOpen(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              width: 'min(95%, 48rem)', 
              background: '#071226', 
              borderRadius: '0.5rem', 
              overflow: 'hidden',
              margin: 'clamp(1rem, 3vw, 2rem)'
            }}
          >
            <div style={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row',
              gap: 'clamp(0.75rem, 3vw, 1rem)', 
              padding: 'clamp(1rem, 3vw, 1.5rem)' 
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={selectedAnime.image ?? ''} 
                alt={selectedAnime.title} 
                style={{ 
                  width: isMobile ? '100%' : 'clamp(8rem, 15vw, 10rem)', 
                  height: isMobile ? 'auto' : 'clamp(11rem, 20vw, 14rem)', 
                  maxHeight: isMobile ? '20rem' : 'none',
                  objectFit: 'cover', 
                  borderRadius: '0.375rem',
                  alignSelf: isMobile ? 'center' : 'flex-start'
                }} 
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{ 
                  margin: 0, 
                  color: '#e6eef8',
                  fontSize: 'clamp(1.125rem, 4vw, 1.5rem)',
                  lineHeight: 1.2,
                  marginBottom: 'clamp(0.5rem, 2vw, 1rem)'
                }}>
                  {selectedAnime.title}
                </h2>
                <p style={{ 
                  color: '#94a3b8',
                  fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                  lineHeight: 1.5,
                  margin: 0,
                  marginBottom: 'clamp(1rem, 3vw, 1.5rem)'
                }}>
                  {selectedAnime.overview}
                </p>
                <div>
                  <button 
                    onClick={() => setAnimeModalOpen(false)} 
                    style={{ 
                      padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(0.75rem, 3vw, 1rem)', 
                      borderRadius: '0.375rem', 
                      cursor: 'pointer',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
                    }}
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}