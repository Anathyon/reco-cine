import React, { useState } from 'react';
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

  const filteredFavorites = filter === 'all' ? favorites : favorites.filter((item: FavoriteItem) => item.type === filter);

  const handleItemClick = (item: FavoriteItem) => {
    if (item.type === 'anime') {
      setSelectedAnimeId(item.id);
      setIsAnimeModalOpen(true);
    } else {
      openModal(item.id, item.type === 'tv' ? 'tv' : 'movie');
    }
  };

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
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <MovieModal />
      <AnimeModal 
        isOpen={isAnimeModalOpen} 
        animeId={selectedAnimeId} 
        onClose={() => setIsAnimeModalOpen(false)} 
      />
      
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Favoritos</h1>
        <p style={{ color: '#94a3b8', marginTop: 6 }}>Seus filmes, séries e animes favoritos</p>
        
        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          {[{key: 'all', label: 'Todos'}, {key: 'movie', label: 'Filmes'}, {key: 'tv', label: 'Séries'}, {key: 'anime', label: 'Animes'}].map(({key, label}) => (
            <button
              key={key}
              onClick={() => setFilter(key as 'all' | 'movie' | 'tv' | 'anime')}
              style={{
                padding: '6px 12px',
                background: filter === key ? '#3b82f6' : 'rgba(255,255,255,0.06)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px'
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
          {filteredFavorites.map(renderItem)}
        </div>
      )}
    </div>
  );
}