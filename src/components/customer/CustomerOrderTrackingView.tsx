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
  Smartphone,
  ShieldCheck,
  CreditCard,
  Building2,
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
  const isOnlinePayment = !isCOD;
  const displayOrderNo = order.orderNumber || order.id.slice(0, 8);

  // ================================================================
  // CONDITIONAL COD ADVANCE LOGIC (25% vs 40%)
  // ================================================================
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

  const hasAnyPrescription = order.items.some((item) => item.prescription !== null && item.prescription !== undefined);

  const advancePercentage = isProgressive ? 0.4 : 0.25;
  const advancePercentageLabel = isProgressive ? "40%" : "25%";
  const lensTierLabel = isProgressive
    ? "Progressive Custom Prescription"
    : hasAnyPrescription
    ? "Standard Custom Prescription"
    : "Standard Optical Assembly";

  const advanceRequired = Math.round(order.totalAmount * advancePercentage);
  const remainingAtDoorstep = order.totalAmount - advanceRequired;

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
    if (isCOD) return `COD (ADVANCE ${advancePercentageLabel} REQUIRED)`;
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

  const whatsappMessage = encodeURIComponent(
    `Assalam-o-Alaikum! I have placed Order #${displayOrderNo} on My Eyes.\n\nCustomer: ${order.customerName}\nLens Category: ${lensTierLabel}\nOrder Total: Rs. ${order.totalAmount.toLocaleString()}/-\n${advancePercentageLabel} Advance Required: Rs. ${advanceRequired.toLocaleString()}/-\nRemaining at Doorstep: Rs. ${remainingAtDoorstep.toLocaleString()}/-\n\nHere is my advance deposit payment confirmation.`
  );

  return (
    <div className="min-h-screen bg-[#ffffff] py-10 sm:py-14 text-slate-900 selection:bg-orange-100 selection:text-orange-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        
        {/* Navigation & Header Actions */}
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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-800 text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4 text-slate-600" />
            <span>Digital Invoice</span>
          </button>
        </div>

        {/* ================================================================ */}
        {/* 1. TOP CONFIRMATION BANNER (PURE WHITE CARD & LUXURY ACCENTS)    */}
        {/* ================================================================ */}
        {isSuccessView ? (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 mb-6 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-emerald-700 mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Order Confirmed</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Thank you, {order.customerName}!
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Your order has been registered under permanent order number{" "}
                  <strong className="text-slate-900 font-mono font-bold">#{displayOrderNo}</strong>.
                </p>
              </div>

              {/* Total Payable Box (Clean Minimal Pill Card) */}
              <div className="w-full sm:w-auto mt-2 sm:mt-0 p-4 sm:px-6 sm:py-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-start sm:items-end shrink-0">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                  TOTAL PAYABLE
                </span>
                <span className="text-2xl sm:text-3xl font-black text-[#ff7a00]">
                  Rs. {order.totalAmount.toLocaleString()}/-
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 mb-6 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs font-semibold text-slate-700 mb-3">
                  <Glasses className="w-3.5 h-3.5 text-slate-600" />
                  <span>Live Order Tracking</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Order #{displayOrderNo}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Tracking fulfillment for customer <strong className="text-slate-900 font-bold">{order.customerName}</strong>.
                </p>
              </div>

              {/* Total Payable Box */}
              <div className="w-full sm:w-auto mt-2 sm:mt-0 p-4 sm:px-6 sm:py-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-start sm:items-end shrink-0">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                  TOTAL PAYABLE
                </span>
                <span className="text-2xl sm:text-3xl font-black text-[#ff7a00]">
                  Rs. {order.totalAmount.toLocaleString()}/-
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* 2 & 3. PAYMENT METHOD CARD (WHITE AESTHETIC & COD ADVANCE LOGIC)  */}
        {/* ================================================================ */}
        <div className="mb-6">
          {/* A. Cash on Delivery (COD) with 25% vs 40% Advance Deposit Logic */}
          {isCOD && (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5 animate-fade-in">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-200/80 text-[#ff7a00] flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-extrabold text-slate-900">Payment Method</h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-[#ff7a00] border border-orange-200/80">
                        Cash on Delivery (COD)
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {lensTierLabel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Prescription lab manufacturing requires advance deposit confirmation.
                    </p>
                  </div>
                </div>
              </div>

              {/* Explanatory Notice */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950 leading-relaxed font-medium">
                <p>
                  Custom optical lenses are tailored specifically to your prescription. A{" "}
                  <strong className="text-amber-900 font-extrabold">
                    {advancePercentageLabel} advance deposit (Rs. {advanceRequired.toLocaleString()}/-)
                  </strong>{" "}
                  is required to begin precision lab cutting. The remaining{" "}
                  <strong className="text-slate-900 font-extrabold">
                    Rs. {remainingAtDoorstep.toLocaleString()}/-
                  </strong>{" "}
                  is payable at your doorstep.
                </p>
              </div>

              {/* Advance vs Balance Summary Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-[11px] font-medium text-slate-500 uppercase">
                    Advance Required ({advancePercentageLabel})
                  </p>
                  <p className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                    Rs. {advanceRequired.toLocaleString()}/-
                  </p>
                </div>
                <div className="border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-3">
                  <p className="text-[11px] font-medium text-slate-500 uppercase">
                    Remaining at Doorstep
                  </p>
                  <p className="text-base sm:text-lg font-bold text-[#ff7a00] mt-0.5">
                    Rs. {remainingAtDoorstep.toLocaleString()}/-
                  </p>
                </div>
              </div>

              {/* Advance Action Buttons */}
              <div className="space-y-3 pt-1">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* WhatsApp Receipt Confirmation */}
                  <a
                    href={`https://wa.me/923006694928?text=${whatsappMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold transition-all shadow-xs"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Submit Advance via WhatsApp (+92 300 6694928)</span>
                  </a>

                  {/* Toggle Upload Advance Form */}
                  <button
                    onClick={() => setShowUploadAdvance(!showUploadAdvance)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    <Upload className="w-4 h-4 text-slate-600" />
                    <span>{showUploadAdvance ? "Hide Upload Form" : "Upload Receipt Online"}</span>
                  </button>
                </div>

                {/* Quick Transfer Bank / EasyPaisa Details */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900">EasyPaisa / JazzCash / Raast:</span>
                      <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                        03006694928
                      </span>
                      <span className="text-slate-500 font-medium">(MUHAMMAD AASIM MUSHTAQ)</span>
                    </div>

                    <button
                      onClick={() => handleCopyTid("03006694928")}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 cursor-pointer transition-colors shrink-0"
                    >
                      {copiedTid ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                      <span>{copiedTid ? "Copied!" : "Copy Number"}</span>
                    </button>
                  </div>
                </div>

                {/* Optional Online Advance Upload Form */}
                {showUploadAdvance && (
                  <form
                    onSubmit={handleResubmitProof}
                    className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs mt-3 animate-fade-in"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Upload className="w-4 h-4 text-[#ff7a00]" />
                        Submit Advance Deposit Proof
                      </h4>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Order #{displayOrderNo}
                      </span>
                    </div>

                    {resubmitError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium">
                        {resubmitError}
                      </div>
                    )}

                    {resubmitSuccess && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600" />
                        Advance payment proof successfully submitted for optical verification!
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                          Transaction ID (TID / Ref #)
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
                          Sender Account Title
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Eleanor Vance"
                          value={resubmitSenderName}
                          onChange={(e) => setResubmitSenderName(e.target.value)}
                          className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Advance Receipt Screenshot
                      </label>
                      <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-xl p-3 text-center cursor-pointer transition-colors bg-slate-50">
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
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
                            <span className="text-xs font-bold text-slate-700">Uploading receipt screenshot...</span>
                          </>
                        ) : resubmitReceiptUrl ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-600" />
                            <span className="text-xs font-bold text-emerald-700">Receipt Attached! Click to change</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 text-slate-500" />
                            <span className="text-xs font-bold text-slate-600">Select Receipt Image (JPG, PNG)</span>
                          </>
                        )}
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={resubmitting || uploadingReceipt}
                      className="w-full py-3 rounded-xl bg-[#ff7a00] hover:bg-[#e06c00] disabled:opacity-50 text-white text-xs font-extrabold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                    >
                      {resubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Submitting Advance Proof...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Submit Advance Proof for Approval</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* B. Online Payment: PENDING_VERIFICATION */}
          {isOnlinePayment &&
            (order.paymentStatus === "PENDING_VERIFICATION" ||
              order.paymentStatus === "UNPAID" ||
              order.paymentStatus === "PENDING") && (
              <div className="bg-white border border-amber-200/90 rounded-3xl p-6 shadow-xs flex items-start gap-4 animate-fade-in">
                <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200/80">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-200 uppercase tracking-wider">
                      ⏳ Payment Verification Under Review
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-700 leading-relaxed">
                    We are verifying your online transfer of{" "}
                    <strong className="text-slate-900 font-bold">Rs. {order.totalAmount.toLocaleString()}/-</strong>
                    {order.transactionId ? (
                      <>
                        {" "}
                        (TID:{" "}
                        <span className="font-mono font-bold bg-slate-100 text-slate-900 px-1.5 py-0.5 rounded border border-slate-200">
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

          {/* C. Online Payment: PAID (VERIFIED) */}
          {isOnlinePayment && order.paymentStatus === "PAID" && (
            <div className="bg-white border border-emerald-200/90 rounded-3xl p-6 shadow-xs flex items-start gap-4 animate-fade-in">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200/80">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                    ✅ Payment Verified & Received
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-700 leading-relaxed">
                  Your full payment of <strong className="text-slate-900 font-bold">Rs. {order.totalAmount.toLocaleString()}/-</strong> has been verified. Your order is now queued in optical lab production and will be custom crafted to your exact prescription specifications.
                </p>
                {order.verifiedAt && (
                  <p className="text-[11px] text-emerald-700 font-medium">
                    Verified on: {new Date(order.verifiedAt).toLocaleString("en-PK")}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* D. Online Payment: FAILED (REJECTED) WITH 1-CLICK RESUBMISSION */}
          {isOnlinePayment && order.paymentStatus === "FAILED" && (
            <div className="bg-white border border-rose-200 rounded-3xl p-6 shadow-xs space-y-4 animate-fade-in">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0 border border-rose-200">
                  <XCircle className="w-5 h-5" />
                </div>
                <div className="space-y-1 flex-1">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-50 text-rose-900 border border-rose-200 uppercase tracking-wider">
                    ⚠️ Payment Verification Unsuccessful
                  </span>
                  <p className="text-xs font-bold text-rose-950 pt-1">
                    Reason: {order.rejectionReason || "Payment receipt or TID could not be verified."}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Your order #{displayOrderNo} is safely preserved. Please review and resubmit your valid Transaction ID (TID) and receipt screenshot below.
                  </p>
                </div>
              </div>

              {/* Resubmit Proof Form */}
              <form
                onSubmit={handleResubmitProof}
                className="bg-slate-50/70 rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4"
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
                      className="w-full text-xs font-mono font-bold border border-slate-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:border-slate-900"
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
                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Upload New Receipt Screenshot
                  </label>
                  <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-xl p-3 text-center cursor-pointer transition-colors bg-white">
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
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
                        <span className="text-xs font-bold text-slate-700">Uploading screenshot...</span>
                      </>
                    ) : resubmitReceiptUrl ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-emerald-700">Screenshot Attached! Click to change</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 text-slate-500" />
                        <span className="text-xs font-bold text-slate-600">Select Screenshot (JPG, PNG)</span>
                      </>
                    )}
                  </label>
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

        {/* ================================================================ */}
        {/* 4. ORDER OVERVIEW & ITEM DETAILS (CLEAN WHITE CARDS)              */}
        {/* ================================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Column: Items & Prescription */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Products Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-4">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Order Items ({order.items.length})
              </h2>

              <div className="divide-y divide-slate-100">
                {order.items.map((item) => (
                  <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200/80 overflow-hidden shrink-0 flex items-center justify-center">
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
                        <div className="mt-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                          <p className="font-bold text-slate-900">
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
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-4">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Fulfillment & Production Progress
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Step 1</span>
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Order Placed
                  </span>
                </div>

                <div
                  className={cn(
                    "p-3.5 rounded-2xl border",
                    order.paymentStatus === "PAID" || isCOD
                      ? "bg-emerald-50/70 border-emerald-200"
                      : order.paymentStatus === "FAILED"
                      ? "bg-rose-50/70 border-rose-200"
                      : "bg-amber-50/70 border-amber-200"
                  )}
                >
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Step 2</span>
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                    {order.paymentStatus === "PAID" || isCOD ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                    )}
                    {isCOD ? "COD Registered" : order.paymentStatus === "PAID" ? "Payment Verified" : "Verification"}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Step 3</span>
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                    <Glasses className="w-3.5 h-3.5 text-slate-600" /> Lab Production
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Step 4</span>
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                    <Truck className="w-3.5 h-3.5 text-slate-600" /> Dispatch
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Column: Summary & Invoice Info */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Payment Summary */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Payment Summary
              </h2>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Payment Method:</span>
                  <span className="font-bold text-slate-900 text-right">
                    {getFriendlyPaymentMethod(order.paymentMethod)}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600 items-center">
                  <span>Status:</span>
                  <span
                    className={cn(
                      "font-extrabold text-right text-[10px] px-2.5 py-0.5 rounded-full",
                      order.paymentStatus === "PAID"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : order.paymentStatus === "FAILED"
                        ? "bg-rose-50 text-rose-800 border border-rose-200"
                        : isCOD
                        ? "bg-orange-50 text-[#ff7a00] border border-orange-200/80"
                        : "bg-amber-50 text-amber-800 border border-amber-200"
                    )}
                  >
                    {isCOD ? `COD (${advancePercentageLabel} ADVANCE)` : getDigitalInvoiceStatus()}
                  </span>
                </div>

                {order.transactionId && (
                  <div className="flex justify-between text-slate-600 items-center">
                    <span>Submitted TID:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono font-bold text-slate-900 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
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

                {/* Conditional COD advance and doorstep breakdown in sidebar */}
                {isCOD && (
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 my-1">
                    <div className="flex justify-between text-slate-600">
                      <span className="text-[11px] font-medium">Advance Deposit ({advancePercentageLabel}):</span>
                      <span className="font-mono font-bold text-slate-900">
                        Rs. {advanceRequired.toLocaleString()}/-
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span className="text-[11px] font-medium">At Doorstep:</span>
                      <span className="font-mono font-bold text-[#ff7a00]">
                        Rs. {remainingAtDoorstep.toLocaleString()}/-
                      </span>
                    </div>
                  </div>
                )}

                <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-black text-slate-950">
                  <span>Grand Total:</span>
                  <span className="font-mono text-[#ff7a00]">Rs. {order.totalAmount.toLocaleString()}/-</span>
                </div>
              </div>

              <button
                onClick={() => setIsInvoiceOpen(true)}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#ff7a00] hover:bg-[#e06c00] text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>View & Print Invoice</span>
              </button>
            </div>

            {/* Delivery Destination */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-3">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Delivery Destination
              </h2>
              <div className="text-xs text-slate-700 space-y-1 leading-relaxed">
                <p className="font-bold text-slate-900">{order.customerName}</p>
                <p>{order.customerEmail}</p>
                {order.customerPhone && <p>{order.customerPhone}</p>}
                <p className="pt-1 text-slate-600 font-medium">
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
