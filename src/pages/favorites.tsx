import React, { useState, useCallback, useMemo, useEffect } from 'react';
import useFavoritesStore from '../store/favoritesStore';
import MovieCard from '../components/MovieCard';
import MovieModal from '../components/MovieModal';
import AnimeModal from '../components/AnimeModal';
import { useModalStore } from '../store/modalStore';

interface FavoriteItem {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
  type: 'movie' | 'tv' | 'anime';
}

const navItems = [
  { href: '/', label: 'Início' },
  { href: '/movies', label: 'Filmes' },
  { href: '/series', label: 'Séries' },
  { href: '/animes', label: 'Animes' },
  { href: '/search', label: 'Buscar' },
  { href: '/favorites', label: 'Favoritos' },
];

export default function FavoritesPage() {
  const { favorites } = useFavoritesStore();
  const { openModal } = useModalStore();
  const [selectedAnimeId, setSelectedAnimeId] = useState<number | null>(null);
  const [isAnimeModalOpen, setIsAnimeModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'movie' | 'tv' | 'anime'>('all');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const filteredFavorites = useMemo(() => 
    filter === 'all' ? favorites : favorites.filter((item: FavoriteItem) => item.type === filter),
    [favorites, filter]
  );

  const handleItemClick = useCallback((item: FavoriteItem) => {
    if (item.type === 'anime') {
      setSelectedAnimeId(item.id);
      setIsAnimeModalOpen(true);
    } else {
      openModal(item.id, item.type === 'tv' ? 'tv' : 'movie');
    }
  }, [openModal]);

  const renderItem = (item: FavoriteItem) => {
    if (item.type === 'anime') {
      return (
        <div 
          key={item.id}
          style={{ background: '#0f1724', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer' }}
          onClick={() => handleItemClick(item)}
        >
          <div style={{ height: '270px', background: '#0b1220', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {item.poster_path ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={item.poster_path} 
                alt={item.title} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            ) : (
              <div style={{ color: '#94a3b8' }}>Sem imagem</div>
            )}
          </div>
          <div style={{ padding: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#e6eef8', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {item.title}
            </h3>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
              {item.vote_average ? `⭐ ${item.vote_average}` : 'Sem nota'} • Anime
            </p>
          </div>
        </div>
      );
    }
    
    return (
      <MovieCard 
        key={item.id} 
        item={item} 
        type={item.type === 'tv' ? 'tv' : 'movie'} 
        onClick={() => handleItemClick(item)} 
      />
    );
  };

  return (
    <div style={{ maxWidth: '75rem', margin: '0 auto', padding: 'clamp(1rem, 3vw, 1.5rem)' }}>
      <MovieModal />
      <AnimeModal 
        isOpen={isAnimeModalOpen} 
        animeId={selectedAnimeId} 
        onClose={() => setIsAnimeModalOpen(false)} 
      />
      
      <div style={{ marginBottom: 'clamp(1rem, 3vw, 1.5rem)' }}>
        <h1 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.375rem)', fontWeight: 700, margin: 0 }}>Favoritos</h1>
        <p style={{ color: '#94a3b8', marginTop: '0.375rem', fontSize: 'clamp(0.875rem, 2.5vw, 1rem)' }}>Seus filmes, séries e animes favoritos</p>
        
        <div style={{ marginTop: 'clamp(0.75rem, 2vw, 1rem)', display: 'flex', gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', flexWrap: 'wrap' }}>
          {[{key: 'all', label: 'Todos'}, {key: 'movie', label: 'Filmes'}, {key: 'tv', label: 'Séries'}, {key: 'anime', label: 'Animes'}].map(({key, label}) => (
            <button
              key={key}
              onClick={() => setFilter(key as 'all' | 'movie' | 'tv' | 'anime')}
              style={{
                padding: 'clamp(0.375rem, 1.5vw, 0.5rem) clamp(0.5rem, 2vw, 0.75rem)',
                background: filter === key ? '#3b82f6' : 'rgba(255,255,255,0.06)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                whiteSpace: 'nowrap'
              }}
            >
              {label} ({key === 'all' ? favorites.length : favorites.filter((item: FavoriteItem) => item.type === key).length})
            </button>
          ))}
        </div>
      </div>

      {filteredFavorites.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
          {filter === 'all' ? 'Nenhum favorito adicionado ainda' : `Nenhum ${filter === 'movie' ? 'filme' : filter === 'tv' ? 'série' : 'anime'} favorito`}
        </div>
      ) : (
        <div style={{ 
          display: isMobile ? 'flex' : 'grid',
          gridTemplateColumns: isMobile ? 'none' : 'repeat(auto-fill, minmax(min(10rem, 100%), 1fr))',
          overflowX: isMobile ? 'auto' : 'visible',
          gap: isMobile ? '0.75rem' : 'clamp(0.75rem, 2vw, 1rem)',
          paddingBottom: isMobile ? '0.5rem' : '0',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          {filteredFavorites.map((item) => (
            <div key={item.id} style={{ 
              minWidth: isMobile ? '7.5rem' : 'auto',
              width: isMobile ? '7.5rem' : 'auto'
            }}>
              {renderItem(item)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}