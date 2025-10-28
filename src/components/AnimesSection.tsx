import React, { useEffect, useState } from 'react';
import Link from 'next/link';

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
    <section style={{ marginTop: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Animes Populares</h2>
          <p style={{ color: '#94a3b8', marginTop: '0.375rem' }}>Explore alguns animes populares</p>
        </div>
        <div>
          <Link href="/animes" style={{ color: '#cbd5e1', textDecoration: 'underline' }}>
            Ver todos
          </Link>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '1.5rem', color: '#94a3b8' }}>Carregando animes...</div>
      ) : items.length === 0 ? (
        <div style={{ padding: '1.5rem', color: '#94a3b8' }}>Nenhum anime disponível</div>
      ) : (
        <div style={{ 
          display: isMobile ? 'flex' : 'grid', 
          gridTemplateColumns: isMobile ? 'none' : 'repeat(auto-fill, minmax(8.75rem, 1fr))', 
          overflowX: isMobile ? 'auto' : 'visible',
          gap: isMobile ? '0.75rem' : '0.75rem',
          paddingBottom: isMobile ? '0.5rem' : '0',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          justifyContent: 'center' 
        }}>
          {items.map((a) => (
            <div key={a.mal_id} style={{ 
              minWidth: isMobile ? '7.5rem' : 'auto',
              width: isMobile ? '7.5rem' : 'auto'
            }}>
              <Link href={`/animes`} style={{ background: '#0f1724', borderRadius: '0.5rem', overflow: 'hidden', textDecoration: 'none', color: 'inherit', display: 'block' }}>
                <div style={{ height: isMobile ? '10rem' : '12.5rem', background: '#061323', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {a.images?.jpg?.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.images.jpg.image_url} alt={a.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{ color: '#94a3b8' }}>Sem imagem</div>
                  )}
                </div>
                <div style={{ padding: '0.5rem' }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title}</div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}