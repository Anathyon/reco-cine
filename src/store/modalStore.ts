import { create } from 'zustand';

interface ModalState {
  isOpen: boolean;
  selectedId: number | null;
  type: 'movie' | 'tv';
  openModal: (id: number, type: 'movie' | 'tv') => void;
  closeModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  isOpen: false,
  selectedId: null,
  type: 'movie',
  openModal: (id, type) => set({ isOpen: true, selectedId: id, type }),
  closeModal: () => set({ isOpen: false, selectedId: null }),
}));