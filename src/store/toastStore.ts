import { create } from 'zustand';

export interface Toast {
  id: number;
  message: string;
  action?: { label: string; onClick: () => void };
}

interface ToastState {
  toasts: Toast[];
  show: (message: string, action?: Toast['action']) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  show: (message, action) => {
    const id = nextId++;
    set({ toasts: [...get().toasts.slice(-2), { id, message, action }] });
    setTimeout(() => get().dismiss(id), 3500);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

export const toast = (message: string, action?: Toast['action']) => useToastStore.getState().show(message, action);
