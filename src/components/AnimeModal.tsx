import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import useFavoritesStore from '../store/favoritesStore';

interface AnimeDetails {
  mal_id: number;
  title: string;
  title_english?: string;
  synopsis?: string;
  images?: {
    jpg?: {
      image_url: string;
      large_image_url: string;
    };
  };
  score?: number;
  scored_by?: number;
  rank?: number;
  year?: number;
  status?: string;
  episodes?: number;
  duration?: string;
  rating?: string;
  genres?: { name: string }[];
  studios?: { name: string }[];
  aired?: {
    from?: string;
    to?: string;
  };
}

interface AnimeModalProps {
  isOpen: boolean;
  animeId: number | null;
  onClose: () => void;
}

export default function AnimeModal({ isOpen, animeId, onClose }: AnimeModalProps) {
  const [details, setDetails] = useState<AnimeDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const { addFavorite, removeFavorite, isFavorite } = useFavoritesStore();

  useEffect(() => {
    if (!isOpen || !animeId) return;
    
    const fetchAnimeDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`https://api.jikan.moe/v4/anime/${animeId}`);
        const data = await response.json();
        setDetails(data.data);
      } catch (error) {
        console.error('Erro ao buscar detalhes do anime:', error);
        setDetails(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAnimeDetails();
  }, [isOpen, animeId]);

  if (!isOpen) return null;

  const backdrop = details?.images?.jpg?.large_image_url || details?.images?.jpg?.image_url || '';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: '20px',
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 20, scale: 0.98 }}
          animate={{ y: 0, scale: 1 }}
          exit={{ y: 10, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 200 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '1100px',
            borderRadius: '8px',
            overflow: 'hidden',
            background: '#0b1220',
            color: '#e6eef8',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '80vh',
          }}
        >
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
              Carregando detalhes...
            </div>
          ) : details ? (
            <>
              <div style={{ position: 'relative', height: '320px', backgroundColor: '#000', flexShrink: 0 }}>
                {backdrop ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={backdrop}
                    alt={details.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: '#071226' }} />
                )}

                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(2,6,23,0.15) 0%, rgba(2,6,23,0.6) 60%, rgba(2,6,23,0.95) 100%)' }} />

                <div style={{ position: 'absolute', left: '24px', bottom: '24px', right: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div style={{ maxWidth: '70%' }}>
                    <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 800 }}>{details.title}</h2>
                    {details.title_english && details.title_english !== details.title && (
                      <p style={{ marginTop: '6px', color: '#cbd5e1' }}>{details.title_english}</p>
                    )}
                    <div style={{ marginTop: '8px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div style={{ background: 'rgba(255,255,255,0.06)', padding: '6px 8px', borderRadius: '6px', fontSize: '13px' }}>
                        {details.year || 'N/A'}
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.06)', padding: '6px 8px', borderRadius: '6px', fontSize: '13px' }}>
                        ⭐ {details.score || 'N/A'}
                      </div>
                      {details.rank && (
                        <div style={{ background: 'rgba(255,255,255,0.06)', padding: '6px 8px', borderRadius: '6px', fontSize: '13px' }}>
                          #{details.rank}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                      onClick={() => {
                        if (!details) return;
                        if (isFavorite(details.mal_id)) removeFavorite(details.mal_id);
                        else
                          addFavorite({
                            id: details.mal_id,
                            title: details.title,
                            overview: details.synopsis || '',
                            poster_path: details.images?.jpg?.image_url || '',
                            release_date: details.aired?.from || '',
                            vote_average: details.score || 0,
                            genre_ids: details.genres?.map((g, i) => i) || [],
                            type: 'anime',
                          });
                      }}
                      style={{
                        padding: '10px 14px',
                        background: isFavorite(details?.mal_id || 0) ? '#ef4444' : 'rgba(255,255,255,0.06)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 700,
                      }}
                    >
                      {isFavorite(details?.mal_id || 0) ? 'Remover' : '+ Favoritos'}
                    </button>
                    <button
                      onClick={onClose}
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.06)',
                        color: '#fff',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '20px', padding: '24px', overflow: 'hidden', flex: 1 }}>
                <div style={{ width: '220px', flexShrink: 0 }}>
                  {details.images?.jpg?.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={details.images.jpg.image_url} 
                      alt={details.title} 
                      style={{ width: '100%', borderRadius: '6px' }} 
                    />
                  ) : (
                    <div style={{ width: '100%', height: '320px', background: '#061323', borderRadius: '6px' }} />
                  )}
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                  <div style={{ color: '#94a3b8', marginBottom: '12px' }}>
                    {details.genres?.map(g => g.name).join(' • ')} • {details.episodes ? `${details.episodes} eps` : 'N/A'} • {details.duration || 'N/A'}
                  </div>

                  <p style={{ color: '#cbd5e1', lineHeight: 1.6 }}>
                    {details.synopsis || 'Sinopse não disponível.'}
                  </p>

                  <div style={{ marginTop: '16px', color: '#94a3b8' }}>
                    <div>Status: {details.status || 'N/A'}</div>
                    <div style={{ marginTop: '8px' }}>Classificação: {details.rating || 'N/A'}</div>
                    {details.studios && details.studios.length > 0 && (
                      <div style={{ marginTop: '8px' }}>
                        Estúdio: {details.studios.map(s => s.name).join(', ')}
                      </div>
                    )}
                    {details.aired?.from && (
                      <div style={{ marginTop: '8px' }}>
                        Exibição: {new Date(details.aired.from).getFullYear()}
                        {details.aired.to && details.aired.to !== details.aired.from && 
                          ` - ${new Date(details.aired.to).getFullYear()}`
                        }
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div style={{ padding: '48px', textAlign: 'center', color: 'salmon' }}>
              Erro ao carregar detalhes do anime
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}