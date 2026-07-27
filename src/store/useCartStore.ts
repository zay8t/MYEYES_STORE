import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface OpticalPrescription {
  lensUsage?: string;
  lensMaterial?: string;
  odSph?: number;
  odCyl?: number | null;
  odAxis?: number | null;
  osSph?: number;
  osCyl?: number | null;
  osAxis?: number | null;
  pd?: number;
  rxFileUrl?: string;
  notes?: string;
}

export interface CartItem {
  id: string; // unique cart item id
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  color?: string;
  prescription?: OpticalPrescription;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (item: Omit<CartItem, "id" | "quantity"> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  subtotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      addItem: (item) => {
        set((state) => {
          const newItemId = `${item.productId}-${item.prescription?.lensUsage || "frame-only"}-${Date.now()}`;
          const newItem: CartItem = {
            ...item,
            id: newItemId,
            quantity: item.quantity || 1,
          };
          return {
            items: [...state.items, newItem],
            isOpen: true, // Automatically slide open cart on add
          };
        });
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== id && i.productId !== id),
        }));
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id || i.productId === id ? { ...i, quantity } : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      subtotalPrice: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    {
      name: "my-eyes-cart-storage",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
