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
  const [isMobile, setIsMobile] = useState(false);
  const { addFavorite, removeFavorite, isFavorite } = useFavoritesStore();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

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

  if (isMobile) {
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
            backgroundColor: '#071226',
            overflowY: 'auto'
          }}
        >
          <div style={{ position: 'relative', height: '50vh', backgroundColor: '#0b1220' }}>
            {backdrop ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getImageUrl(backdrop, 'w1280')}
                alt={details?.title || details?.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', background: '#0b1220' }} />
            )}
            
            <div style={{ 
              position: 'absolute', 
              inset: 0, 
              background: 'linear-gradient(180deg, rgba(7,18,38,0.4) 0%, rgba(7,18,38,0.9) 100%)' 
            }} />
            
            <button
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: '1rem',
                left: '1rem',
                background: 'rgba(7,18,38,0.8)',
                border: 'none',
                color: '#e6eef8',
                padding: '0.75rem',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
          </div>

          <div style={{ 
            position: 'relative',
            backgroundColor: '#071226',
            color: '#e6eef8',
            padding: '1.5rem 1rem',
            marginTop: '-2rem',
            borderRadius: '1rem 1rem 0 0'
          }}>
            <h1 style={{ 
              fontSize: '1.75rem', 
              fontWeight: 800, 
              margin: '0 0 0.5rem 0',
              lineHeight: 1.2,
              color: '#e6eef8'
            }}>
              {details?.title || details?.name}
            </h1>

            <div style={{ 
              display: 'flex', 
              gap: '0.75rem', 
              alignItems: 'center',
              marginBottom: '1rem',
              flexWrap: 'wrap'
            }}>
              <span style={{ 
                background: '#3b82f6', 
                color: 'white', 
                padding: '0.25rem 0.5rem', 
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                fontWeight: 700
              }}>
                CINEEXPLORER
              </span>
              <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                {(details?.release_date || details?.first_air_date || '').slice(0, 4)}
              </span>
              <span style={{ 
                background: 'rgba(255,255,255,0.1)', 
                color: '#e6eef8', 
                padding: '0.125rem 0.375rem', 
                borderRadius: '0.25rem',
                fontSize: '0.75rem'
              }}>
                {details?.vote_average ? `★ ${details.vote_average.toFixed(1)}` : 'N/A'}
              </span>
              <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                {details?.runtime || details?.episode_run_time?.[0] || '—'} min
              </span>
            </div>

            <p style={{ 
              color: '#94a3b8', 
              fontSize: '0.875rem',
              marginBottom: '1.5rem',
              lineHeight: 1.4
            }}>
              {details?.tagline || details?.overview?.slice(0, 120) + '...' || 'Descrição não disponível'}
            </p>

            <button
              onClick={() => {
                if (!details) return;
                if (isFavorite(details.id)) removeFavorite(details.id);
                else
                  addFavorite({
                    id: details.id,
                    title: details.title || details.name || '',
                    overview: details.overview || '',
                    poster_path: details.poster_path || details.backdrop_path || '',
                    release_date: details.release_date || details.first_air_date || '',
                    vote_average: details.vote_average || 0,
                    genre_ids: details.genres?.map(g => g.id) || [],
                    type: type as 'movie' | 'tv',
                  });
              }}
              style={{
                width: '100%',
                backgroundColor: isFavorite(details?.id || 0) ? '#ef4444' : 'rgba(255,255,255,0.1)',
                color: '#e6eef8',
                border: 'none',
                padding: '1rem',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: 600,
                marginBottom: '1.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/>
              </svg>
              {isFavorite(details?.id || 0) ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
            </button>

            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ 
                color: '#e6eef8', 
                lineHeight: 1.5,
                fontSize: '0.875rem',
                marginBottom: '1rem'
              }}>
                {details?.overview}
              </p>

              <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong style={{ color: '#e6eef8' }}>Gêneros: </strong>
                  {(details?.genres || []).map(g => g.name).join(', ') || '—'}
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong style={{ color: '#e6eef8' }}>Avaliação: </strong>
                  {details?.vote_average ? `${details.vote_average.toFixed(1)}/10` : '—'}
                </div>
                <div>
                  <strong style={{ color: '#e6eef8' }}>Status: </strong>
                  {details?.status || '—'}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

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
          backgroundColor: 'rgba(0,0,0,0.85)',
          padding: '1rem',
        }}
        onClick={closeModal}
      >
        <motion.div
          initial={{ y: 30, scale: 0.95, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          exit={{ y: 20, scale: 0.98, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '75rem',
            borderRadius: '0.75rem',
            overflow: 'hidden',
            background: 'linear-gradient(145deg, #0b1220 0%, #071226 100%)',
            color: '#e6eef8',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
            border: '1px solid rgba(59, 130, 246, 0.1)',
            maxHeight: '95vh',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ position: 'relative', height: '20rem', backgroundColor: '#000', flexShrink: 0 }}>
            {backdrop ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getImageUrl(backdrop, 'w1280')}
                alt={details?.title || details?.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #071226 0%, #0b1220 100%)' }} />
            )}

            <div style={{ 
              position: 'absolute', 
              inset: 0, 
              background: 'linear-gradient(180deg, rgba(7,18,38,0.2) 0%, rgba(7,18,38,0.7) 70%, rgba(7,18,38,0.95) 100%)' 
            }} />

            <button
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                background: 'rgba(0,0,0,0.6)',
                border: 'none',
                color: '#e6eef8',
                padding: '0.75rem',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0,0,0,0.8)';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0,0,0,0.6)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>

            <div style={{ position: 'absolute', left: '2rem', bottom: '2rem', right: '2rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <h1 style={{ 
                  margin: 0, 
                  fontSize: '2.5rem', 
                  fontWeight: 900, 
                  lineHeight: 1.1,
                  textShadow: '0 4px 8px rgba(0,0,0,0.8)'
                }}>
                  {details?.title || details?.name}
                </h1>
                {details?.tagline && (
                  <p style={{ 
                    marginTop: '0.5rem', 
                    color: '#cbd5e1', 
                    fontSize: '1.125rem',
                    textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                  }}>
                    {details.tagline}
                  </p>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ 
                  background: 'rgba(59, 130, 246, 0.9)', 
                  color: 'white',
                  padding: '0.5rem 0.75rem', 
                  borderRadius: '0.5rem', 
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  backdropFilter: 'blur(10px)'
                }}>
                  {(details?.release_date || details?.first_air_date || '').slice(0, 4)}
                </div>
                <div style={{ 
                  background: 'rgba(0,0,0,0.7)', 
                  padding: '0.5rem 0.75rem', 
                  borderRadius: '0.5rem', 
                  fontSize: '0.875rem',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  ★ {details?.vote_average?.toFixed(1) ?? '—'}
                </div>
                <div style={{ 
                  background: 'rgba(0,0,0,0.7)', 
                  padding: '0.5rem 0.75rem', 
                  borderRadius: '0.5rem', 
                  fontSize: '0.875rem',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  {details?.runtime ?? details?.episode_run_time?.[0] ?? '—'} min
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <button
                  onClick={() => {
                    if (!details) return;
                    if (isFavorite(details.id)) removeFavorite(details.id);
                    else
                      addFavorite({
                        id: details.id,
                        title: details.title || details.name || '',
                        overview: details.overview || '',
                        poster_path: details.poster_path || details.backdrop_path || '',
                        release_date: details.release_date || details.first_air_date || '',
                        vote_average: details.vote_average || 0,
                        genre_ids: details.genres?.map(g => g.id) || [],
                        type: type as 'movie' | 'tv',
                      });
                  }}
                  style={{
                    padding: '0.875rem 1.25rem',
                    background: isFavorite(details?.id || 0) ? 
                      'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 
                      'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/>
                  </svg>
                  {isFavorite(details?.id || 0) ? 'Remover' : '+ Favoritos'}
                </button>
              </div>
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '2rem', 
            padding: '2rem', 
            background: 'linear-gradient(145deg, #0b1220 0%, #071226 100%)',
            overflowY: 'auto',
            flex: 1
          }}>
            <div style={{ width: '16rem', flexShrink: 0 }}>
              {details?.poster_path ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={getImageUrl(details.poster_path, 'w500')} 
                  alt={details?.title || details?.name} 
                  style={{ 
                    width: '100%',
                    height: '22rem',
                    objectFit: 'cover',
                    borderRadius: '0.75rem',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'block'
                  }} 
                />
              ) : (
                <div style={{ 
                  width: '100%', 
                  height: '22rem', 
                  background: 'linear-gradient(135deg, #061323 0%, #0b1220 100%)', 
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(255,255,255,0.1)'
                }} />
              )}
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <div style={{ 
                  color: '#94a3b8', 
                  marginBottom: '1rem',
                  fontSize: '0.875rem',
                  display: 'flex',
                  gap: '0.5rem',
                  flexWrap: 'wrap'
                }}>
                  {(details?.genres || []).map((g) => (
                    <span key={g.id} style={{
                      background: 'rgba(59, 130, 246, 0.1)',
                      color: '#3b82f6',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      border: '1px solid rgba(59, 130, 246, 0.2)'
                    }}>
                      {g.name}
                    </span>
                  ))}
                </div>

                <p style={{ 
                  color: '#e6eef8', 
                  lineHeight: 1.7,
                  fontSize: '1rem',
                  margin: 0
                }}>
                  {details?.overview}
                </p>
              </div>

              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                padding: '1.5rem',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '0.75rem',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Lançamento</div>
                  <div style={{ color: '#e6eef8', fontWeight: 600 }}>{details?.release_date || details?.first_air_date || '—'}</div>
                </div>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Status</div>
                  <div style={{ color: '#e6eef8', fontWeight: 600 }}>{details?.status || '—'}</div>
                </div>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Avaliação</div>
                  <div style={{ color: '#e6eef8', fontWeight: 600 }}>
                    {details?.vote_average ? `${details.vote_average.toFixed(1)}/10` : '—'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Duração</div>
                  <div style={{ color: '#e6eef8', fontWeight: 600 }}>
                    {details?.runtime ?? details?.episode_run_time?.[0] ?? '—'} min
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}