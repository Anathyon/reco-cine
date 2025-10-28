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
                src={backdrop}
                alt={details?.title}
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
              onClick={onClose}
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
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                Carregando detalhes...
              </div>
            ) : details ? (
              <>
                <h1 style={{ 
                  fontSize: '1.75rem', 
                  fontWeight: 800, 
                  margin: '0 0 0.5rem 0',
                  lineHeight: 1.2,
                  color: '#e6eef8'
                }}>
                  {details.title}
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
                    {details.year || 'N/A'}
                  </span>
                  <span style={{ 
                    background: 'rgba(255,255,255,0.1)', 
                    color: '#e6eef8', 
                    padding: '0.125rem 0.375rem', 
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem'
                  }}>
                    {details.score ? `★ ${details.score}` : 'N/A'}
                  </span>
                  <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                    {details.episodes ? `${details.episodes} episódios` : 'N/A'}
                  </span>
                </div>

                <p style={{ 
                  color: '#94a3b8', 
                  fontSize: '0.875rem',
                  marginBottom: '1.5rem',
                  lineHeight: 1.4
                }}>
                  {details.synopsis?.slice(0, 120) + '...' || 'Sinopse não disponível'}
                </p>

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
                    width: '100%',
                    backgroundColor: isFavorite(details?.mal_id || 0) ? '#ef4444' : 'rgba(255,255,255,0.1)',
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
                  {isFavorite(details?.mal_id || 0) ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
                </button>

                <div style={{ marginBottom: '1.5rem' }}>
                  <p style={{ 
                    color: '#e6eef8', 
                    lineHeight: 1.5,
                    fontSize: '0.875rem',
                    marginBottom: '1rem'
                  }}>
                    {details.synopsis}
                  </p>

                  <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong style={{ color: '#e6eef8' }}>Gêneros: </strong>
                      {details.genres?.map(g => g.name).join(', ') || '—'}
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong style={{ color: '#e6eef8' }}>Avaliação: </strong>
                      {details.score ? `${details.score}/10` : '—'}
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong style={{ color: '#e6eef8' }}>Status: </strong>
                      {details.status || '—'}
                    </div>
                    {details.studios && details.studios.length > 0 && (
                      <div style={{ marginBottom: '0.5rem' }}>
                        <strong style={{ color: '#e6eef8' }}>Estúdio: </strong>
                        {details.studios.map(s => s.name).join(', ')}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-around',
                  paddingTop: '1rem',
                  borderTop: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <button style={{ background: 'none', border: 'none', color: '#94a3b8', padding: '0.5rem' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14"/>
                    </svg>
                  </button>
                  <button style={{ background: 'none', border: 'none', color: '#94a3b8', padding: '0.5rem' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M7 10v12l5-3 5 3V10M7 10l5 3 5-3M7 10l-2-2h14l-2 2"/>
                    </svg>
                  </button>
                  <button style={{ background: 'none', border: 'none', color: '#94a3b8', padding: '0.5rem' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M7 7h10v10M7 17L17 7"/>
                    </svg>
                  </button>
                  <button style={{ background: 'none', border: 'none', color: '#94a3b8', padding: '0.5rem' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                    </svg>
                  </button>
                </div>
              </>
            ) : (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'salmon' }}>
                Erro ao carregar detalhes do anime
              </div>
            )}
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
        onClick={onClose}
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
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
              Carregando detalhes...
            </div>
          ) : details ? (
            <>
              <div style={{ position: 'relative', height: '24rem', backgroundColor: '#000', flexShrink: 0 }}>
                {backdrop ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={backdrop}
                    alt={details.title}
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
                  onClick={onClose}
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
                      {details.title}
                    </h1>
                    {details.title_english && details.title_english !== details.title && (
                      <p style={{ 
                        marginTop: '0.5rem', 
                        color: '#cbd5e1', 
                        fontSize: '1.125rem',
                        textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                      }}>
                        {details.title_english}
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
                      {details.year || 'N/A'}
                    </div>
                    <div style={{ 
                      background: 'rgba(0,0,0,0.7)', 
                      padding: '0.5rem 0.75rem', 
                      borderRadius: '0.5rem', 
                      fontSize: '0.875rem',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                      ★ {details.score || 'N/A'}
                    </div>
                    {details.rank && (
                      <div style={{ 
                        background: 'rgba(0,0,0,0.7)', 
                        padding: '0.5rem 0.75rem', 
                        borderRadius: '0.5rem', 
                        fontSize: '0.875rem',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}>
                        #{details.rank}
                      </div>
                    )}
                    <div style={{ 
                      background: 'rgba(0,0,0,0.7)', 
                      padding: '0.5rem 0.75rem', 
                      borderRadius: '0.5rem', 
                      fontSize: '0.875rem',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                      {details.episodes ? `${details.episodes} eps` : 'N/A'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
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
                        padding: '0.875rem 1.25rem',
                        background: isFavorite(details?.mal_id || 0) ? 
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
                      {isFavorite(details?.mal_id || 0) ? 'Remover' : '+ Favoritos'}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                gap: '2rem', 
                padding: '2rem', 
                background: 'linear-gradient(145deg, #0b1220 0%, #071226 100%)',
                minHeight: '20rem',
                overflow: 'hidden',
                flex: 1
              }}>
                <div style={{ width: '16rem', flexShrink: 0, alignSelf: 'flex-start' }}>
                  {details.images?.jpg?.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={details.images.jpg.image_url} 
                      alt={details.title} 
                      style={{ 
                        width: '100%',
                        height: 'auto',
                        borderRadius: '0.75rem',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        display: 'block'
                      }} 
                    />
                  ) : (
                    <div style={{ 
                      width: '100%', 
                      height: '24rem', 
                      background: 'linear-gradient(135deg, #061323 0%, #0b1220 100%)', 
                      borderRadius: '0.75rem',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }} />
                  )}
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto', paddingRight: '0.5rem' }}>
                  <div>
                    <div style={{ 
                      color: '#94a3b8', 
                      marginBottom: '1rem',
                      fontSize: '0.875rem',
                      display: 'flex',
                      gap: '0.5rem',
                      flexWrap: 'wrap'
                    }}>
                      {(details.genres || []).map((g, index) => (
                        <span key={index} style={{
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
                      {details.synopsis || 'Sinopse não disponível.'}
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
                      <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Status</div>
                      <div style={{ color: '#e6eef8', fontWeight: 600 }}>{details.status || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Classificação</div>
                      <div style={{ color: '#e6eef8', fontWeight: 600 }}>{details.rating || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Avaliação</div>
                      <div style={{ color: '#e6eef8', fontWeight: 600 }}>
                        {details.score ? `${details.score}/10` : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Episódios</div>
                      <div style={{ color: '#e6eef8', fontWeight: 600 }}>
                        {details.episodes || 'N/A'}
                      </div>
                    </div>
                    {details.studios && details.studios.length > 0 && (
                      <div style={{ gridColumn: 'span 2' }}>
                        <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Estúdio</div>
                        <div style={{ color: '#e6eef8', fontWeight: 600 }}>
                          {details.studios.map(s => s.name).join(', ')}
                        </div>
                      </div>
                    )}
                    {details.aired?.from && (
                      <div>
                        <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Exibição</div>
                        <div style={{ color: '#e6eef8', fontWeight: 600 }}>
                          {new Date(details.aired.from).getFullYear()}
                          {details.aired.to && details.aired.to !== details.aired.from && 
                            ` - ${new Date(details.aired.to).getFullYear()}`
                          }
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'salmon' }}>
              Erro ao carregar detalhes do anime
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}