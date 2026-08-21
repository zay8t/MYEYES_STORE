"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, ArrowRight, Loader2, User, Mail, Phone, Lock } from "lucide-react";
import type { Metadata } from "next";
import { useAuth } from "@/components/AuthProvider";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refetch } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: [] }));
    }
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      // Register
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) setFieldErrors(data.details);
        setError(data.error || "Registration failed. Please try again.");
        return;
      }

      // Sync guest cart from localStorage
      try {
        const guestCart = localStorage.getItem("myeyes_guest_cart");
        if (guestCart) {
          const items = JSON.parse(guestCart);
          if (Array.isArray(items) && items.length > 0) {
            await fetch("/api/cart/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ items }),
            });
            localStorage.removeItem("myeyes_guest_cart");
          }
        }
      } catch {}

      // Sync guest wishlist from localStorage
      try {
        const guestWishlist = localStorage.getItem("myeyes_guest_wishlist");
        if (guestWishlist) {
          const productIds = JSON.parse(guestWishlist);
          if (Array.isArray(productIds) && productIds.length > 0) {
            await fetch("/api/wishlist/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ productIds }),
            });
            localStorage.removeItem("myeyes_guest_wishlist");
          }
        }
      } catch {}

      // Refetch auth state
      await refetch();

      // Redirect
      const redirectTo = searchParams.get("redirect") || "/profile";
      router.push(redirectTo);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputBase =
    "w-full px-4 py-3 pl-10 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/20 focus:border-[#ff7a00] bg-white text-slate-900 placeholder:text-slate-400 transition-all font-medium";

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="flex justify-center mb-8">
        <Link href="/" className="flex items-center gap-2.5 group">
          <Image src="/logo.svg" alt="MY EYES" width={36} height={36} className="object-contain" />
          <div className="flex flex-col">
            <span className="text-lg font-extrabold tracking-wider text-[#ff7a00] uppercase">
              MY EYES
            </span>
            <span className="text-[9px] uppercase tracking-[0.25em] text-slate-400 font-semibold -mt-1">
              OPTICAL STUDIO
            </span>
          </div>
        </Link>
      </div>

      {/* Card */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-10 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
        {/* Eyebrow Pill */}
        <div className="flex justify-center mb-5">
          <span className="bg-orange-50 border border-orange-200 text-[#ff7a00] text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff7a00] animate-pulse" />
            MY EYES STUDIO PORTAL
          </span>
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Join MY EYES
          </h1>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Track custom lab-crafted orders, save prescriptions, and access 1-tap reordering.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                id="signup-name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Mustafa Ahmed"
                className={inputBase}
                autoComplete="name"
              />
            </div>
            {fieldErrors.name && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.name[0]}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                id="signup-email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                className={inputBase}
                autoComplete="email"
              />
            </div>
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.email[0]}</p>
            )}
          </div>

          {/* WhatsApp Phone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              WhatsApp Phone
              <span className="ml-1.5 text-slate-400 font-normal">(optional)</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                id="signup-phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="0300 1234567"
                className={inputBase}
                autoComplete="tel"
              />
            </div>
            {fieldErrors.phone && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.phone[0]}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                id="signup-password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={`${inputBase} pr-11`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3.5 top-3 p-0.5 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.password[0]}</p>
            )}
          </div>

          {/* Submit */}
          <button
            id="signup-submit"
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-[#ff7a00] hover:bg-[#ea6c00] disabled:opacity-60 text-white font-bold rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 mt-2 active:scale-[0.98] cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                Create Studio Account
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Sign In Link */}
        <p className="text-center text-xs text-slate-500 mt-6">
          Already have an account?{" "}
          <Link
            href={`/login${searchParams.get("redirect") ? `?redirect=${searchParams.get("redirect")}` : ""}`}
            className="font-bold text-[#ff7a00] hover:text-[#ea6c00] transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
