import { create } from "zustand";

interface WishlistStore {
  isOpen: boolean;
  openWishlist: () => void;
  closeWishlist: () => void;
  toggleWishlist: () => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
}

export const useWishlistStore = create<WishlistStore>((set) => ({
  isOpen: false,
  openWishlist: () => set({ isOpen: true }),
  closeWishlist: () => set({ isOpen: false }),
  toggleWishlist: () => set((state) => ({ isOpen: !state.isOpen })),
  refreshTrigger: 0,
  triggerRefresh: () => set((state) => ({ refreshTrigger: state.refreshTrigger + 1 })),
}));
