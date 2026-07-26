"use client";

import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
  duration?: number;
}

export default function Toast({
  message,
  type = "success",
  onClose,
  duration = 3000,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div
        className={cn(
          "px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 max-w-sm text-xs font-bold transition-all",
          type === "success"
            ? "bg-slate-900 text-white border-amber-500/50"
            : type === "error"
            ? "bg-rose-950 text-rose-100 border-rose-600"
            : "bg-slate-900 text-slate-100 border-slate-700"
        )}
      >
        {type === "success" && <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />}
        {type === "error" && <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />}
        {type === "info" && <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />}

        <span className="flex-1">{message}</span>

        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
