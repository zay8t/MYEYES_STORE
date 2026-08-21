import { create } from "zustand";

interface AccountDrawerStore {
  isOpen: boolean;
  openAccountDrawer: () => void;
  closeAccountDrawer: () => void;
  toggleAccountDrawer: () => void;
}

export const useAccountDrawerStore = create<AccountDrawerStore>((set) => ({
  isOpen: false,
  openAccountDrawer: () => set({ isOpen: true }),
  closeAccountDrawer: () => set({ isOpen: false }),
  toggleAccountDrawer: () => set((state) => ({ isOpen: !state.isOpen })),
}));
