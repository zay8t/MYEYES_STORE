"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, Heart, Trash2, ArrowRight, Loader2, Glasses } from "lucide-react";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useAuth } from "@/components/AuthProvider";
import { formatPrice } from "@/lib/utils";

interface WishlistProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  image_url: string | null;
}

interface WishlistItemData {
  id: string;
  productId: string;
  product: WishlistProduct | null;
}

export default function WishlistDrawer() {
  const { isOpen, closeWishlist, refreshTrigger } = useWishlistStore();
  const { user, refetch } = useAuth();
  const [items, setItems] = useState<WishlistItemData[]>([]);
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchWishlist = useCallback(async () => {
    if (!isOpen) return;

    if (user) {
      setLoading(true);
      try {
        const res = await fetch("/api/wishlist", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setItems(data.wishlist || []);
        }
      } catch (err) {
        console.error("Failed to load wishlist:", err);
      } finally {
        setLoading(false);
      }
    } else {
      // Guest user wishlist
      try {
        const stored = localStorage.getItem("myeyes_guest_wishlist");
        const productIds: string[] = stored ? JSON.parse(stored) : [];
        if (productIds.length === 0) {
          setItems([]);
          return;
        }

        setLoading(true);
        const res = await fetch(`/api/products?ids=${productIds.join(",")}`);
        if (res.ok) {
          const data = await res.json();
          const products: WishlistProduct[] = data.products || [];
          setItems(
            products.map((p) => ({
              id: p.id,
              productId: p.id,
              product: p,
            }))
          );
        }
      } catch (err) {
        console.error("Failed to load guest wishlist:", err);
      } finally {
        setLoading(false);
      }
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (isOpen) {
      fetchWishlist();
    }
  }, [isOpen, fetchWishlist, refreshTrigger]);

  const handleRemove = async (productId: string) => {
    setRemovingId(productId);
    try {
      if (user) {
        await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        await refetch();
      } else {
        const stored = localStorage.getItem("myeyes_guest_wishlist");
        const productIds: string[] = stored ? JSON.parse(stored) : [];
        const updated = productIds.filter((id) => id !== productId);
        localStorage.setItem("myeyes_guest_wishlist", JSON.stringify(updated));
      }
      setItems((prev) => prev.filter((item) => item.productId !== productId));
    } catch (err) {
      console.error("Failed to remove item from wishlist:", err);
    } finally {
      setRemovingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end md:flex-row md:justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={closeWishlist}
      />

      {/* Drawer Panel */}
      <div className="relative w-full md:max-w-md bg-white rounded-t-3xl md:rounded-none border-t md:border-t-0 md:border-l border-slate-200 max-h-[90vh] md:max-h-full h-auto md:h-full shadow-2xl flex flex-col z-10 animate-slide-up-sheet md:animate-fade-in-up">
        {/* Mobile Pull Handle */}
        <div className="md:hidden pt-2 pb-1 flex justify-center">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 md:py-5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
              <Heart className="w-4 h-4 fill-rose-500" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                Saved Frames ({items.length})
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">Your curated optical favorites</p>
            </div>
          </div>
          <button
            onClick={closeWishlist}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close Wishlist"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wishlist Items List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader2 className="w-7 h-7 animate-spin text-[#ff7a00]" />
              <p className="text-xs text-slate-400 font-medium">Loading saved frames...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 space-y-3">
              <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto text-slate-300">
                <Heart className="w-6 h-6 stroke-[1.5]" />
              </div>
              <p className="text-sm font-bold text-slate-800">No saved frames yet</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Tap the heart icon on any frame in our catalog to save it for quick access here.
              </p>
              <Link
                href="/eyeglasses"
                onClick={closeWishlist}
                className="inline-flex items-center gap-2 mt-3 px-5 py-2.5 rounded-xl bg-[#ff7a00] text-white text-xs font-bold hover:bg-[#ea6c00] transition-colors shadow-xs"
              >
                Explore Frames
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            items.map((item) => {
              const product = item.product;
              if (!product) return null;

              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl border border-slate-200/90 bg-white hover:border-[#ff7a00]/30 transition-all flex items-center gap-3.5 group shadow-xs"
                >
                  {/* Frame Thumbnail */}
                  <Link
                    href={`/products/${product.slug}`}
                    onClick={closeWishlist}
                    className="w-18 h-18 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center p-1.5 relative group-hover:bg-orange-50/30 transition-colors"
                  >
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        width={72}
                        height={72}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Glasses className="w-6 h-6 text-slate-300" />
                    )}
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${product.slug}`}
                      onClick={closeWishlist}
                      className="text-xs font-bold text-slate-900 truncate hover:text-[#ff7a00] transition-colors block"
                    >
                      {product.name}
                    </Link>
                    <p className="text-xs font-extrabold text-[#ff7a00] mt-0.5">
                      {formatPrice(product.price)}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          product.stock > 0
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-red-50 text-red-600 border-red-200"
                        }`}
                      >
                        {product.stock > 0 ? "In Stock" : "Out of Stock"}
                      </span>
                      <Link
                        href={`/products/${product.slug}`}
                        onClick={closeWishlist}
                        className="text-[10px] font-bold text-slate-500 hover:text-slate-900 transition-colors inline-flex items-center gap-0.5"
                      >
                        View Frame <ArrowRight className="w-2.5 h-2.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemove(product.id)}
                    disabled={removingId === product.id}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-40"
                    aria-label="Remove from wishlist"
                  >
                    {removingId === product.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <Link
              href="/eyeglasses"
              onClick={closeWishlist}
              className="w-full py-3 bg-[#ff7a00] hover:bg-[#ea6c00] text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              Continue Shopping Frames
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
