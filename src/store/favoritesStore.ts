import { create } from 'zustand';

interface FavoriteMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
}

interface FavoritesState {
  favorites: FavoriteMovie[];
  addFavorite: (movie: FavoriteMovie) => void;
  removeFavorite: (id: number) => void;
}

const useFavoritesStore = create<FavoritesState>((set) => ({
  favorites: [],
  addFavorite: (movie: FavoriteMovie) => set((state) => ({
    favorites: [...state.favorites, movie],
  })),
  removeFavorite: (id: number) => set((state) => ({
    favorites: state.favorites.filter((movie: FavoriteMovie) => movie.id !== id),
  })),
}));

export default useFavoritesStore;