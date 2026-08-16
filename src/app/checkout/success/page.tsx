"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import CustomerOrderTrackingView, { CustomerOrderData } from "@/components/customer/CustomerOrderTrackingView";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId") || searchParams.get("orderNumber");
  const [order, setOrder] = useState<CustomerOrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    fetch(`/api/orders/${encodeURIComponent(orderId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.order) {
          // If order has an orderNumber, redirect to cleaner URL /order-success/[orderNumber]
          if (data.order.orderNumber) {
            router.replace(`/order-success/${data.order.orderNumber}`);
            return;
          }
          setOrder(data.order);
        } else {
          setError(data.error || "Order details not found.");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load order:", err);
        setError("Failed to load order details.");
        setLoading(false);
      });
  }, [orderId, router]);

  if (!orderId) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-slate-500 font-bold">Order identifier is missing.</p>
        <Link
          href="/"
          className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-black transition-colors"
        >
          Return Home
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
          Loading order details...
        </p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-20 space-y-3">
        <p className="text-sm text-rose-600 font-bold">{error || "Order not found."}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-black transition-colors"
        >
          Return to Catalog
        </Link>
      </div>
    );
  }

  return <CustomerOrderTrackingView initialOrder={order} isSuccessView={true} />;
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
