"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Eye,
  Heart,
  Sparkles,
  ClipboardList,
  User,
  LogOut,
  ChevronRight,
  Plus,
  Loader2,
  Star,
  CheckCircle2,
  Package,
  Truck,
  FlaskConical,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/AuthProvider";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  { id: "prescriptions", label: "Prescription Vault", icon: Eye },
  { id: "wishlist", label: "Saved Frames", icon: Heart },
  { id: "style", label: "Style Profile", icon: Sparkles },
  { id: "orders", label: "Orders & Tracking", icon: ClipboardList },
] as const;

type TabId = typeof TABS[number]["id"];

// ─── Prescription Card ────────────────────────────────────────────────────────

interface PrescriptionData {
  id: string;
  title: string;
  isDefault: boolean;
  odSph: string | null;
  odCyl: string | null;
  odAxis: number | null;
  osSph: string | null;
  osCyl: string | null;
  osAxis: number | null;
  pd: string | null;
  addPower: string | null;
  prescriptionType: string;
  slipImageUrl: string | null;
  notes: string | null;
  createdAt: string;
}

function PrescriptionCard({ rx }: { rx: PrescriptionData }) {
  const val = (v: string | null, unit: string = "") =>
    v !== null ? `${parseFloat(v) > 0 ? "+" : ""}${parseFloat(v).toFixed(2)}${unit}` : "—";

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] transition-all">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-extrabold text-slate-900">{rx.title}</h3>
            {rx.isDefault && (
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Default
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {new Date(rx.createdAt).toLocaleDateString("en-PK", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-50 border border-slate-200 text-slate-500 px-2.5 py-1 rounded-xl">
          {rx.prescriptionType.replace("_", " ")}
        </span>
      </div>

      {/* OD / OS table */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {[
          { label: "OD (Right Eye)", sph: rx.odSph, cyl: rx.odCyl, axis: rx.odAxis },
          { label: "OS (Left Eye)", sph: rx.osSph, cyl: rx.osCyl, axis: rx.osAxis },
        ].map((eye) => (
          <div key={eye.label} className="bg-slate-50/80 rounded-2xl p-3.5">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2.5">
              {eye.label}
            </p>
            <div className="space-y-1.5">
              {[
                ["SPH", val(eye.sph)],
                ["CYL", val(eye.cyl)],
                ["Axis", eye.axis !== null ? `${eye.axis}°` : "—"],
              ].map(([lbl, v]) => (
                <div key={lbl} className="flex justify-between items-center">
                  <span className="text-[11px] font-semibold text-slate-500">{lbl}</span>
                  <span className="text-xs font-extrabold text-slate-900 font-mono">{v}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* PD & Add */}
      <div className="flex gap-2">
        <div className="flex-1 bg-orange-50/60 border border-orange-100 rounded-2xl px-3 py-2 flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500">PD</span>
          <span className="text-sm font-extrabold text-[#ff7a00] font-mono">
            {rx.pd !== null ? `${parseFloat(rx.pd)}mm` : "—"}
          </span>
        </div>
        {rx.addPower && (
          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Add</span>
            <span className="text-sm font-extrabold text-slate-700 font-mono">
              {val(rx.addPower)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Order Status Tracker ──────────────────────────────────────────────────────

const ORDER_STEPS = [
  { key: "ORDER_PLACED", label: "Order Confirmed", icon: CheckCircle2 },
  { key: "ADVANCE_VERIFIED", label: "Advance Verified", icon: ShieldCheck },
  { key: "LENS_SURFACING_EDGING", label: "Lab Edging & Fitting", icon: FlaskConical },
  { key: "QUALITY_INSPECTION_PASSED", label: "Quality Passed", icon: Star },
  { key: "DISPATCHED_WITH_COURIER", label: "Dispatched", icon: Truck },
  { key: "DELIVERED", label: "Delivered", icon: Package },
];

function OrderStepTracker({ status }: { status: string }) {
  const currentIdx = ORDER_STEPS.findIndex((s) => s.key === status);

  return (
    <div className="flex items-start gap-0 overflow-x-auto pb-1">
      {ORDER_STEPS.map((step, idx) => {
        const Icon = step.icon;
        const isCompleted = idx < currentIdx;
        const isCurrent = idx === currentIdx;

        return (
          <div key={step.key} className="flex items-start flex-1 min-w-0">
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <div
                className={cn(
                  "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                  isCompleted
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : isCurrent
                    ? "bg-[#ff7a00] border-[#ff7a00] text-white animate-pulse"
                    : "bg-white border-slate-200 text-slate-300"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <p
                className={cn(
                  "text-[10px] font-bold text-center leading-tight",
                  isCurrent ? "text-[#ff7a00]" : isCompleted ? "text-emerald-600" : "text-slate-300"
                )}
              >
                {step.label}
              </p>
            </div>
            {idx < ORDER_STEPS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 mt-4 mx-1 transition-all",
                  idx < currentIdx ? "bg-emerald-400" : "bg-slate-200"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Profile Component ───────────────────────────────────────────────────

function ProfileHub() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>(
    (searchParams.get("tab") as TabId) || "prescriptions"
  );

  // Tab data states
  const [prescriptions, setPrescriptions] = useState<PrescriptionData[]>([]);
  const [wishlist, setWishlist] = useState<{ id: string; productId: string; product: Record<string, unknown> | null; createdAt: string }[]>([]);
  const [orders, setOrders] = useState<Record<string, unknown>[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    router.push(`/profile?tab=${tab}`, { scroll: false });
  };

  // Load tab data
  useEffect(() => {
    if (!user) return;

    const fetchTabData = async () => {
      setIsLoadingData(true);
      try {
        if (activeTab === "prescriptions") {
          const res = await fetch("/api/prescriptions");
          if (res.ok) {
            const data = await res.json();
            setPrescriptions(data.prescriptions || []);
          }
        } else if (activeTab === "wishlist") {
          const res = await fetch("/api/wishlist");
          if (res.ok) {
            const data = await res.json();
            setWishlist(data.wishlist || []);
          }
        } else if (activeTab === "orders") {
          const res = await fetch("/api/orders/mine");
          if (res.ok) {
            const data = await res.json();
            setOrders(data.orders || []);
          }
        }
      } catch {}
      setIsLoadingData(false);
    };

    fetchTabData();
  }, [activeTab, user]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-[#ff7a00]" />
      </div>
    );
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ff7a00] to-[#ea6c00] flex items-center justify-center text-white text-xl font-extrabold shadow-sm shrink-0">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{user.name}</h1>
            <p className="text-sm text-slate-500">{user.email}</p>
            {user.isVerified && (
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1">
                <CheckCircle2 className="w-2.5 h-2.5" />
                Verified Account
              </span>
            )}
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all cursor-pointer self-start sm:self-center"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Prescriptions", value: user.prescriptionCount, color: "text-[#ff7a00]" },
          { label: "Saved Frames", value: user.wishlistCount, color: "text-rose-500" },
          { label: "Orders", value: user.orderCount, color: "text-blue-600" },
          { label: "Account Type", value: user.role.replace("_", " "), color: "text-emerald-600", isText: true },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.04)]"
          >
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              {stat.label}
            </p>
            <p className={cn("text-xl font-extrabold", stat.color)}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-6 bg-slate-50 border border-slate-200 rounded-2xl p-1.5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`profile-tab-${tab.id}`}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-1 justify-center cursor-pointer",
                isActive
                  ? "bg-white text-[#ff7a00] shadow-sm border border-slate-200/80"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {/* ── Prescription Vault ── */}
        {activeTab === "prescriptions" && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-extrabold text-slate-900">Your Prescriptions</h2>
              <button
                id="add-prescription-btn"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ff7a00] text-white text-xs font-bold hover:bg-[#ea6c00] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add New
              </button>
            </div>

            {isLoadingData ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-[#ff7a00]" />
              </div>
            ) : prescriptions.length === 0 ? (
              <div className="text-center py-16 bg-white border border-slate-200/90 rounded-3xl">
                <Eye className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-400">No prescriptions saved yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  Add your optical prescription from your doctor&apos;s slip.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {prescriptions.map((rx) => (
                  <PrescriptionCard key={rx.id} rx={rx} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Wishlist / Saved Frames ── */}
        {activeTab === "wishlist" && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-extrabold text-slate-900">
                Saved Frames
                {wishlist.length > 0 && (
                  <span className="ml-2 text-sm font-bold text-slate-400">({wishlist.length})</span>
                )}
              </h2>
              <Link
                href="/eyeglasses"
                className="flex items-center gap-1.5 text-xs font-bold text-[#ff7a00] hover:text-[#ea6c00] transition-colors"
              >
                Browse Frames
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {isLoadingData ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-[#ff7a00]" />
              </div>
            ) : wishlist.length === 0 ? (
              <div className="text-center py-16 bg-white border border-slate-200/90 rounded-3xl">
                <Heart className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-400">No saved frames yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  Tap the heart icon on any frame to save it here.
                </p>
                <Link
                  href="/eyeglasses"
                  className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl bg-[#ff7a00] text-white text-xs font-bold hover:bg-[#ea6c00] transition-colors"
                >
                  Explore Frames
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {wishlist.map((item) => {
                  const product = item.product as Record<string, unknown> | null;
                  if (!product) return null;
                  return (
                    <Link
                      key={item.id}
                      href={`/products/${product.slug}`}
                      className="group bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-[0_2px_8px_-4px_rgba(0,0,0,0.06)] hover:shadow-md transition-all"
                    >
                      <div className="aspect-[4/3] bg-slate-50 overflow-hidden">
                        {product.image_url ? (
                          <Image
                            src={product.image_url as string}
                            alt={product.name as string}
                            width={300}
                            height={225}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Glasses className="w-8 h-8 text-slate-300" />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-xs font-bold text-slate-900 truncate">{product.name as string}</p>
                        <p className="text-xs font-extrabold text-[#ff7a00] mt-0.5">
                          PKR {Number(product.price).toLocaleString()}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span
                            className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-full",
                              Number(product.stock) > 0
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-red-50 text-red-600 border border-red-200"
                            )}
                          >
                            {Number(product.stock) > 0 ? "In Stock" : "Out of Stock"}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 hover:text-[#ff7a00] transition-colors">
                            Configure →
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Style Profile ── */}
        {activeTab === "style" && (
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 mb-5">Face Shape & Style Profile</h2>
            <div className="bg-white border border-slate-200/90 rounded-3xl p-8 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)]">
              {user.savedFaceShape ? (
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-orange-50 border-2 border-[#ff7a00]/20 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-[#ff7a00]" />
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                    Your Face Shape
                  </p>
                  <h3 className="text-2xl font-extrabold text-slate-900 capitalize">
                    {user.savedFaceShape.toLowerCase()}
                  </h3>
                  <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
                    Based on your style quiz, here are the frame shapes that complement your face geometry.
                  </p>
                  <Link
                    href="/quiz"
                    className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Retake Style Quiz
                  </Link>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-20 h-20 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-sm font-bold text-slate-500">No style profile yet</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    Take our 60-second style quiz to discover your ideal frame shapes based on your face geometry.
                  </p>
                  <Link
                    href="/quiz"
                    className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-xl bg-[#ff7a00] text-white text-xs font-bold hover:bg-[#ea6c00] transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Take Style Quiz
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Orders ── */}
        {activeTab === "orders" && (
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 mb-5">Orders & Lab Tracking</h2>

            {isLoadingData ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-[#ff7a00]" />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-16 bg-white border border-slate-200/90 rounded-3xl">
                <ClipboardList className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-400">No orders yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  Your lab-crafted orders will appear here with live step tracking.
                </p>
                <Link
                  href="/eyeglasses"
                  className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl bg-[#ff7a00] text-white text-xs font-bold hover:bg-[#ea6c00] transition-colors"
                >
                  Shop Frames
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order: Record<string, unknown>) => (
                  <div
                    key={order.id as string}
                    className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)]"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs font-extrabold text-slate-900">
                          Order #{order.orderNumber as string || (order.id as string).slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(order.createdAt as string).toLocaleDateString("en-PK", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-extrabold text-slate-900">
                          PKR {Number(order.totalAmount).toLocaleString()}
                        </p>
                        <span className="text-[10px] font-bold bg-orange-50 text-[#ff7a00] border border-orange-200 px-2 py-0.5 rounded-full">
                          {(order.paymentMethod as string)?.replace("_", " ")}
                        </span>
                      </div>
                    </div>

                    <OrderStepTracker status={order.status as string} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Quick workaround for Glasses icon not being imported
function Glasses({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="6" cy="15" r="4" />
      <circle cx="18" cy="15" r="4" />
      <path d="M2 15l0-8" />
      <path d="M22 15l0-8" />
      <path d="M10 15a2 2 0 0 1 4 0" />
    </svg>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-6 h-6 animate-spin text-[#ff7a00]" />
        </div>
      }
    >
      <ProfileHub />
    </Suspense>
  );
}
