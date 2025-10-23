// filepath: c:\Users\ANATHYON ERYSSON\Downloads\Reconmendações-cine\reco-cine\src\components\MovieModal.tsx
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useModalStore } from '../store/modalStore';
import { fetchMovieDetails, getImageUrl } from '../api/tmdb';
import useFavoritesStore from '../store/favoritesStore';

interface Genre { id: number; name: string; }
interface MovieDetails {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string;
  backdrop_path?: string;
  tagline?: string;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  genres?: Genre[];
  runtime?: number;
  episode_run_time?: number[];
  status?: string;
  credits?: { cast?: unknown[] };
}

export default function MovieModal() {
  const { isOpen, selectedId, type, closeModal } = useModalStore();
  const [details, setDetails] = useState<MovieDetails | null>(null);
  const addFavorite = useFavoritesStore((s: { addFavorite: (movie: { id: number; title: string; overview: string; poster_path: string; release_date: string; vote_average: number; genre_ids: number[] }) => void }) => s.addFavorite);
  const removeFavorite = useFavoritesStore((s: { removeFavorite: (id: number) => void }) => s.removeFavorite);
  const favorites = useFavoritesStore((s: { favorites: { id: number }[] }) => s.favorites);
  const isFav = (id?: number) => favorites.some((fav: { id: number }) => fav.id === id);

  useEffect(() => {
    if (!isOpen || !selectedId) return;
    let mounted = true;
    fetchMovieDetails(selectedId, type)
      .then((d) => {
        if (mounted) setDetails(d);
      })
      .catch(() => {
        if (mounted) setDetails(null);
      });
    return () => {
      mounted = false;
    };
  }, [isOpen, selectedId, type]);



  if (!isOpen) return null;

  const backdrop = details?.backdrop_path || details?.poster_path || '';

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
          padding: 20,
        }}
        onClick={closeModal}
      >
        <motion.div
          initial={{ y: 20, scale: 0.98 }}
          animate={{ y: 0, scale: 1 }}
          exit={{ y: 10, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 200 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: 1100,
            borderRadius: 8,
            overflow: 'hidden',
            background: '#0b1220',
            color: '#e6eef8',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '80vh',
          }}
        >
          {/* Backdrop hero */}
          <div style={{ position: 'relative', height: 320, backgroundColor: '#000', flexShrink: 0 }}>
            {backdrop ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getImageUrl(backdrop, 'w1280')}
                alt={details?.title || details?.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', background: '#071226' }} />
            )}

            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(2,6,23,0.15) 0%, rgba(2,6,23,0.6) 60%, rgba(2,6,23,0.95) 100%)' }} />

            {/* title + actions */}
            <div style={{ position: 'absolute', left: 24, bottom: 24, right: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div style={{ maxWidth: '70%' }}>
                <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>{details?.title || details?.name}</h2>
                <p style={{ marginTop: 6, color: '#cbd5e1' }}>{details?.tagline}</p>
                <div style={{ marginTop: 8, display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ background: 'rgba(255,255,255,0.06)', padding: '6px 8px', borderRadius: 6, fontSize: 13 }}>{(details?.release_date || details?.first_air_date || '').slice(0, 4)}</div>
                  <div style={{ background: 'rgba(255,255,255,0.06)', padding: '6px 8px', borderRadius: 6, fontSize: 13 }}>
                    Nota: {details?.vote_average ?? '—'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button
                  onClick={() => {
                    if (!details) return;
                    if (isFav(details.id)) removeFavorite(details.id);
                    else
                      addFavorite({
                        id: details.id,
                        title: details.title || details.name || '',
                        overview: details.overview || '',
                        poster_path: details.poster_path || details.backdrop_path || '',
                        release_date: details.release_date || details.first_air_date || '',
                        vote_average: details.vote_average || 0,
                        genre_ids: details.genres?.map(g => g.id) || [],
                      });
                  }}
                  style={{
                    padding: '10px 14px',
                    background: isFav(details?.id) ? '#ef4444' : 'rgba(255,255,255,0.06)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  {isFav(details?.id) ? 'Remover' : '+ Favoritos'}
                </button>

                <button
                  onClick={closeModal}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: '#fff',
                    padding: '8px 10px',
                    borderRadius: 8,
                    cursor: 'pointer',
                  }}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>

          {/* details area: scrollable when content exceeds modal height */}
          <div style={{ display: 'flex', gap: 20, padding: 24, overflow: 'hidden', flex: 1 }}>
            <div style={{ width: 220, flexShrink: 0 }}>
              {details?.poster_path ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={getImageUrl(details.poster_path, 'w500')} alt={details?.title || details?.name} style={{ width: '100%', borderRadius: 6 }} />
              ) : (
                <div style={{ width: '100%', height: 320, background: '#061323', borderRadius: 6 }} />
              )}
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div style={{ color: '#94a3b8', marginBottom: 12 }}>
                {(details?.genres || []).map((g) => g.name).join(' • ')} • {details?.runtime ?? details?.episode_run_time?.[0] ?? '—'} min
              </div>

              <p style={{ color: '#cbd5e1', lineHeight: 1.6 }}>{details?.overview}</p>

              <div style={{ marginTop: 16, color: '#94a3b8' }}>
                <div>Lançamento: {details?.release_date || details?.first_air_date || '—'}</div>
                <div style={{ marginTop: 8 }}>Status: {details?.status || '—'}</div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}