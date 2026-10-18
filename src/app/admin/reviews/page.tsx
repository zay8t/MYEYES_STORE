"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Star,
  CheckCircle2,
  XCircle,
  Trash2,
  EyeOff,
  Clock,
  RefreshCw,
  MessageSquare,
  AlertTriangle,
  Filter,
  ShoppingBag,
} from "lucide-react";

interface AdminReview {
  id: string;
  rating: number;
  comment: string;
  userName: string;
  userEmail?: string | null;
  isApproved: boolean;
  createdAt: string;
  product: { id: string; name: string; price: number; slug: string };
}

type FilterStatus = "all" | "pending" | "approved";

const FILTER_TABS: { key: FilterStatus; label: string; icon: React.ReactNode }[] = [
  { key: "all", label: "All Reviews", icon: <MessageSquare className="w-3.5 h-3.5" /> },
  { key: "pending", label: "Pending", icon: <Clock className="w-3.5 h-3.5" /> },
  { key: "approved", label: "Approved", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i < rating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"
          }`}
        />
      ))}
      <span className="text-[11px] font-bold text-slate-500 ml-1">{rating}/5</span>
    </div>
  );
}

function ReviewCard({
  review,
  onApprove,
  onDelete,
  isActing,
}: {
  review: AdminReview;
  onApprove: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
  isActing: boolean;
}) {
  const formattedDate = new Date(review.createdAt).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`bg-white border rounded-2xl shadow-xs transition-all duration-200 overflow-hidden ${
        review.isApproved
          ? "border-emerald-200/60 hover:border-emerald-300"
          : "border-amber-200/60 hover:border-amber-300"
      }`}
    >
      {/* Status bar */}
      <div
        className={`h-1 w-full ${review.isApproved ? "bg-emerald-500" : "bg-amber-400"}`}
      />

      <div className="p-5 flex flex-col md:flex-row md:items-start gap-4">
        {/* Left: Review details */}
        <div className="flex-1 space-y-3 min-w-0">
          {/* Header row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-extrabold shrink-0 select-none">
              {review.userName.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
              <p className="text-sm font-extrabold text-slate-900 truncate">
                {review.userName}
              </p>
              {review.userEmail && (
                <p className="text-[10px] text-slate-400 truncate">{review.userEmail}</p>
              )}
            </div>

            {/* Status badge */}
            <span
              className={`ml-auto shrink-0 text-[10px] px-2.5 py-1 rounded-full font-extrabold uppercase tracking-wider ${
                review.isApproved
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : "bg-amber-100 text-amber-800 border border-amber-200"
              }`}
            >
              {review.isApproved ? "✓ Live" : "⏳ Pending"}
            </span>
          </div>

          {/* Product reference */}
          <div className="flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-lg truncate">
              {review.product?.name ?? "Unknown Frame"}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              PKR {(review.product?.price ?? 0).toLocaleString()}
            </span>
          </div>

          {/* Star rating */}
          <StarRating rating={review.rating} />

          {/* Comment */}
          <p className="text-sm text-slate-700 bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl leading-relaxed">
            {review.comment}
          </p>

          {/* Timestamp */}
          <p className="text-[11px] text-slate-400 font-medium">{formattedDate}</p>
        </div>

        {/* Right: Actions */}
        <div className="flex md:flex-col items-center gap-2 shrink-0 md:self-center">
          <button
            onClick={() => onApprove(review.id, review.isApproved)}
            disabled={isActing}
            title={review.isApproved ? "Unpublish review" : "Approve & publish review"}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer disabled:opacity-50 ${
              review.isApproved
                ? "bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-200"
                : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
            }`}
          >
            {review.isApproved ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                Unpublish
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Approve
              </>
            )}
          </button>

          <button
            onClick={() => onDelete(review.id)}
            disabled={isActing}
            title="Delete this review permanently"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [actingId, setActingId] = useState<string | null>(null);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews?status=${filter}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews);
        setPendingTotal(data.pendingCount ?? 0);
      } else {
        showToast("Failed to load reviews.", "error");
      }
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleToggleApprove = async (id: string, currentStatus: boolean) => {
    setActingId(id);
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: id, isApproved: !currentStatus }),
      });
      if (res.ok) {
        showToast(currentStatus ? "Review unpublished." : "Review approved & published!", "success");
        await fetchReviews();
      } else {
        showToast("Failed to update review status.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    } finally {
      setActingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently delete this review? This action cannot be undone.")) return;
    setActingId(id);
    try {
      const res = await fetch(`/api/admin/reviews?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Review deleted permanently.", "success");
        await fetchReviews();
      } else {
        showToast("Failed to delete review.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    } finally {
      setActingId(null);
    }
  };

  // Stats
  const approvedCount = reviews.filter((r) => r.isApproved).length;
  const pendingCount = reviews.filter((r) => !r.isApproved).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-xl text-sm font-bold animate-in slide-in-from-top-2 duration-300 ${
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-rose-600 text-white"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 shrink-0" />
          )}
          {toast.message}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/60 inline-block mb-1.5">
            REVIEW MODERATION
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Customer Review Queue
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Approve, unpublish, or remove customer feedback before it appears on your storefront.
          </p>
        </div>

        <button
          onClick={fetchReviews}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Total",
            value: reviews.length,
            color: "bg-slate-50 border-slate-200 text-slate-900",
            icon: <MessageSquare className="w-4 h-4 text-slate-400" />,
          },
          {
            label: "Pending Moderation",
            value: filter === "all" ? pendingCount : pendingTotal,
            color: "bg-amber-50 border-amber-200 text-amber-900",
            icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
          },
          {
            label: "Published Live",
            value: filter === "all" ? approvedCount : reviews.length - (filter === "pending" ? reviews.length : 0),
            color: "bg-emerald-50 border-emerald-200 text-emerald-900",
            icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`${stat.color} border rounded-2xl p-4 flex items-center gap-3`}
          >
            {stat.icon}
            <div>
              <p className="text-xl font-extrabold leading-none">{stat.value}</p>
              <p className="text-[10px] font-semibold opacity-70 mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl w-fit border border-slate-200/60">
        <Filter className="w-3.5 h-3.5 text-slate-400 ml-2 shrink-0" />
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold capitalize transition-all cursor-pointer ${
              filter === tab.key
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800 hover:bg-white/60"
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.key === "pending" && pendingTotal > 0 && (
              <span className="ml-1 w-4.5 h-4.5 text-[10px] bg-amber-500 text-white rounded-full flex items-center justify-center font-extrabold px-1.5">
                {pendingTotal}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Review list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 animate-pulse">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-200 rounded w-1/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/3" />
                  <div className="h-16 bg-slate-100 rounded-xl w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-16 text-center">
          <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">No reviews in this queue</p>
          <p className="text-xs text-slate-400 mt-1">
            {filter === "pending"
              ? "All submissions have been moderated."
              : filter === "approved"
              ? "No reviews have been approved yet."
              : "No customer reviews have been submitted yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onApprove={handleToggleApprove}
              onDelete={handleDelete}
              isActing={actingId === review.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
