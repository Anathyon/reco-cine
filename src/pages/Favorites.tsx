import React from 'react';
import useFavoritesStore from '../store/favoritesStore';
import MovieCard from '../components/MovieCard';
import MovieModal from '../components/MovieModal';
import { useModalStore } from '../store/modalStore';

export default function FavoritesPage() {
  const favorites = useFavoritesStore((state) => state.favorites);
  const { openModal } = useModalStore();

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <MovieModal />
      
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Favoritos</h1>
        <p style={{ color: '#94a3b8', marginTop: 6 }}>Seus filmes e séries favoritos</p>
      </div>

      {favorites.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
          Nenhum favorito adicionado ainda
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
          {favorites.map((item) => (
            <MovieCard 
              key={item.id} 
              item={item} 
              type="movie" 
              onClick={() => openModal(item.id, 'movie')} 
            />
          ))}
        </div>
      )}
    </div>
  );
}