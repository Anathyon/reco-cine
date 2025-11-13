import { create } from 'zustand';

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

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: [],
  addFavorite: (item) => {
    const { favorites } = get();
    if (!favorites.some(fav => fav.id === item.id)) {
      set({ favorites: [...favorites, item] });
    }
  },
  removeFavorite: (id) => {
    const { favorites } = get();
    set({ favorites: favorites.filter(fav => fav.id !== id) });
  },
  isFavorite: (id) => {
    const { favorites } = get();
    return favorites.some(fav => fav.id === id);
  },
}));

export default useFavoritesStore;