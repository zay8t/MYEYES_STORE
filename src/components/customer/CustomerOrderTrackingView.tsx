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
  Download,
  Glasses,
  Truck,
  Loader2,
  ArrowLeft,
  Sparkles,
  Smartphone,
  ShieldCheck,
  Package,
  MapPin,
  CreditCard,
  Building2,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { formatPrice, cn, formatDiopter } from "@/lib/utils";
import { formatOrderNumber } from "@/lib/order-number";
import OrderReceiptModal, { OrderReceiptData } from "@/components/receipt/OrderReceiptModal";

function getFirstImage(imgData?: string | null): string {
  if (!imgData) return "/placeholder-frame.png";
  if (imgData.startsWith("[")) {
    try {
      const parsed = JSON.parse(imgData);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
    } catch {
      // Fallback
    }
  }
  if (imgData.includes(",")) {
    return imgData.split(",")[0].trim();
  }
  return imgData;
}

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
    lensPackageName?: string | null;
    lensPrice?: number | null;
    lensFinalPrice?: number | null;
    selectedLensName?: string | null;
    lensType?: string | null;
    lensName?: string | null;
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
  const [showUploadAdvance, setShowUploadAdvance] = useState(false);

  // Resubmission State for Online Payments & Advance Deposits
  const [resubmitTid, setResubmitTid] = useState("");
  const [resubmitSenderName, setResubmitSenderName] = useState("");
  const [resubmitSenderPhone, setResubmitSenderPhone] = useState("");
  const [resubmitReceiptUrl, setResubmitReceiptUrl] = useState("");
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);
  const [resubmitError, setResubmitError] = useState("");
  const [resubmitSuccess, setResubmitSuccess] = useState(false);

  const isCOD = order.paymentMethod === "COD";
  const displayOrderNo = formatOrderNumber(order);

  // Date Formatting
  const orderDate = new Date(order.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const orderTime = new Date(order.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Calculate Frame & Lens Totals
  const totalFrameCost = order.items.reduce((sum, item) => {
    const q = typeof item.quantity === "number" ? item.quantity : parseInt(String(item.quantity || 1), 10) || 1;
    const rawPrice = typeof item.price === "number" ? item.price : parseFloat(String(item.price || 0)) || 0;
    const frameCost = item.framePrice !== null && item.framePrice !== undefined
      ? Number(item.framePrice)
      : (item.prescription ? (rawPrice > (item.lensPrice ?? item.lensFinalPrice ?? 0) ? rawPrice - (item.lensPrice ?? item.lensFinalPrice ?? 0) : 0) : rawPrice);
    return sum + (frameCost * q);
  }, 0);

  const totalLensCost = order.items.reduce((sum, item) => {
    const q = typeof item.quantity === "number" ? item.quantity : parseInt(String(item.quantity || 1), 10) || 1;
    const lensCost = item.lensPrice !== null && item.lensPrice !== undefined
      ? Number(item.lensPrice)
      : (item.lensFinalPrice !== null && item.lensFinalPrice !== undefined ? Number(item.lensFinalPrice) : 0);
    return sum + (lensCost * q);
  }, 0);

  const shippingFee = order.shippingFee !== undefined && order.shippingFee !== null ? order.shippingFee : 250;

  // Conditional Advance Logic (25% vs 40%)
  const isProgressive = order.items.some((item) => {
    const rawLensType =
      item.lensType ||
      item.prescription?.lensType ||
      item.selectedLensName ||
      item.lensName ||
      "";
    const productName = item.product?.name || "";
    const combined = `${rawLensType} ${productName}`.toLowerCase();
    return (
      combined.includes("progressive") ||
      combined.includes("presbyopia") ||
      combined.includes("bifocal")
    );
  });

  const advancePercentage = isProgressive ? 0.4 : 0.25;
  const advancePercentageLabel = isProgressive ? "40%" : "25%";
  const advanceRequired = Math.round(order.totalAmount * advancePercentage);
  const remainingAtDoorstep = order.totalAmount - advanceRequired;

  const isDepositVerified =
    order.paymentStatus === "PAID" ||
    order.paymentStatus === "PAID (VERIFIED)" ||
    !!order.verifiedAt;

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
          transactionId: resubmitTid ? resubmitTid.trim().toUpperCase() : order.transactionId,
          paymentReceiptUrl: resubmitReceiptUrl || order.paymentReceiptUrl,
          paymentSenderName: resubmitSenderName ? resubmitSenderName.trim() : order.paymentSenderName,
          paymentSenderPhone: resubmitSenderPhone ? resubmitSenderPhone.trim() : order.paymentSenderPhone,
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
        paymentSenderName: resubmitSenderName ? resubmitSenderName.trim() : prev.paymentSenderName,
        paymentSenderPhone: resubmitSenderPhone ? resubmitSenderPhone.trim() : prev.paymentSenderPhone,
      }));

      setResubmitSuccess(true);
      setShowUploadAdvance(false);
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
        return "Bank Transfer / IBFT";
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
    if (isDepositVerified) return "PAID (VERIFIED)";
    if (isCOD) return `COD (${advancePercentageLabel} ADVANCE REQUIRED)`;
    if (order.paymentStatus === "FAILED") return "PAYMENT FAILED / REJECTED";
    return "PENDING VERIFICATION";
  };

  // Convert for Single-Page A4 Modal
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
    shippingFee: shippingFee,
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
      lensPackageName: item.lensPackageName || item.selectedLensName || item.lensName || item.prescription?.lensType || null,
      lensPrice: item.lensPrice ?? item.lensFinalPrice ?? null,
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

  const whatsappMessage = encodeURIComponent(
    `Assalam-o-Alaikum! I have placed Order #${displayOrderNo} on My Eyes.\n\nCustomer: ${order.customerName}\nOrder Total: Rs. ${order.totalAmount.toLocaleString()}/-\n${advancePercentageLabel} Advance: Rs. ${advanceRequired.toLocaleString()}/-\nRemaining on Delivery: Rs. ${remainingAtDoorstep.toLocaleString()}/-\n\nHere is my advance deposit payment confirmation.`
  );

  // 4-Step Progress Calculation
  const isStep1Done = true; // Order Placed
  const isStep2Done = isDepositVerified || (!isCOD && order.paymentStatus === "PAID");
  const isStep3Done = order.status === "SHIPPED" || order.status === "DELIVERED";
  const isStep4Done = order.status === "DELIVERED";

  const isStep2Active = !isStep2Done;
  const isStep3Active = isStep2Done && (order.status === "PROCESSING" || order.status === "PENDING");
  const isStep4Active = order.status === "SHIPPED";

  return (
    <div className="min-h-screen bg-slate-50/60 py-8 px-4 sm:px-6 text-slate-900 selection:bg-amber-100 selection:text-amber-900">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ─────────────────────────────────────────────────────────────
            1. TOP BAR (BREADCRUMB + ACTION BUTTONS)
        ───────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Store</span>
          </Link>

          <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-end">
            <button
              onClick={() => setIsInvoiceOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>View &amp; Print Invoice</span>
            </button>

            <button
              onClick={() => window.open(`/api/orders/${order.id}/pdf`, "_blank")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            2. ORDER HEADER BANNER (CLEAN WHITE CARD)
        ───────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-mono">
                  Order #{displayOrderNo}
                </span>
                {isSuccessView && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>Order Confirmed</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Placed on <strong className="text-slate-800 font-semibold">{orderDate}</strong> at {orderTime} • Customer:{" "}
                <strong className="text-slate-800 font-semibold">{order.customerName}</strong>
              </p>
            </div>

            {/* Right: Status Badge + Grand Total */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-100">
              <div>
                {isDepositVerified ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>In Production</span>
                  </span>
                ) : order.status === "SHIPPED" ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    <Truck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Dispatched</span>
                  </span>
                ) : order.status === "DELIVERED" ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Delivered</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>{isCOD ? "Awaiting Deposit" : "Order Placed"}</span>
                  </span>
                )}
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Grand Total
                </span>
                <span className="text-xl sm:text-2xl font-black text-[#ff7a00] font-mono">
                  Rs. {order.totalAmount.toLocaleString()}/-
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            3. TWO-COLUMN CONTENT GRID (60% / 40%)
        ───────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ═══════════════════════════════════════════════════════════
              LEFT COLUMN (MAIN DETAILS - ~60% WIDTH)
          ═══════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-7 space-y-6">

            {/* A. 4-Step Order Progress Stepper */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-4">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Fulfillment &amp; Lab Production Stepper
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative">
                {/* Step 1: Order Placed */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Step 1</span>
                  </div>
                  <p className="text-xs font-bold text-slate-900">Order Placed</p>
                  <p className="text-[10px] text-slate-500">Registered in system</p>
                </div>

                {/* Step 2: Deposit Confirmed */}
                <div
                  className={cn(
                    "p-3 rounded-xl border space-y-1.5 text-center sm:text-left transition-all",
                    isStep2Done
                      ? "bg-emerald-50/50 border-emerald-200 text-slate-900"
                      : isStep2Active
                      ? "bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/30"
                      : "bg-slate-50 border-slate-200/70 text-slate-400"
                  )}
                >
                  <div className="flex items-center justify-center sm:justify-start gap-1.5">
                    {isStep2Done ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                    )}
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider", isStep2Done ? "text-emerald-700" : "text-amber-700")}>
                      Step 2
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-900">Deposit Confirmed</p>
                  <p className="text-[10px] text-slate-500">
                    {isStep2Done ? "Verified by optician" : "Advance required"}
                  </p>
                </div>

                {/* Step 3: Lab Cutting */}
                <div
                  className={cn(
                    "p-3 rounded-xl border space-y-1.5 text-center sm:text-left transition-all",
                    isStep3Done
                      ? "bg-emerald-50/50 border-emerald-200 text-slate-900"
                      : isStep3Active
                      ? "bg-blue-50/70 border-blue-300 ring-2 ring-blue-400/30"
                      : "bg-slate-50 border-slate-200/70 text-slate-400"
                  )}
                >
                  <div className="flex items-center justify-center sm:justify-start gap-1.5">
                    {isStep3Done ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Glasses className={cn("w-4 h-4", isStep3Active ? "text-blue-600 animate-pulse" : "text-slate-400")} />
                    )}
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider", isStep3Done ? "text-emerald-700" : isStep3Active ? "text-blue-700" : "text-slate-400")}>
                      Step 3
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-900">Lab Cutting</p>
                  <p className="text-[10px] text-slate-500">
                    {isStep3Done ? "Fitted & QC checked" : isStep3Active ? "Fitting custom lenses" : "Awaiting deposit"}
                  </p>
                </div>

                {/* Step 4: Dispatched */}
                <div
                  className={cn(
                    "p-3 rounded-xl border space-y-1.5 text-center sm:text-left transition-all",
                    isStep4Done
                      ? "bg-emerald-50/50 border-emerald-200 text-slate-900"
                      : isStep4Active
                      ? "bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-400/30"
                      : "bg-slate-50 border-slate-200/70 text-slate-400"
                  )}
                >
                  <div className="flex items-center justify-center sm:justify-start gap-1.5">
                    {isStep4Done ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Truck className={cn("w-4 h-4", isStep4Active ? "text-indigo-600 animate-pulse" : "text-slate-400")} />
                    )}
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider", isStep4Done ? "text-emerald-700" : isStep4Active ? "text-indigo-700" : "text-slate-400")}>
                      Step 4
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-900">Dispatched</p>
                  <p className="text-[10px] text-slate-500">
                    {isStep4Done ? "Delivered to door" : isStep4Active ? "In courier transit" : "Final step"}
                  </p>
                </div>
              </div>
            </div>

            {/* B. Purchased Items Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-4">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Purchased Items ({order.items.length})
              </h2>

              <div className="divide-y divide-slate-100">
                {order.items.map((item) => {
                  const frameCost = item.framePrice !== null && item.framePrice !== undefined
                    ? Number(item.framePrice)
                    : (item.prescription ? (item.price > (item.lensPrice ?? item.lensFinalPrice ?? 0) ? item.price - (item.lensPrice ?? item.lensFinalPrice ?? 0) : null) : Number(item.price));

                  const lensCost = item.lensPrice !== null && item.lensPrice !== undefined
                    ? Number(item.lensPrice)
                    : (item.lensFinalPrice !== null && item.lensFinalPrice !== undefined ? Number(item.lensFinalPrice) : null);

                  const humanLensName = item.lensPackageName ||
                    item.selectedLensName ||
                    item.lensName ||
                    item.prescription?.lensType ||
                    (item.prescription ? "Standard Prescription Lenses" : null);

                  const visionType = (item.prescription?.lensType?.toLowerCase().includes("progressive") || humanLensName?.toLowerCase().includes("progressive"))
                    ? "Progressive"
                    : (item.prescription ? "Single Vision" : null);

                  const itemFrameImg = getFirstImage(item.product?.images);

                  return (
                    <div key={item.id} className="py-4 first:pt-0 last:pb-0 space-y-3">
                      <div className="flex items-start gap-3.5">
                        <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center p-1">
                          {itemFrameImg ? (
                            <img
                              src={itemFrameImg}
                              alt={item.product?.name || "Frame"}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = "/placeholder-frame.png";
                              }}
                            />
                          ) : (
                            <Glasses className="w-6 h-6 text-slate-400" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="text-sm font-bold text-slate-900 truncate">
                                {item.product?.name || "Eyewear Frame"}
                              </h3>
                              {frameCost !== null && (
                                <p className="text-xs text-slate-500 font-medium">
                                  Frame: {formatPrice(frameCost)} · Qty: {item.quantity}
                                </p>
                              )}
                            </div>
                            <span className="text-xs font-mono font-bold text-slate-900 shrink-0">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                          </div>

                          {/* Lens Package Badge */}
                          {humanLensName && (
                            <div className="mt-2 inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-xs">
                              {visionType && (
                                <span className="font-extrabold text-[9px] uppercase tracking-wider text-amber-800 bg-amber-200/60 px-1.5 py-0.5 rounded">
                                  {visionType}
                                </span>
                              )}
                              <span className="font-semibold text-slate-900 text-[11px] truncate max-w-[220px] sm:max-w-xs">
                                {humanLensName}
                              </span>
                              {lensCost !== null && (
                                <span className="text-slate-600 font-mono text-[11px] ml-auto">
                                  {formatPrice(lensCost)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Optical Prescription Parameters Card */}
                      {item.prescription && (
                        <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-800 flex items-center gap-1.5">
                              <Glasses className="w-3.5 h-3.5 text-amber-600" />
                              Prescription Specifications
                            </span>
                            <span className="font-mono text-[11px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                              PD: {item.prescription.pd} mm
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                            {/* OD - Right Eye */}
                            <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 space-y-0.5">
                              <span className="text-[10px] font-bold text-slate-400 font-sans block">OD (Right Eye)</span>
                              <p className="text-slate-900 font-semibold">
                                SPH: <strong className="text-slate-950">{formatDiopter(item.prescription.odSph)}</strong> · CYL:{" "}
                                <strong className="text-slate-950">{formatDiopter(item.prescription.odCyl)}</strong> · Axis:{" "}
                                <strong>{item.prescription.odAxis ? `${item.prescription.odAxis}°` : "-"}</strong>
                              </p>
                            </div>

                            {/* OS - Left Eye */}
                            <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 space-y-0.5">
                              <span className="text-[10px] font-bold text-slate-400 font-sans block">OS (Left Eye)</span>
                              <p className="text-slate-900 font-semibold">
                                SPH: <strong className="text-slate-950">{formatDiopter(item.prescription.osSph)}</strong> · CYL:{" "}
                                <strong className="text-slate-950">{formatDiopter(item.prescription.osCyl)}</strong> · Axis:{" "}
                                <strong>{item.prescription.osAxis ? `${item.prescription.osAxis}°` : "-"}</strong>
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* C. Advance Payment Card (If Deposit Required or Verified) */}
            {isDepositVerified ? (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 shadow-xs flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-900">
                    Advance Deposit Verified
                  </h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Your advance payment has been confirmed. Your custom prescription lenses are currently in precision lab cutting.
                  </p>
                </div>
              </div>
            ) : isCOD ? (
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                      {advancePercentageLabel} Advance Required for Custom Lenses
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Awaiting Deposit
                  </span>
                </div>

                {/* Two side-by-side metric tiles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                      Advance Payable ({advancePercentageLabel})
                    </span>
                    <p className="text-lg font-black text-amber-950 font-mono">
                      Rs. {advanceRequired.toLocaleString()}/-
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Payable on Delivery
                    </span>
                    <p className="text-lg font-black text-slate-900 font-mono">
                      Rs. {remainingAtDoorstep.toLocaleString()}/-
                    </p>
                  </div>
                </div>

                {/* Account Details */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-900">EasyPaisa / JazzCash / Raast:</span>{" "}
                    <span className="font-mono font-bold text-slate-950">03006694928</span>{" "}
                    <span className="text-slate-500 font-medium">(MUHAMMAD AASIM MUSHTAQ)</span>
                  </div>
                  <button
                    onClick={() => handleCopyTid("03006694928")}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 cursor-pointer transition-colors shrink-0"
                  >
                    {copiedTid ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{copiedTid ? "Copied!" : "Copy"}</span>
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch gap-2.5 pt-1">
                  <a
                    href={`https://wa.me/923390103262?text=${whatsappMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold transition shadow-xs"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Send Deposit Slip via WhatsApp</span>
                  </a>

                  <button
                    onClick={() => setShowUploadAdvance(!showUploadAdvance)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-slate-600" />
                    <span>{showUploadAdvance ? "Hide Upload" : "Upload Receipt Online"}</span>
                  </button>
                </div>

                {/* Upload Form (If Toggled) */}
                {showUploadAdvance && (
                  <form onSubmit={handleResubmitProof} className="bg-slate-50/80 rounded-xl border border-slate-200 p-4 space-y-3 mt-2">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                      Submit Advance Deposit Proof
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                          Transaction ID (TID)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 123456789012"
                          value={resubmitTid}
                          onChange={(e) => setResubmitTid(e.target.value.toUpperCase())}
                          className="w-full text-xs font-mono font-bold border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-slate-900"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                          Sender Account Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Muhammad Ali"
                          value={resubmitSenderName}
                          onChange={(e) => setResubmitSenderName(e.target.value)}
                          className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-slate-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                        Screenshot of Payment
                      </label>
                      <label className="flex items-center justify-center gap-2 border border-dashed border-slate-300 hover:border-slate-400 rounded-lg p-2.5 text-center cursor-pointer bg-white transition">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleFileUpload(f);
                          }}
                        />
                        {uploadingReceipt ? (
                          <span className="text-xs text-slate-600 font-medium">Uploading...</span>
                        ) : resubmitReceiptUrl ? (
                          <span className="text-xs text-emerald-700 font-bold">Screenshot Attached ✓</span>
                        ) : (
                          <span className="text-xs text-slate-600 font-medium">Select Image (JPG, PNG)</span>
                        )}
                      </label>
                    </div>

                    {resubmitError && (
                      <p className="text-xs text-rose-600 font-medium">{resubmitError}</p>
                    )}

                    <button
                      type="submit"
                      disabled={resubmitting || uploadingReceipt}
                      className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                    >
                      {resubmitting ? "Submitting..." : "Submit Proof"}
                    </button>
                  </form>
                )}

                {resubmitSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Deposit proof submitted! Our team will verify it shortly.</span>
                  </div>
                )}
              </div>
            ) : null}

          </div>

          {/* ═══════════════════════════════════════════════════════════
              RIGHT COLUMN (SIDEBAR SUMMARY - ~40% WIDTH)
          ═══════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-5 space-y-6">

            {/* A. Payment & Total Breakdown Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                  Financial Summary
                </h3>
                <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                  {getFriendlyPaymentMethod(order.paymentMethod)}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Frame(s) Subtotal:</span>
                  <span className="font-mono font-medium text-slate-900">
                    {formatPrice(totalFrameCost)}
                  </span>
                </div>

                {totalLensCost > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Lens(es) Subtotal:</span>
                    <span className="font-mono font-medium text-slate-900">
                      {formatPrice(totalLensCost)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>Standard Shipping:</span>
                  <span className="font-mono font-medium text-slate-900">
                    {formatPrice(shippingFee)}
                  </span>
                </div>

                {/* Conditional advance breakdown for COD */}
                {isCOD && !isDepositVerified && (
                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/70 space-y-1 my-2">
                    <div className="flex justify-between text-amber-900 text-[11px]">
                      <span>Advance Required ({advancePercentageLabel}):</span>
                      <span className="font-mono font-bold">
                        Rs. {advanceRequired.toLocaleString()}/-
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600 text-[11px]">
                      <span>Balance on Delivery:</span>
                      <span className="font-mono font-bold text-slate-900">
                        Rs. {remainingAtDoorstep.toLocaleString()}/-
                      </span>
                    </div>
                  </div>
                )}

                <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline text-sm font-black text-slate-950">
                  <span>Grand Total:</span>
                  <span className="text-lg font-mono font-black text-[#ff7a00]">
                    Rs. {order.totalAmount.toLocaleString()}/-
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsInvoiceOpen(true)}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <FileText className="w-4 h-4" />
                <span>View Full Invoice</span>
              </button>
            </div>

            {/* B. Delivery Address Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <MapPin className="w-4 h-4 text-slate-500" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                  Delivery Destination
                </h3>
              </div>

              <div className="text-xs text-slate-700 space-y-1.5 leading-relaxed">
                <p className="font-bold text-slate-900 text-sm">{order.customerName}</p>
                <p className="text-slate-600">{order.customerEmail}</p>
                {order.customerPhone && (
                  <p className="text-slate-600 font-mono">{order.customerPhone}</p>
                )}
                <p className="pt-1 text-slate-700 font-medium">
                  {order.shippingAddress || "Standard Address"}, {order.shippingCity || ""}
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Interactive Single-Page A4 Order Receipt Modal */}
      {isInvoiceOpen && (
        <OrderReceiptModal
          isOpen={isInvoiceOpen}
          order={modalReceiptData}
          onClose={() => setIsInvoiceOpen(false)}
        />
      )}
    </div>
  );
}
