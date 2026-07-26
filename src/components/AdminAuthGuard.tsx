"use client";

import { useState, useEffect } from "react";
import { Lock, KeyRound, ArrowRight, LogOut, ShieldAlert } from "lucide-react";

const ADMIN_PASSWORD = "admin@123";
const AUTH_STORAGE_KEY = "my_eyes_admin_auth_v1";

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    setMounted(true);
    const storedAuth = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (storedAuth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      sessionStorage.setItem(AUTH_STORAGE_KEY, "true");
      setIsAuthenticated(true);
      setErrorMsg("");
    } else {
      setErrorMsg("Invalid Admin Password. Access Denied.");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    setIsAuthenticated(false);
    setPasswordInput("");
  };

  if (!mounted) return null;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-xl space-y-6 text-center animate-fade-in-up">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto shadow-md">
            <Lock className="w-6 h-6" />
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              RESTRICTED ACCESS
            </span>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              Admin Portal Authentication
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Enter the master admin password to access store management.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Admin Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter password..."
                  className="w-full px-3.5 py-2.5 pl-9 text-xs border border-slate-200 rounded-xl focus:border-slate-900 focus:outline-none bg-white font-medium"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              Authenticate Admin
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Global Admin Logout Bar */}
      <div className="bg-slate-900 text-white px-4 text-xs fixed top-0 left-0 w-full z-[100] h-16 flex items-center">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
          <span className="font-bold tracking-wide">
            🔒 MY EYES — ADMIN MODE ACTIVE
          </span>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout Admin Session
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}
