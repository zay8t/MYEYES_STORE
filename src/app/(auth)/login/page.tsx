"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, ArrowRight, Loader2, Mail, Lock } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refetch } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed. Please check your credentials.");
        return;
      }

      // Sync guest cart
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

      // Sync guest wishlist
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

      await refetch();

      // Role-based auto redirection
      const role = data.user?.role;
      if (role === "ADMIN" || role === "SUPER_ADMIN") {
        router.push("/admin");
      } else {
        const rawRedirect = searchParams.get("redirect");
        const redirectTo = rawRedirect && rawRedirect !== "/profile" ? rawRedirect : "/";
        router.push(redirectTo);
      }
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
      <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-8 sm:p-10">
        {/* Eyebrow Pill */}
        <div className="flex justify-center mb-5">
          <span className="bg-orange-50 border border-orange-200 text-[#ff7a00] text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff7a00] animate-pulse" />
            CUSTOMER SIGN IN
          </span>
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Sign in to your MY EYES account to manage orders, wishlist & checkout seamlessly.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Google OAuth One-Click Sign In */}
        <div className="space-y-4 mb-4">
          <GoogleSignInButton
            callbackUrl={searchParams.get("redirect") || "/"}
            text="Continue with Google"
          />

          <div className="relative my-4 text-center text-xs text-slate-400">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <span className="relative bg-white px-3 text-slate-400">or continue with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Identifier */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Email or Phone Number
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                id="login-identifier"
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="name@example.com or 03001234567"
                className={inputBase}
                autoComplete="username"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`${inputBase} pr-11`}
                autoComplete="current-password"
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
          </div>

          {/* Submit */}
          <button
            id="login-submit"
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-[#ff7a00] hover:bg-[#ea6c00] disabled:opacity-60 text-white font-bold rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 mt-2 active:scale-[0.98] cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing In...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Sign Up Link */}
        <p className="text-center text-xs text-slate-500 mt-6">
          Don&apos;t have an account?{" "}
          <Link
            href={`/signup${searchParams.get("redirect") ? `?redirect=${searchParams.get("redirect")}` : ""}`}
            className="font-bold text-[#ff7a00] hover:text-[#ea6c00] transition-colors"
          >
            Create one free
          </Link>
        </p>

        {/* Back to store */}
        <p className="text-center text-xs text-slate-400 mt-3">
          <Link href="/" className="hover:text-slate-600 transition-colors underline underline-offset-2">
            ← Back to store
          </Link>
        </p>
      </div>
    </div>
  );
}
