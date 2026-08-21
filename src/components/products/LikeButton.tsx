"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  productId: string;
  initialLiked?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export default function LikeButton({
  productId,
  initialLiked = false,
  size = "md",
  className,
}: LikeButtonProps) {
  const { user, refetch } = useAuth();
  const [liked, setLiked] = useState(
    initialLiked || (user?.wishedProductIds?.includes(productId) ?? false)
  );
  const [isPending, setIsPending] = useState(false);

  const handleToggle = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (isPending) return;

      // Optimistic update
      setLiked((prev) => !prev);
      setIsPending(true);

      if (!user) {
        // Guest: persist to localStorage
        try {
          const stored = localStorage.getItem("myeyes_guest_wishlist");
          const ids: string[] = stored ? JSON.parse(stored) : [];
          const newLiked = !liked;
          const updated = newLiked
            ? [...new Set([...ids, productId])]
            : ids.filter((id) => id !== productId);
          localStorage.setItem("myeyes_guest_wishlist", JSON.stringify(updated));
        } catch {}
        setIsPending(false);
        return;
      }

      try {
        const res = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });

        if (!res.ok) {
          // Revert on error
          setLiked((prev) => !prev);
        } else {
          await refetch();
        }
      } catch {
        setLiked((prev) => !prev);
      } finally {
        setIsPending(false);
      }
    },
    [isPending, liked, productId, user, refetch]
  );

  const sizeClasses = size === "sm"
    ? "w-8 h-8"
    : "w-9 h-9";

  return (
    <motion.button
      id={`like-btn-${productId}`}
      onClick={handleToggle}
      whileTap={{ scale: 0.82 }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={liked}
      className={cn(
        "relative rounded-full flex items-center justify-center transition-all duration-200 shadow-xs z-10 cursor-pointer",
        liked
          ? "bg-rose-50/80 border border-rose-200 text-rose-500"
          : "bg-white/95 backdrop-blur-sm border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300",
        sizeClasses,
        className
      )}
    >
      <Heart
        className={cn(
          "w-4 h-4 transition-all duration-200",
          liked ? "fill-rose-500 text-rose-500" : "fill-none"
        )}
      />

      {/* Guest prompt tooltip */}
      {!user && (
        <span className="sr-only">Sign in to save to wishlist</span>
      )}
    </motion.button>
  );
}
