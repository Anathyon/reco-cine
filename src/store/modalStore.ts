// filepath: c:\Users\ANATHYON ERYSSON\Downloads\Reconmendações-cine\reco-cine\src\store\modalStore.ts
import { create } from 'zustand';

type ModalState = {
  isOpen: boolean;
  selectedId: number | null;
  type: 'movie' | 'tv';
  openModal: (id: number, type?: 'movie' | 'tv') => void;
  closeModal: () => void;
};

export const useModalStore = create<ModalState>((set: (partial: Partial<ModalState>) => void) => ({
  isOpen: false,
  selectedId: null,
  type: 'movie',
  openModal: (id: number, t: 'movie' | 'tv' = 'movie') => set({ isOpen: true, selectedId: id, type: t }),
  closeModal: () => set({ isOpen: false, selectedId: null }),
}));