"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { X, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import GoogleSignInButton from "./GoogleSignInButton";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  callbackUrl?: string;
  defaultMode?: "login" | "signup";
}

export default function LoginModal({
  isOpen,
  onClose,
  callbackUrl,
  defaultMode = "login",
}: LoginModalProps) {
  const router = useRouter();
  const { refetch } = useAuth();

  const [mode, setMode] = useState<"login" | "signup">(defaultMode);
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const payload =
      mode === "login"
        ? { identifier, password }
        : { name, email: identifier, password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Authentication failed. Please check your credentials.");
        return;
      }

      await refetch();
      onClose();

      if (callbackUrl) {
        router.push(callbackUrl);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputBase =
    "w-full px-4 py-2.5 pl-10 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/20 focus:border-[#ff7a00] bg-white text-slate-900 placeholder:text-slate-400 transition-all font-medium";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 sm:p-8 relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-300/30 mb-3">
            <Image src="/logo.svg" alt="MY EYES" width={28} height={28} className="object-contain" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            {mode === "login" ? "Welcome to MY EYES" : "Create Customer Account"}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {mode === "login"
              ? "Sign in to save prescriptions, track orders & sync your wishlist."
              : "Register to unlock saved prescriptions and fast checkout."}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* 1. Google OAuth Button */}
        <div className="space-y-3">
          <GoogleSignInButton
            callbackUrl={callbackUrl}
            text={mode === "login" ? "Continue with Google" : "Sign up with Google"}
          />

          {/* 2. Subtle Divider */}
          <div className="relative my-4 text-center text-xs text-slate-400">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <span className="relative bg-white px-3 text-slate-400">or continue with email</span>
          </div>
        </div>

        {/* 3. Email Form */}
        <form onSubmit={handleSubmit} className="space-y-3 mt-4">
          {mode === "signup" && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sara Ahmed"
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/20 focus:border-[#ff7a00] bg-white text-slate-900 placeholder:text-slate-400 font-medium"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="name@example.com"
                className={inputBase}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`${inputBase} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-2.5 p-0.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 bg-[#ff7a00] hover:bg-[#ea6c00] disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>{mode === "login" ? "Sign In" : "Create Account"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Switch Mode Toggle */}
        <div className="mt-5 text-center text-xs text-slate-500">
          {mode === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                }}
                className="font-bold text-[#ff7a00] hover:underline cursor-pointer"
              >
                Sign up free
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                className="font-bold text-[#ff7a00] hover:underline cursor-pointer"
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
