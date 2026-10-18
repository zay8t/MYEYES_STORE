"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Star, CheckCircle2, AlertCircle, MessageSquarePlus } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  comment: string;
  userName: string;
  createdAt: string;
}

export default function ProductReviewSection({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Form states
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchReviews = useCallback(async () => {
    if (!productId) return;
    try {
      const res = await fetch(`/api/products/${productId}/reviews`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews || []);
        setAverageRating(Number(data.averageRating) || 0);
        setTotalReviews(Number(data.totalReviews) || 0);
      }
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !comment.trim()) {
      setErrorMsg("Please fill in both your name and review comment.");
      return;
    }
    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          comment: comment.trim(),
          userName: userName.trim(),
          userEmail: userEmail.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(
          data.message ||
            "Thank you! Your review has been submitted and is pending moderation."
        );
        setUserName("");
        setUserEmail("");
        setComment("");
        setRating(5);
      } else {
        setErrorMsg(data.error || "Failed to submit review.");
      }
    } catch (err) {
      console.error("Review submission error:", err);
      setErrorMsg("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const roundedAvg = Math.min(5, Math.max(0, Math.round(averageRating)));

  return (
    <section className="mt-16 border-t border-slate-200/80 pt-12 space-y-10" aria-label="Customer Reviews">
      {/* Header & Stats Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-amber-600">
            Customer Feedback
          </span>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0B132B] tracking-tight mt-1">
            Verified Customer Reviews
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">
            Real feedback from verified MY EYES optical customers across Pakistan.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 border border-slate-200/90 px-6 py-4 rounded-2xl shadow-xs self-start md:self-auto">
          <div className="text-4xl font-black text-[#0B132B] leading-none">
            {averageRating > 0 ? averageRating.toFixed(1) : "0.0"}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-[#F59E0B]">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= roundedAvg
                      ? "fill-[#F59E0B] text-[#F59E0B]"
                      : "text-slate-200 fill-slate-200"
                  }`}
                />
              ))}
            </div>
            <div className="text-xs text-slate-500 font-medium">
              {totalReviews} {totalReviews === 1 ? "Verified Review" : "Verified Reviews"}
            </div>
          </div>
        </div>
      </div>

      {/* Grid Layout: Review Form + Approved Reviews List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Submission Form */}
        <div className="lg:col-span-1 bg-slate-50/90 border border-slate-200 p-6 sm:p-7 rounded-3xl space-y-5 h-fit shadow-xs">
          <div className="flex items-center gap-2 text-[#0B132B]">
            <MessageSquarePlus className="w-5 h-5 text-amber-600" />
            <h4 className="font-bold text-base">Write a Review</h4>
          </div>

          {successMsg && (
            <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3.5 rounded-xl font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Rating <span className="text-rose-500">*</span>
              </label>
              <div
                className="flex items-center space-x-1"
                onMouseLeave={() => setHoverRating(null)}
              >
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = hoverRating !== null ? star <= hoverRating : star <= rating;
                  return (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      className="p-1 -ml-1 transition-transform hover:scale-110 cursor-pointer focus:outline-none"
                      aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          active
                            ? "fill-[#F59E0B] text-[#F59E0B]"
                            : "text-slate-300 fill-slate-100"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Your Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Hamza Khan"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
                className="w-full border border-slate-200 bg-white px-3.5 py-2.5 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-[#F59E0B] focus:border-transparent outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Email Address <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="email"
                placeholder="name@example.com"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full border border-slate-200 bg-white px-3.5 py-2.5 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-[#F59E0B] focus:border-transparent outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Review &amp; Experience <span className="text-rose-500">*</span>
              </label>
              <textarea
                placeholder="How is the frame quality, lens fit, and durability?"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
                rows={4}
                className="w-full border border-slate-200 bg-white px-3.5 py-2.5 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-[#F59E0B] focus:border-transparent outline-none transition-all placeholder:text-slate-400 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#0B132B] hover:bg-slate-800 active:scale-[0.99] text-white py-3 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all shadow-md disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting..." : "Submit Review for Approval"}
            </button>
            <p className="text-[10px] text-slate-400 text-center">
              Reviews are moderated by our optical team before appearing publicly.
            </p>
          </form>
        </div>

        {/* Right Column: Live Approved Reviews List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <h4 className="font-bold text-[#0B132B] text-base">
              Customer Feedback ({reviews.length})
            </h4>
            {reviews.length > 0 && (
              <span className="text-xs text-slate-400">
                Sorted by most recent
              </span>
            )}
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">
              <div className="inline-block animate-spin w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full mb-2" />
              <p>Loading customer reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-10 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-700">
                No approved reviews yet for this frame.
              </p>
              <p className="text-xs text-slate-400">
                Be the first customer to share your experience with this design!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((rev) => (
                <article
                  key={rev.id}
                  className="bg-white border border-slate-200/90 p-5 rounded-2xl space-y-3 shadow-xs transition-shadow hover:shadow-sm"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-[#0B132B] text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                        {rev.userName ? rev.userName.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div>
                        <span className="font-bold text-sm text-[#0B132B] block">
                          {rev.userName}
                        </span>
                        <div className="flex items-center gap-1 text-[#F59E0B]">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= rev.rating
                                  ? "fill-[#F59E0B] text-[#F59E0B]"
                                  : "text-slate-200 fill-slate-200"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <time className="text-xs text-slate-400 shrink-0">
                      {new Date(rev.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </time>
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed pt-1">
                    {rev.comment}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
