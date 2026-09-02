"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  ShoppingBag,
  User,
  Calendar,
  CreditCard,
  Truck,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Share2,
  Loader2,
  FileText,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { formatPrice } from "@/lib/utils";

interface OrderItemData {
  id: string;
  price: number;
  quantity: number;
  selectedLensName?: string | null;
  product?: {
    name: string;
    slug?: string;
    image_url?: string | null;
    images?: string;
  } | null;
  prescription?: {
    lensType?: string;
    odSph?: number;
    odCyl?: number | null;
    odAxis?: number | null;
    osSph?: number;
    osCyl?: number | null;
    osAxis?: number | null;
    pd?: number;
  } | null;
}

interface UserOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  shippingAddress?: string | null;
  shippingCity?: string | null;
  paymentMethod: string;
  paymentStatus: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: OrderItemData[];
}

function StatusBadge({ status }: { status: string }) {
  const s = (status || "").toUpperCase();
  if (s === "DELIVERED" || s === "ADVANCE_VERIFIED" || s === "PAID") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3" />
        {s.replace(/_/g, " ")}
      </span>
    );
  }
  if (s === "CANCELLED" || s === "FAILED") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
        {s}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
      <Clock className="w-3 h-3" />
      {s.replace(/_/g, " ")}
    </span>
  );
}

export default function MyOrdersAndProfilePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [toastMessage, setToastMessage] = useState("");

  const handleShare = async () => {
    const shareUrl = typeof window !== "undefined" ? window.location.origin : "https://myeyes.pk";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "MY EYES Optical Studio",
          text: "Discover luxury frames & lab-precision prescription eyewear.",
          url: shareUrl,
        });
        return;
      } catch {
        /* fallback to clipboard copy */
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setToastMessage("Store link copied to clipboard!");
      setTimeout(() => setToastMessage(""), 3000);
    } catch {
      setToastMessage("Link: " + shareUrl);
      setTimeout(() => setToastMessage(""), 3000);
    }
  };

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setLoadingOrders(false);
      return;
    }

    const fetchOrders = async () => {
      setLoadingOrders(true);
      try {
        const res = await fetch(`/api/orders/user?email=${encodeURIComponent(user.email || "")}&userId=${encodeURIComponent(user.id || "")}`);
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        } else {
          setOrders([]);
        }
      } catch (err) {
        console.warn("Could not fetch user orders:", err);
        setOrders([]);
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchOrders();
  }, [user, authLoading]);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "ME";

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16 pt-6 sm:pt-10">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl animate-fade-in-up flex items-center gap-2">
          <Share2 className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Header Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1">
              <Link href="/" className="hover:text-amber-600 transition-colors">Home</Link>
              <span>/</span>
              <span className="text-slate-800 font-semibold">My Orders &amp; Profile</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Customer Account &amp; Order History
            </h1>
          </div>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 text-xs font-bold transition shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <Share2 className="w-4 h-4 text-slate-500" />
            <span>Share Store</span>
          </button>
        </div>

        {/* Unauthenticated View */}
        {!authLoading && !user && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 text-center max-w-lg mx-auto shadow-sm space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center mx-auto text-amber-600">
              <User className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-slate-900">Sign in to view your orders</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Log in to track current eyeglasses manufacturing status, access saved prescription slips, and view past order invoices.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/login"
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-3 px-6 rounded-xl shadow-xs transition-colors"
              >
                Sign In to Account
              </Link>
              <Link
                href="/signup"
                className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-3 px-6 rounded-xl transition-colors"
              >
                Create Account
              </Link>
            </div>
          </div>
        )}

        {/* Authenticated View */}
        {user && (
          <div className="space-y-8">
            {/* User Profile Summary Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white text-xl font-black flex items-center justify-center shadow-md shrink-0">
                  {initials}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900">{user.name}</h2>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                      Customer
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">{user.email}</p>
                  {user.phone && <p className="text-xs text-slate-500 font-mono">{user.phone}</p>}
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0">
                <Link
                  href="/eyeglasses"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition shadow-xs"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Browse Catalog</span>
                </Link>
              </div>
            </div>

            {/* Orders Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Your Orders</h3>
                  <p className="text-xs text-slate-500">Exclusively tracking orders placed under your account.</p>
                </div>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200/60">
                  {orders.length} Order{orders.length !== 1 ? "s" : ""}
                </span>
              </div>

              {loadingOrders ? (
                <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-3">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
                  <p className="text-xs font-semibold text-slate-600">Loading your orders...</p>
                </div>
              ) : orders.length === 0 ? (
                /* Dedicated Empty State (Requirement 3) */
                <div className="bg-white rounded-3xl border border-slate-200/80 p-10 sm:p-16 text-center shadow-xs space-y-4 max-w-xl mx-auto">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <Package className="w-8 h-8" />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-base sm:text-lg font-extrabold text-slate-900">
                      No orders placed yet
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
                      Looks like you haven&apos;t placed any orders yet. Discover our latest frames and custom lab-fitted lenses.
                    </p>
                  </div>
                  <div className="pt-2">
                    <Link
                      href="/eyeglasses"
                      className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-6 rounded-xl shadow-xs transition-colors text-xs uppercase tracking-wider"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Explore Frames</span>
                    </Link>
                  </div>
                </div>
              ) : (
                /* Order Cards List */
                <div className="space-y-4">
                  {orders.map((order) => {
                    const orderDate = new Date(order.createdAt).toLocaleDateString("en-PK", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    });

                    return (
                      <div
                        key={order.id}
                        className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:border-slate-300 transition"
                      >
                        {/* Order Header Bar */}
                        <div className="p-4 sm:p-5 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-700">
                              <Package className="w-4.5 h-4.5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900 font-mono">
                                Order #{order.orderNumber}
                              </p>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                <Calendar className="w-3 h-3" />
                                <span>{orderDate}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <StatusBadge status={order.status} />
                            <Link
                              href={`/orders/${order.orderNumber}`}
                              className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100/80 px-3 py-1.5 rounded-lg border border-amber-200/60 transition"
                            >
                              <span>View Receipt</span>
                              <ChevronRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>

                        {/* Items List */}
                        <div className="p-4 sm:p-5 divide-y divide-slate-100">
                          {order.items.map((item, idx) => {
                            const productName = item.product?.name || item.selectedLensName || "Custom Eyewear";
                            const productImage = item.product?.image_url || "/placeholder-frame.png";

                            return (
                              <div key={item.id || idx} className="py-3 first:pt-0 last:pb-0 flex items-start gap-4">
                                <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                                  <img src={productImage} alt={productName} className="w-full h-full object-contain" />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <h5 className="text-xs font-bold text-slate-900">{productName}</h5>
                                      <p className="text-[11px] text-slate-500 mt-0.5">
                                        Qty: {item.quantity} · {formatPrice(item.price)}
                                      </p>
                                    </div>
                                    <span className="text-xs font-bold text-slate-900">
                                      {formatPrice(item.price * item.quantity)}
                                    </span>
                                  </div>

                                  {/* Item Prescription Details */}
                                  {item.prescription && (
                                    <div className="mt-2 p-2 rounded-lg bg-slate-50 border border-slate-200/60 text-[10px] space-y-0.5">
                                      <span className="font-semibold text-slate-700 block">
                                        Lens: {item.prescription.lensType || item.selectedLensName || "Custom Lab Lenses"}
                                      </span>
                                      {item.prescription.odSph !== undefined && (
                                        <span className="text-slate-500 font-mono text-[9px] block">
                                          OD: {item.prescription.odSph} SPH | OS: {item.prescription.osSph} SPH
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Order Footer Total */}
                        <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">
                            Payment: <strong className="text-slate-700 font-semibold">{order.paymentMethod}</strong>
                          </span>
                          <span className="font-bold text-slate-900 text-sm">
                            Total: <span className="text-amber-700">{formatPrice(order.totalAmount)}</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
