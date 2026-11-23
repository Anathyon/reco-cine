import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { MediaItem } from '../types';
import { mediaKey } from '../lib/media';

export interface FavoriteItem extends MediaItem {
  addedAt: number;
}

interface FavoritesState {
  items: Record<string, FavoriteItem>;
  hydrated: boolean;
  toggle: (item: MediaItem) => boolean;
  remove: (item: Pick<MediaItem, 'type' | 'id'>) => void;
  /** Junta itens à lista (sem duplicar). Retorna quantos eram novos. */
  importItems: (items: MediaItem[]) => number;
  clear: () => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      items: {},
      hydrated: false,
      toggle: (item) => {
        const key = mediaKey(item);
        const items = { ...get().items };
        const added = !items[key];
        if (added) {
          const { id, type, title, poster, backdrop, year, rating, overview } = item;
          items[key] = { id, type, title, poster, backdrop, year, rating, overview, addedAt: Date.now() };
        } else {
          delete items[key];
        }
        set({ items });
        return added;
      },
      remove: (item) => {
        const items = { ...get().items };
        delete items[mediaKey(item)];
        set({ items });
      },
      importItems: (incoming) => {
        const items = { ...get().items };
        const now = Date.now();
        let added = 0;
        incoming.forEach((item, index) => {
          const key = mediaKey(item);
          if (items[key]) return;
          const { id, type, title, poster, backdrop, year, rating, overview } = item;
          // Mantém a ordem original: o primeiro item importado fica como o mais recente.
          items[key] = { id, type, title, poster, backdrop, year, rating, overview, addedAt: now - index };
          added++;
        });
        if (added) set({ items });
        return added;
      },
      clear: () => set({ items: {} }),
    }),
    {
      name: 'reco-cine:favorites',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      // Hidratado manualmente em _app para evitar divergência entre servidor e cliente.
      skipHydration: true,
      onRehydrateStorage: () => () => {
        useFavoritesStore.setState({ hydrated: true });
      },
    },
  ),
);

export function useIsFavorite(item: Pick<MediaItem, 'type' | 'id'> | null | undefined) {
  return useFavoritesStore((s) => Boolean(item && s.items[mediaKey(item)]));
}

export default useFavoritesStore;
