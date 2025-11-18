import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAnimeModalStore } from '../store/animeModalStore';

type Anime = {
  mal_id: number;
  title: string;
  images?: { jpg?: { image_url?: string } };
  aired?: { from?: string };
};

export default function AnimesSection() {
  const [items, setItems] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { openModal } = useAnimeModalStore();
  const base = process.env.NEXT_PUBLIC_JIKAN_BASE_URL || 'https://api.jikan.moe/v4';

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch(`${base}/top/anime?limit=8`)
      .then((r) => r.json())
      .then((d) => {
        if (!mounted) return;
        setItems(Array.isArray(d.data) ? d.data.slice(0, 8) : []);
      })
      .catch(() => {
        if (!mounted) return;
        setItems([]);
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [base]);

  return (
    <section style={{ marginBottom: '3rem' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1.5rem' 
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
            Animes Populares
          </h2>
          <p style={{ margin: '0.5rem 0 0 0', color: '#94a3b8' }}>
            Explore alguns animes populares
          </p>
        </div>
        <Link href="/animes" style={{ color: '#cbd5e1', textDecoration: 'underline' }}>
          Ver todos
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
          Carregando...
        </div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
          Nenhum anime disponível
        </div>
      ) : (
        <div style={{
          display: isMobile ? 'flex' : 'grid',
          gridTemplateColumns: isMobile ? 'none' : 'repeat(auto-fill, minmax(180px, 1fr))',
          overflowX: isMobile ? 'auto' : 'visible',
          gap: '1rem',
          paddingBottom: isMobile ? '0.5rem' : '0',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          {items.map((anime) => (
            <div
              key={anime.mal_id}
              onClick={() => openModal(anime.mal_id)}
              style={{
                minWidth: isMobile ? '180px' : 'auto',
                backgroundColor: '#1f2937',
                borderRadius: '0.5rem',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'transform 0.2s ease',
                border: '1px solid #374151',
              }}
              onMouseEnter={(e) => {
                if (!isMobile) e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                if (!isMobile) e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
                <div style={{
                  width: '100%',
                  height: '270px',
                  backgroundColor: '#111827',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {anime.images?.jpg?.image_url ? (
                    <img
                      src={anime.images.jpg.image_url}
                      alt={anime.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                      loading="lazy"
                    />
                  ) : (
                    <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                      Sem imagem
                    </div>
                  )}
                </div>
                
                <div style={{ padding: '1rem' }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#f9fafb',
                    lineHeight: '1.25',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {anime.title}
                  </h3>
                  
                  {anime.aired?.from && (
                    <p style={{
                      margin: '0.25rem 0 0 0',
                      fontSize: '0.75rem',
                      color: '#9ca3af',
                    }}>
                      {new Date(anime.aired.from).getFullYear()}
                    </p>
                  )}
                </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}