"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

interface OrderDetail {
  id: string;
  orderNumber?: string | null;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((data: OrderDetail[]) => {
        const found = data.find((o) => o.id === orderId);
        if (found) setOrder(found);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [orderId]);

  if (!orderId) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-slate-500">Order ID is missing.</p>
        <Link
          href="/"
          className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-black transition-colors"
        >
          Return Home
        </Link>
      </div>
    );
  }

  const getFriendlyPaymentName = (method: string) => {
    switch (method) {
      case "COD":
        return "Cash on Delivery (COD)";
      case "EASYPAISA":
        return "EasyPaisa / JazzCash Direct Transfer";
      case "ALFALAH":
        return "Bank Alfalah Islamic IBFT";
      default:
        return method;
    }
  };

  return (
    <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden p-6 sm:p-8 space-y-6">
      {/* Header checkmark */}
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
          <Check className="w-6 h-6 stroke-[3]" />
        </div>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Order Placed Successfully</h1>
        <p className="text-xs text-slate-400">
          Thank you for choosing My Eyes. Your order has been placed and is pending verification.
        </p>
      </div>

      {loading ? (
        <div className="p-10 text-center text-slate-400 font-medium text-xs animate-pulse">
          Loading order details...
        </div>
      ) : order ? (
        <div className="space-y-4">
          {/* Order No Tag */}
          <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between shadow-md">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Permanent Customer Order Number
              </span>
              <span className="text-lg font-mono font-extrabold text-white tracking-widest">
                Order No: {order.orderNumber || "Processing"}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-1 rounded">
              Ref: {order.id.slice(0, 8)}
            </span>
          </div>

          {/* Receipt summary */}
          <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200/80 text-xs space-y-2.5">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Customer</span>
              <span className="font-bold text-slate-900">{order.customerName}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Email Address</span>
              <span className="font-semibold text-slate-900">{order.customerEmail}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Payment Option</span>
              <span className="font-bold text-slate-900">{getFriendlyPaymentName(order.paymentMethod)}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-slate-500 font-medium">Grand Total (inc. Shipping)</span>
              <span className="font-extrabold text-slate-900">{formatPrice(order.totalAmount)}</span>
            </div>
          </div>

          <div className="p-3 bg-amber-50/40 border border-amber-100 text-[10px] rounded-xl text-amber-800 leading-relaxed font-medium">
            <strong>Optical Lab Routing:</strong> If your order contains frames with prescription details, these have been routed directly to our lens technician lab for custom fitting.
          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-xs text-slate-400 font-medium">
          Order saved successfully. Reference ID: <span className="font-mono font-bold text-slate-900">{orderId}</span>
        </div>
      )}

      {/* Action button */}
      <div className="pt-2">
        <Link
          href="/"
          className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
        >
          Continue Shopping
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="text-center p-10 text-slate-400 text-xs font-medium">
            Loading success page...
          </div>
        }
      >
        <SuccessContent />
      </Suspense>
    </div>
  );
}
