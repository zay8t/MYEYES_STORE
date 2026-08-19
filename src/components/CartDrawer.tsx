"use client";

import { useRouter } from "next/navigation";
import { X, Plus, Minus, Trash2, ShoppingBag, Eye, ArrowRight } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { formatPrice } from "@/lib/utils";

export default function CartDrawer() {
  const router = useRouter();
  const { items, isOpen, closeCart, updateQuantity, removeItem, subtotalPrice } =
    useCartStore();

  if (!isOpen) return null;

  const subtotal = subtotalPrice();
  const shipping = subtotal > 0 ? 250 : 0;
  const grandTotal = subtotal + shipping;

  const handleCheckout = () => {
    if (items.length === 0) return;
    closeCart();
    router.push("/checkout");
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end md:flex-row md:justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={closeCart}
      />

      {/* Drawer / Bottom Sheet Panel */}
      <div className="relative w-full md:max-w-md bg-white rounded-t-3xl md:rounded-none border-t md:border-t-0 md:border-l border-slate-200 max-h-[90vh] md:max-h-full h-auto md:h-full shadow-2xl flex flex-col z-10 animate-slide-up-sheet md:animate-fade-in-up">
        {/* Mobile Pull Handle */}
        <div className="md:hidden pt-2 pb-1 flex justify-center">
          <div className="sheet-drag-handle" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 md:py-5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-slate-900" />
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Your Shopping Bag ({items.length})
            </h2>
          </div>
          <button
            onClick={closeCart}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close Cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto stroke-[1.25]" />
              <p className="text-sm font-bold text-slate-800">Your bag is empty</p>
              <p className="text-xs text-slate-400">Explore our optical & sun collection to select frames.</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3 app-card-press"
              >
                <div className="flex gap-3">
                  {/* Frame Thumbnail */}
                  <div className="w-16 h-16 rounded-lg bg-white border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                    ) : (
                      <Eye className="w-6 h-6 text-slate-300" />
                    )}
                  </div>

                  {/* Info & Price */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {item.name}
                      </h4>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-slate-400 hover:text-red-600 transition-colors p-0.5 cursor-pointer"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs font-bold text-slate-900 mt-1">
                      {formatPrice(item.price)}
                    </p>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="inline-flex items-center border border-slate-200 rounded-lg bg-white">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 hover:bg-slate-100 text-slate-600 cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 text-[11px] font-bold text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 hover:bg-slate-100 text-slate-600 cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Itemized Prescription Summary Badge */}
                {item.prescription && (
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200/80 text-[10px] space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-100 pb-1">
                      <span>Rx: {item.prescription.lensUsage || "Prescription Lenses"}</span>
                      <span>{item.prescription.lensMaterial || "1.56 Index"}</span>
                    </div>

                    {item.prescription.odSph !== undefined && (
                      <div className="grid grid-cols-2 text-slate-600 font-mono text-[9.5px] pt-0.5">
                        <div>OD: SPH {item.prescription.odSph} | CYL {item.prescription.odCyl || "0.00"} | AXIS {item.prescription.odAxis || "-"}</div>
                        <div>OS: SPH {item.prescription.osSph} | CYL {item.prescription.osCyl || "0.00"} | AXIS {item.prescription.osAxis || "-"}</div>
                      </div>
                    )}
                    {item.prescription.pd && (
                      <span className="block text-[9.5px] text-slate-400">
                        PD: {item.prescription.pd} mm
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer Calculation & Checkout */}
        {items.length > 0 && (
          <div className="p-6 border-t border-slate-100 bg-white space-y-3 pb-[max(env(safe-area-inset-bottom),1.5rem)]">
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Optical Fitting & Inspection</span>
                <span className="font-semibold text-emerald-600">Free</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-semibold text-slate-900">
                  {shipping === 0 ? "Free" : formatPrice(shipping)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-100">
                <span>Grand Total</span>
                <span>{formatPrice(grandTotal)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              Proceed to Checkout ({formatPrice(grandTotal)})
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
