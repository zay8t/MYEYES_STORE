import Link from "next/link";
import { Glasses, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Glasses className="w-8 h-8 text-slate-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-5xl font-black text-slate-900">404</h1>
          <p className="text-lg font-bold text-slate-700">Page Not Found</p>
          <p className="text-sm text-slate-500 leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold uppercase tracking-wider transition-colors shadow-sm"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
          <Link
            href="/eyeglasses"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-slate-800 text-xs font-extrabold uppercase tracking-wider transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Browse Eyeglasses
          </Link>
        </div>
      </div>
    </div>
  );
}
