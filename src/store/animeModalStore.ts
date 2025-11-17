import { create } from 'zustand';

interface AnimeModalState {
  isOpen: boolean;
  selectedId: number | null;
  openModal: (id: number) => void;
  closeModal: () => void;
}

export const useAnimeModalStore = create<AnimeModalState>((set) => ({
  isOpen: false,
  selectedId: null,
  openModal: (id) => set({ isOpen: true, selectedId: id }),
  closeModal: () => set({ isOpen: false, selectedId: null }),
}));