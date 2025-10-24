import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

interface FavoritesState {
  favorites: FavoriteItem[];
  addFavorite: (item: FavoriteItem) => void;
  removeFavorite: (id: number) => void;
  isFavorite: (id: number) => boolean;
}

const useFavoritesStore = create<FavoritesState>()(persist(
  (set, get) => ({
    favorites: [],
    addFavorite: (item: FavoriteItem) => set((state) => {
      const exists = state.favorites.some(fav => fav.id === item.id);
      if (exists) return state;
      return { favorites: [...state.favorites, item] };
    }),
    removeFavorite: (id: number) => set((state) => ({
      favorites: state.favorites.filter((item: FavoriteItem) => item.id !== id),
    })),
    isFavorite: (id: number) => get().favorites.some(fav => fav.id === id),
  }),
  {
    name: 'cine-favorites',
  }
));

export default useFavoritesStore;