import React from "react";

export function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="p-5 rounded-2xl border border-slate-200/60 bg-slate-50/50 animate-pulse space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="h-3 bg-slate-200 rounded-md w-24"></div>
            <div className="w-8 h-8 rounded-lg bg-slate-200"></div>
          </div>
          <div className="h-7 bg-slate-200 rounded-lg w-32"></div>
          <div className="h-3 bg-slate-100 rounded-md w-40"></div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs animate-pulse">
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div className="h-4 bg-slate-200 rounded-md w-48"></div>
        <div className="h-4 bg-slate-200 rounded-md w-24"></div>
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-10 h-10 bg-slate-200 rounded-xl flex-shrink-0"></div>
              <div className="space-y-2 flex-1 max-w-sm">
                <div className="h-4 bg-slate-200 rounded-md w-3/4"></div>
                <div className="h-3 bg-slate-100 rounded-md w-1/2"></div>
              </div>
            </div>
            <div className="hidden sm:block h-4 bg-slate-200 rounded-md w-24"></div>
            <div className="h-8 bg-slate-200 rounded-xl w-28"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-slate-200 rounded-md w-40"></div>
        <div className="h-4 bg-slate-200 rounded-md w-20"></div>
      </div>
      <div className="h-48 bg-slate-100 rounded-xl w-full"></div>
    </div>
  );
}
