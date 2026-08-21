"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User,
  Heart,
  Package,
  Sparkles,
  LogOut,
  ShieldCheck,
  ArrowRight,
  HelpCircle,
  Mail,
  Phone,
  Glasses,
  LogIn,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useAccountDrawerStore } from "@/store/useAccountDrawerStore";
import { useWishlistStore } from "@/store/useWishlistStore";

export default function MobileAccountDrawer() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const { isOpen, closeAccountDrawer } = useAccountDrawerStore();
  const { openWishlist } = useWishlistStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      closeAccountDrawer();
    } catch {
      setIsLoggingOut(false);
    }
  };

  const handleOpenWishlist = () => {
    closeAccountDrawer();
    openWishlist();
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "";

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeAccountDrawer}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          {/* Drawer Content */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="relative w-full max-h-[85vh] bg-white rounded-t-3xl border-t border-slate-200/80 shadow-2xl overflow-y-auto flex flex-col z-10 pb-[max(env(safe-area-inset-bottom),1.5rem)]"
          >
            {/* Grab Handle */}
            <div className="sticky top-0 bg-white pt-3 pb-2 px-6 flex flex-col items-center border-b border-slate-100 z-20">
              <div className="w-10 h-1 rounded-full bg-slate-200 mb-2" />
              <div className="w-full flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                  {user ? "Customer Account" : "MY EYES Account"}
                </span>
                <button
                  onClick={closeAccountDrawer}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                  aria-label="Close Account Menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 flex-1">
              {/* Authenticated Customer View */}
              {user ? (
                <>
                  {/* Customer Profile Card */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-orange-50/40 border border-slate-200/80 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ff7a00] to-[#ea6c00] text-white text-lg font-black flex items-center justify-center shadow-md shrink-0">
                      {initials || <User className="w-6 h-6" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-extrabold text-slate-900 truncate">
                          {user.name}
                        </h4>
                        {isAdmin && (
                          <span className="text-[9px] font-black uppercase tracking-wider bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                            Admin
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5 truncate">
                        <Mail className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{user.email}</span>
                      </div>

                      {user.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <Phone className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Stat Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleOpenWishlist}
                      className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col items-start hover:border-[#ff7a00] transition-colors cursor-pointer text-left group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200/60 flex items-center justify-center text-rose-600 mb-2 group-hover:scale-110 transition-transform">
                        <Heart className="w-4 h-4" />
                      </div>
                      <span className="text-xl font-extrabold text-slate-900">
                        {user.wishlistCount ?? 0}
                      </span>
                      <span className="text-[11px] font-medium text-slate-500">
                        Saved Frames
                      </span>
                    </button>

                    <Link
                      href="/order-confirmation"
                      onClick={closeAccountDrawer}
                      className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col items-start hover:border-[#ff7a00] transition-colors cursor-pointer text-left group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 mb-2 group-hover:scale-110 transition-transform">
                        <Package className="w-4 h-4" />
                      </div>
                      <span className="text-xl font-extrabold text-slate-900">
                        {user.orderCount ?? 0}
                      </span>
                      <span className="text-[11px] font-medium text-slate-500">
                        Total Orders
                      </span>
                    </Link>
                  </div>

                  {/* Navigation List */}
                  <div className="space-y-1.5 border-t border-slate-100 pt-4">
                    <button
                      onClick={handleOpenWishlist}
                      className="w-full p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Heart className="w-4 h-4 text-rose-500" />
                        <span className="text-xs font-bold text-slate-800">
                          Saved Wishlist Frames
                        </span>
                      </div>
                      <span className="text-xs font-extrabold text-[#ff7a00] bg-orange-50 px-2 py-0.5 rounded-full">
                        {user.wishlistCount ?? 0}
                      </span>
                    </button>

                    <Link
                      href="/quiz"
                      onClick={closeAccountDrawer}
                      className="w-full p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-bold text-slate-800">
                          Facial Silhouette & Style Quiz
                        </span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </Link>

                    <Link
                      href="/lens-pricing"
                      onClick={closeAccountDrawer}
                      className="w-full p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <Glasses className="w-4 h-4 text-indigo-500" />
                        <span className="text-xs font-bold text-slate-800">
                          Lens Pricing & Coatings Guide
                        </span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </Link>

                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={closeAccountDrawer}
                        className="w-full p-3.5 rounded-2xl bg-purple-50 hover:bg-purple-100 border border-purple-200 flex items-center justify-between text-left transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <ShieldCheck className="w-4 h-4 text-purple-600" />
                          <span className="text-xs font-extrabold text-purple-900">
                            Admin Control Center
                          </span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-purple-600 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    )}
                  </div>

                  {/* Sign Out Button */}
                  <div className="pt-2">
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full py-3.5 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{isLoggingOut ? "Signing Out..." : "Sign Out"}</span>
                    </button>
                  </div>
                </>
              ) : (
                /* Guest View */
                <div className="space-y-6 text-center py-2">
                  {/* Icon */}
                  <div className="w-16 h-16 rounded-3xl bg-orange-50 border border-orange-200/60 text-[#ff7a00] mx-auto flex items-center justify-center shadow-xs">
                    <User className="w-8 h-8 stroke-[1.8]" />
                  </div>

                  {/* Title & Benefits */}
                  <div>
                    <span className="bg-orange-50 border border-orange-200 text-[#ff7a00] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-block mb-2">
                      MY EYES ACCOUNT
                    </span>
                    <h3 className="text-xl font-black text-slate-900">
                      Sign in for the Best Experience
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 max-w-xs mx-auto leading-relaxed">
                      Access your saved frames, prescription preferences, and faster 1-tap checkout.
                    </p>
                  </div>

                  {/* Features List */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-2.5">
                    <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                      <Heart className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>Save and sync your favorite optical frames</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                      <Package className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>Track real-time lab surfacing and courier status</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                      <Sparkles className="w-4 h-4 text-[#ff7a00] shrink-0" />
                      <span>Personalized face-shape frame recommendations</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2.5 pt-2">
                    <Link
                      href="/login"
                      onClick={closeAccountDrawer}
                      className="w-full py-3.5 rounded-2xl bg-[#ff7a00] hover:bg-[#ea6c00] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Sign In to Account</span>
                    </Link>

                    <Link
                      href="/signup"
                      onClick={closeAccountDrawer}
                      className="w-full py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    >
                      <UserPlus className="w-4 h-4 text-slate-600" />
                      <span>Create New Account</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
