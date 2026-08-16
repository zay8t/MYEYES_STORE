"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  XCircle,
  Upload,
  Copy,
  Check,
  FileText,
  Printer,
  Glasses,
  Truck,
  RefreshCw,
  Loader2,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { formatPrice, cn } from "@/lib/utils";
import A4ReceiptModal, { OrderReceiptData } from "@/components/A4ReceiptModal";

export interface CustomerOrderData {
  id: string;
  orderNumber?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  shippingAddress?: string | null;
  shippingCity?: string | null;
  shippingFee?: number | null;
  paymentMethod: string;
  paymentStatus: "UNPAID" | "PENDING_VERIFICATION" | "PAID" | "FAILED" | "REFUNDED" | string;
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | string;
  totalAmount: number;
  currency?: string;
  transactionId?: string | null;
  paymentReceiptUrl?: string | null;
  paymentSenderName?: string | null;
  paymentSenderPhone?: string | null;
  verifiedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt?: string;
  items: Array<{
    id: string;
    productId: string;
    price: number;
    quantity: number;
    framePrice?: number | null;
    lensFinalPrice?: number | null;
    selectedLensName?: string | null;
    totalAmount?: number | null;
    product: {
      id: string;
      name: string;
      category: string;
      images: string;
    };
    prescription?: {
      id: string;
      lensType: string;
      odSph: number;
      odCyl: number | null;
      odAxis: number | null;
      osSph: number;
      osCyl: number | null;
      osAxis: number | null;
      pd: number;
      fileUrl: string | null;
    } | null;
  }>;
}

interface CustomerOrderTrackingViewProps {
  initialOrder: CustomerOrderData;
  isSuccessView?: boolean;
}

export default function CustomerOrderTrackingView({
  initialOrder,
  isSuccessView = false,
}: CustomerOrderTrackingViewProps) {
  const [order, setOrder] = useState<CustomerOrderData>(initialOrder);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [copiedTid, setCopiedTid] = useState(false);

  // Resubmission State
  const [resubmitTid, setResubmitTid] = useState("");
  const [resubmitSenderName, setResubmitSenderName] = useState("");
  const [resubmitSenderPhone, setResubmitSenderPhone] = useState("");
  const [resubmitReceiptUrl, setResubmitReceiptUrl] = useState("");
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);
  const [resubmitError, setResubmitError] = useState("");
  const [resubmitSuccess, setResubmitSuccess] = useState(false);

  const isCOD = order.paymentMethod === "COD";
  const isOnlinePayment = !isCOD;

  const displayOrderNo = order.orderNumber || order.id.slice(0, 8);

  const handleCopyTid = (tid: string) => {
    navigator.clipboard.writeText(tid);
    setCopiedTid(true);
    setTimeout(() => setCopiedTid(false), 2000);
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setUploadingReceipt(true);
    setResubmitError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "myeyes/payment_receipts");
      formData.append("tag", `reupload_order_${displayOrderNo}_${Date.now()}`);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || (!data.url && !data.secure_url)) {
        throw new Error(data.error || "Failed to upload receipt screenshot.");
      }

      const url = data.url || data.secure_url;
      setResubmitReceiptUrl(url);
    } catch (err) {
      console.error("Receipt upload error:", err);
      setResubmitError(err instanceof Error ? err.message : "Failed to upload receipt screenshot.");
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleResubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resubmitTid && !resubmitReceiptUrl) {
      setResubmitError("Please enter your Transaction ID (TID) or upload a receipt screenshot.");
      return;
    }

    setResubmitting(true);
    setResubmitError("");

    try {
      const res = await fetch(`/api/orders/${order.orderNumber || order.id}/resubmit-proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: resubmitTid || order.transactionId,
          paymentReceiptUrl: resubmitReceiptUrl || order.paymentReceiptUrl,
          paymentSenderName: resubmitSenderName || order.paymentSenderName,
          paymentSenderPhone: resubmitSenderPhone || order.paymentSenderPhone,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to resubmit payment proof.");
      }

      setOrder((prev) => ({
        ...prev,
        paymentStatus: "PENDING_VERIFICATION",
        rejectionReason: null,
        transactionId: resubmitTid ? resubmitTid.trim().toUpperCase() : prev.transactionId,
        paymentReceiptUrl: resubmitReceiptUrl || prev.paymentReceiptUrl,
        paymentSenderName: resubmitSenderName || prev.paymentSenderName,
        paymentSenderPhone: resubmitSenderPhone || prev.paymentSenderPhone,
      }));

      setResubmitSuccess(true);
    } catch (err) {
      console.error("Resubmit error:", err);
      setResubmitError(err instanceof Error ? err.message : "Failed to resubmit proof.");
    } finally {
      setResubmitting(false);
    }
  };

  const getFriendlyPaymentMethod = (method: string) => {
    switch (method) {
      case "COD":
        return "Cash on Delivery (COD)";
      case "BANK_TRANSFER":
        return "Bank Transfer / IBFT (Manual Verification)";
      case "EASYPAISA":
        return "EasyPaisa Direct Transfer";
      case "JAZZCASH":
        return "JazzCash Direct Transfer";
      case "RAAST":
        return "Raast Instant Transfer";
      default:
        return method.replace(/_/g, " ");
    }
  };

  const getDigitalInvoiceStatus = () => {
    if (isCOD) return "CASH ON DELIVERY (PENDING DELIVERY)";
    if (order.paymentStatus === "PAID") return "PAID (VERIFIED)";
    if (order.paymentStatus === "FAILED") return "PAYMENT FAILED / REJECTED";
    return "PENDING VERIFICATION";
  };

  // Convert for A4 Modal
  const modalReceiptData: OrderReceiptData = {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    shippingAddress: order.shippingAddress,
    shippingCity: order.shippingCity,
    paymentMethod: order.paymentMethod,
    paymentStatus: getDigitalInvoiceStatus(),
    paymentReceiptUrl: order.paymentReceiptUrl,
    shippingFee: order.shippingFee ?? 250,
    totalAmount: order.totalAmount,
    status: (order.status as "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED") || "PROCESSING",
    createdAt: order.createdAt,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      prescriptionId: item.prescription?.id || null,
      price: item.price,
      quantity: item.quantity,
      framePrice: item.framePrice ?? null,
      lensBasePriceKey: null,
      lensBasePriceValue: null,
      lensMultiplier: null,
      lensFinalPrice: item.lensFinalPrice ?? null,
      product: {
        id: item.product.id,
        name: item.product.name,
        price: item.price,
        images: item.product.images,
        category: item.product.category,
      },
      prescription: item.prescription
        ? {
            id: item.prescription.id,
            lensType: item.prescription.lensType,
            odSph: item.prescription.odSph,
            odCyl: item.prescription.odCyl,
            odAxis: item.prescription.odAxis,
            osSph: item.prescription.osSph,
            osCyl: item.prescription.osCyl,
            osAxis: item.prescription.osAxis,
            pd: item.prescription.pd,
            fileUrl: item.prescription.fileUrl,
            createdAt: order.createdAt,
          }
        : null,
    })),
  };

  return (
    <div className="min-h-screen bg-slate-50/70 py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Navigation & Header */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Store
          </Link>

          <button
            onClick={() => setIsInvoiceOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-extrabold shadow-2xs transition-all cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-slate-600" />
            <span>Digital Invoice</span>
          </button>
        </div>

        {/* Success Congratulations Header if freshly placed */}
        {isSuccessView && (
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 mb-6 shadow-xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase tracking-widest border border-emerald-500/30">
                  <Sparkles className="w-3 h-3" /> Order Confirmed
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  Thank you, {order.customerName}!
                </h1>
                <p className="text-xs text-slate-300">
                  Your order has been registered under permanent order number{" "}
                  <strong className="text-white font-mono">#{displayOrderNo}</strong>.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/10 text-right shrink-0">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Total Payable
                </span>
                <span className="text-lg sm:text-xl font-mono font-black text-emerald-400">
                  {formatPrice(order.totalAmount)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/*  LIVE SYNCHRONIZED PAYMENT STATUS BANNER                      */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="mb-6">
          {/* 1. Cash on Delivery (COD) */}
          {isCOD && (
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-xs flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
                <Truck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Payment Method:
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-slate-100 text-slate-800 border border-slate-200">
                    Cash on Delivery (COD)
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  No payment verification or receipt upload is required. Please keep the exact amount of{" "}
                  <strong className="text-slate-900">{formatPrice(order.totalAmount)}</strong> ready upon doorstep delivery.
                </p>
              </div>
            </div>
          )}

          {/* 2. Online Payment: PENDING_VERIFICATION */}
          {isOnlinePayment &&
            (order.paymentStatus === "PENDING_VERIFICATION" ||
              order.paymentStatus === "UNPAID" ||
              order.paymentStatus === "PENDING") && (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 shadow-xs flex items-start gap-4 animate-fade-in">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-300">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-200/80 text-amber-900 border border-amber-300 uppercase tracking-wider">
                      ⏳ Payment Verification Under Review
                    </span>
                  </div>
                  <p className="text-xs font-medium text-amber-950 leading-relaxed">
                    We are verifying your transfer of{" "}
                    <strong>{formatPrice(order.totalAmount)}</strong>
                    {order.transactionId ? (
                      <>
                        {" "}
                        (TID:{" "}
                        <span className="font-mono font-bold bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                          {order.transactionId}
                        </span>
                        )
                      </>
                    ) : null}
                    . Your order will enter custom optical lab production once approved by our accounts team.
                  </p>
                  {order.paymentReceiptUrl && (
                    <div className="pt-1 flex items-center gap-2">
                      <a
                        href={order.paymentReceiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:text-amber-950 underline"
                      >
                        <FileText className="w-3.5 h-3.5" /> View Submitted Receipt
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* 3. Online Payment: PAID (VERIFIED) */}
          {isOnlinePayment && order.paymentStatus === "PAID" && (
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-5 shadow-xs flex items-start gap-4 animate-fade-in">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-300">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-200 text-emerald-900 border border-emerald-300 uppercase tracking-wider">
                    ✅ Payment Verified & Received
                  </span>
                </div>
                <p className="text-xs font-medium text-emerald-950 leading-relaxed">
                  Your payment of <strong>{formatPrice(order.totalAmount)}</strong> has been verified. Your order is now in optical lab production and will be custom crafted to your exact prescription specifications.
                </p>
                {order.verifiedAt && (
                  <p className="text-[11px] text-emerald-700 font-medium">
                    Verified on: {new Date(order.verifiedAt).toLocaleString("en-PK")}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 4. Online Payment: FAILED (REJECTED) WITH 1-CLICK RESUBMISSION */}
          {isOnlinePayment && order.paymentStatus === "FAILED" && (
            <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 animate-fade-in">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 border border-rose-300">
                  <XCircle className="w-5 h-5" />
                </div>
                <div className="space-y-1 flex-1">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-200 text-rose-900 border border-rose-300 uppercase tracking-wider">
                    ⚠️ Payment Verification Unsuccessful
                  </span>
                  <p className="text-xs font-bold text-rose-950 pt-1">
                    Reason: {order.rejectionReason || "Payment receipt or TID could not be verified."}
                  </p>
                  <p className="text-xs text-rose-800 leading-relaxed">
                    Don&apos;t worry — your order #{displayOrderNo} is safely preserved. Please review and resubmit your valid Transaction ID (TID) and receipt screenshot below without placing a new order.
                  </p>
                </div>
              </div>

              {/* Resubmit Proof Form */}
              <form
                onSubmit={handleResubmitProof}
                className="bg-white rounded-xl border border-rose-200 p-4 sm:p-5 space-y-4 shadow-2xs"
              >
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4 text-rose-600" />
                  Resubmit Valid Payment Proof
                </h3>

                {resubmitError && (
                  <div className="p-3 bg-rose-100 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium">
                    {resubmitError}
                  </div>
                )}

                {resubmitSuccess && (
                  <div className="p-3 bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Payment proof successfully updated. Your status is now under review!
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Correct Transaction ID (TID) *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 123456789012"
                      value={resubmitTid}
                      onChange={(e) => setResubmitTid(e.target.value.toUpperCase())}
                      className="w-full text-xs font-mono font-bold border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Sender Account Title / Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Muhammad Ali"
                      value={resubmitSenderName}
                      onChange={(e) => setResubmitSenderName(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Sender Mobile Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 03001234567"
                      value={resubmitSenderPhone}
                      onChange={(e) => setResubmitSenderPhone(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Upload New Receipt Screenshot
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex-1 border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-xl p-3 text-center cursor-pointer transition-colors bg-slate-50">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFileUpload(f);
                        }}
                      />
                      <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-600">
                        {uploadingReceipt ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
                            <span>Uploading screenshot...</span>
                          </>
                        ) : resubmitReceiptUrl ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-600" />
                            <span className="text-emerald-700">Screenshot Attached! Click to change</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 text-slate-500" />
                            <span>Select Screenshot (JPG, PNG)</span>
                          </>
                        )}
                      </div>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={resubmitting || uploadingReceipt}
                  className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-extrabold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                >
                  {resubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Resubmitting Proof...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Submit Payment Proof for Verification</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/*  ORDER OVERVIEW & ITEM DETAILS                                */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Column: Items & Prescription */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Products Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Order Items ({order.items.length})
              </h2>

              <div className="divide-y divide-slate-100">
                {order.items.map((item) => (
                  <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                      <Glasses className="w-7 h-7 text-slate-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-extrabold text-slate-900 truncate">
                          {item.product?.name || "Eyewear Frame"}
                        </h3>
                        <span className="text-sm font-mono font-bold text-slate-900 shrink-0">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 mt-0.5">
                        Qty: {item.quantity} · Unit Price: {formatPrice(item.price)}
                      </p>

                      {item.prescription && (
                        <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                          <p className="font-bold text-slate-800">
                            Lens: {item.prescription.lensType} (PD: {item.prescription.pd} mm)
                          </p>
                          <p className="font-mono text-[11px] text-slate-600">
                            OD: SPH {item.prescription.odSph.toFixed(2)} | CYL {item.prescription.odCyl?.toFixed(2) || "0.00"} | AXIS {item.prescription.odAxis ? `${item.prescription.odAxis}°` : "-"}
                          </p>
                          <p className="font-mono text-[11px] text-slate-600">
                            OS: SPH {item.prescription.osSph.toFixed(2)} | CYL {item.prescription.osCyl?.toFixed(2) || "0.00"} | AXIS {item.prescription.osAxis ? `${item.prescription.osAxis}°` : "-"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Progress Timeline */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Fulfillment & Production Progress
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Step 1</span>
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Order Placed
                  </span>
                </div>

                <div className={cn(
                  "p-3 rounded-xl border",
                  order.paymentStatus === "PAID" || isCOD
                    ? "bg-emerald-50 border-emerald-200"
                    : order.paymentStatus === "FAILED"
                    ? "bg-rose-50 border-rose-200"
                    : "bg-amber-50 border-amber-200"
                )}>
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Step 2</span>
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                    {order.paymentStatus === "PAID" || isCOD ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                    )}
                    {isCOD ? "COD Confirmed" : order.paymentStatus === "PAID" ? "Payment Paid" : "Verification"}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Step 3</span>
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                    <Glasses className="w-3.5 h-3.5 text-slate-600" /> Lab Production
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Step 4</span>
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                    <Truck className="w-3.5 h-3.5 text-slate-600" /> Dispatch
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Column: Summary & Invoice Info */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Payment Summary */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Payment Summary
              </h2>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Payment Method:</span>
                  <span className="font-bold text-slate-900 text-right">
                    {getFriendlyPaymentMethod(order.paymentMethod)}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Digital Invoice Status:</span>
                  <span className={cn(
                    "font-extrabold text-right text-[11px] px-2 py-0.5 rounded-md",
                    order.paymentStatus === "PAID"
                      ? "bg-emerald-100 text-emerald-800"
                      : order.paymentStatus === "FAILED"
                      ? "bg-rose-100 text-rose-800"
                      : "bg-amber-100 text-amber-800"
                  )}>
                    {getDigitalInvoiceStatus()}
                  </span>
                </div>

                {order.transactionId && (
                  <div className="flex justify-between text-slate-600 items-center">
                    <span>Submitted TID:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                        {order.transactionId}
                      </span>
                      <button
                        onClick={() => handleCopyTid(order.transactionId!)}
                        className="p-1 hover:text-slate-900 text-slate-400 transition-colors cursor-pointer"
                        title="Copy TID"
                      >
                        {copiedTid ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                <div className="border-t border-slate-100 pt-2 flex justify-between text-slate-600">
                  <span>Delivery Fee:</span>
                  <span className="font-mono font-medium">{formatPrice(order.shippingFee || 250)}</span>
                </div>

                <div className="border-t border-slate-900 pt-2 flex justify-between text-sm font-black text-slate-950">
                  <span>Grand Total:</span>
                  <span className="font-mono text-emerald-600">{formatPrice(order.totalAmount)}</span>
                </div>
              </div>

              <button
                onClick={() => setIsInvoiceOpen(true)}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>View & Print Invoice</span>
              </button>
            </div>

            {/* Delivery Address Details */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Delivery Destination
              </h2>
              <div className="text-xs text-slate-700 space-y-1">
                <p className="font-bold text-slate-900">{order.customerName}</p>
                <p>{order.customerEmail}</p>
                {order.customerPhone && <p>{order.customerPhone}</p>}
                <p className="pt-1 text-slate-600">
                  {order.shippingAddress || "Standard Address"}, {order.shippingCity || ""}
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Interactive A4 Invoice Modal */}
      {isInvoiceOpen && (
        <A4ReceiptModal
          order={modalReceiptData}
          onClose={() => setIsInvoiceOpen(false)}
        />
      )}
    </div>
  );
}
