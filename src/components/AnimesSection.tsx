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
  const base = process.env.NEXT_PUBLIC_JIKAN_BASE_URL || 'https://api.jikan.moe/v4';

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
    <section style={{ marginTop: 48 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Animes Populares</h2>
          <p style={{ color: '#94a3b8', marginTop: 6 }}>Explore alguns animes populares</p>
        </div>
        <div>
          <Link href="/animes" style={{ color: '#cbd5e1', textDecoration: 'underline' }}>
            Ver todos
          </Link>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 24, color: '#94a3b8' }}>Carregando animes...</div>
      ) : items.length === 0 ? (
        <div style={{ padding: 24, color: '#94a3b8' }}>Nenhum anime disponível</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, justifyContent: 'center' }}>
          {items.map((a) => (
            <Link key={a.mal_id} href={`/animes`} style={{ background: '#0f1724', borderRadius: 8, overflow: 'hidden', textDecoration: 'none', color: 'inherit', display: 'block' }}>
              <div style={{ height: 200, background: '#061323', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {a.images?.jpg?.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.images.jpg.image_url} alt={a.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                ) : (
                  <div style={{ color: '#94a3b8' }}>Sem imagem</div>
                )}
              </div>
              <div style={{ padding: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}