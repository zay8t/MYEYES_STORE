import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface EyePrescriptionValues {
  sph?: string | number;
  cyl?: string | number | null;
  axis?: string | number | null;
}

export interface OpticalPrescription {
  lensUsage?: string;
  lensMaterial?: string;
  odSph?: number | string;
  odCyl?: number | string | null;
  odAxis?: number | string | null;
  osSph?: number | string;
  osCyl?: number | string | null;
  osAxis?: number | string | null;
  od?: EyePrescriptionValues;
  os?: EyePrescriptionValues;
  add?: number | string | null;
  pd?: number | string | null;
  rxFileUrl?: string | null;
  slipUrl?: string | null;
  slipName?: string | null;
  notes?: string;
  // Pricing breakdown & explicit specs
  frameName?: string;
  framePrice?: number;
  visionType?: string;
  lensPackageName?: string;
  lensPrice?: number;
  unitPrice?: number;
  totalPrice?: number;
  selectedLensName?: string;
  lensBasePriceKey?: string;
  lensBasePriceValue?: number;
  lensMultiplier?: number;
  lensFinalPrice?: number;
  isAsymmetricRx?: boolean;
  rightEyeLensPrice?: number;
  leftEyeLensPrice?: number;
  rightMultiplier?: number;
  leftMultiplier?: number;
}

export interface CartItem {
  id: string; // unique cart item id
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  color?: string;
  frameName?: string;
  framePrice?: number;
  visionType?: string;
  lensPackageName?: string;
  lensPrice?: number;
  unitPrice?: number;
  totalPrice?: number;
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

// Self-healing resilient localStorage wrapper
const safeStorage = {
  getItem: (name: string): string | null => {
    try {
      if (typeof window === "undefined") return null;
      const raw = localStorage.getItem(name);
      if (!raw || raw.includes("[object Object]") || raw.includes("[object File]") || raw.includes("[object Blob]")) {
        if (raw) localStorage.removeItem(name);
        return null;
      }
      JSON.parse(raw);
      return raw;
    } catch {
      try {
        localStorage.removeItem(name);
      } catch {}
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(name, value);
      }
    } catch (e) {
      console.warn("Failed to persist cart to localStorage:", e);
    }
  },
  removeItem: (name: string): void => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(name);
      }
    } catch {}
  },
};

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
            price: Number(item.price || 0),
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

      totalItems: () => get().items.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0),

      subtotalPrice: () =>
        get().items.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0),
    }),
    {
      name: "my-eyes-cart-storage",
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);
