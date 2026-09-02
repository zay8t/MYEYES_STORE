"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User,
  Package,
  LogOut,
  ShieldCheck,
  ArrowRight,
  Mail,
  LogIn,
  UserPlus,
  Share2,
  Heart,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useAccountDrawerStore } from "@/store/useAccountDrawerStore";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";

export default function MobileAccountDrawer() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const { isOpen, closeAccountDrawer } = useAccountDrawerStore();
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
                  {/* Customer Profile Header */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-[#ff7a00] to-[#ea6c00] text-white text-base font-black flex items-center justify-center shadow-xs shrink-0">
                      {user.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        initials || <User className="w-5 h-5" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {user.name}
                        </h4>
                        {isAdmin && (
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                            Admin
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5 truncate">
                        <Mail className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{user.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="space-y-2 pt-2">
                    {/* 1. My Orders */}
                    <Link
                      href="/orders"
                      onClick={closeAccountDrawer}
                      className="w-full p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Package className="w-4 h-4 text-slate-500" />
                        <span className="text-xs font-medium text-slate-700">
                          My Orders
                        </span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </Link>

                    {/* 2. Share */}
                    <button
                      type="button"
                      onClick={async () => {
                        closeAccountDrawer();
                        const url = typeof window !== "undefined" ? window.location.origin : "https://myeyes.pk";
                        if (typeof navigator !== "undefined" && navigator.share) {
                          try {
                            await navigator.share({
                              title: "MY EYES Optical Studio",
                              text: "Discover luxury frames & lab-precision prescription eyewear.",
                              url,
                            });
                            return;
                          } catch { /* fallback */ }
                        }
                        try {
                          await navigator.clipboard.writeText(url);
                          alert("Link copied");
                        } catch {
                          prompt("Copy store link:", url);
                        }
                      }}
                      className="w-full p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Share2 className="w-4 h-4 text-slate-500" />
                        <span className="text-xs font-medium text-slate-700">
                          Share
                        </span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={closeAccountDrawer}
                        className="w-full p-3.5 rounded-2xl bg-orange-50/70 hover:bg-orange-100/70 flex items-center justify-between text-left transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <ShieldCheck className="w-4 h-4 text-[#ff7a00]" />
                          <span className="text-xs font-medium text-[#ff7a00]">
                            Admin Portal
                          </span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-[#ff7a00]" />
                      </Link>
                    )}

                    {/* 3. Sign Out */}
                    <div className="pt-2">
                      <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full p-3.5 rounded-2xl bg-rose-50 hover:bg-rose-100/80 text-rose-600 font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>{isLoggingOut ? "Signing Out..." : "Sign Out"}</span>
                      </button>
                    </div>
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
                    <GoogleSignInButton
                      callbackUrl="/"
                      text="Continue with Google"
                    />

                    <div className="relative my-2 text-center text-[11px] text-slate-400">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200"></div>
                      </div>
                      <span className="relative bg-white px-2 text-slate-400">or use email</span>
                    </div>

                    <Link
                      href="/login"
                      onClick={closeAccountDrawer}
                      className="w-full py-3 rounded-2xl bg-[#ff7a00] hover:bg-[#ea6c00] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Sign In with Email</span>
                    </Link>

                    <Link
                      href="/signup"
                      onClick={closeAccountDrawer}
                      className="w-full py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
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
