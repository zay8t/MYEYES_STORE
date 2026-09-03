"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  X,
  User,
  MapPin,
  Glasses,
  FileText,
  Download,
  CheckCircle2,
  Clock,
  Eye,
  Copy,
  Check,
  FileCheck,
  ExternalLink,
} from "lucide-react";
import { formatPrice, cn } from "@/lib/utils";
import { OrderStatus } from "@prisma/client";
import { updateOrderStatusAction, updatePaymentStatusAction } from "@/app/actions/admin";
import { OrderReceiptData } from "@/components/A4ReceiptModal";

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

export interface OrderDetailsDrawerProps {

  order: OrderReceiptData;
  onClose: () => void;
  onReceiptClick: (order: OrderReceiptData) => void;
}

const ORDER_STEPS = [
  { status: "PENDING" as OrderStatus, label: "Pending Prescription", desc: "Waiting lab review" },
  { status: "PROCESSING" as OrderStatus, label: "Lab Cutting", desc: "Grinding & lens fitting" },
  { status: "SHIPPED" as OrderStatus, label: "Dispatched", desc: "Handed to courier" },
  { status: "DELIVERED" as OrderStatus, label: "Delivered", desc: "Received by customer" },
];

export default function OrderDetailsDrawer({
  order,
  onClose,
  onReceiptClick,
}: OrderDetailsDrawerProps) {
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(order.status as OrderStatus);
  const [paymentStatus, setPaymentStatus] = useState<string>(
    order.paymentStatus || (order.paymentMethod === "COD" ? "PENDING" : "RECEIPT_SUBMITTED")
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [copiedText, setCopiedText] = useState("");
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(""), 2000);
  };

  const handleStepClick = async (newStatus: OrderStatus) => {
    setIsUpdating(true);
    setCurrentStatus(newStatus);
    await updateOrderStatusAction(order.id, newStatus);
    setIsUpdating(false);
  };

  const handlePaymentStatusChange = async (newPayStatus: string) => {
    setIsUpdating(true);
    setPaymentStatus(newPayStatus);
    await updatePaymentStatusAction(order.id, newPayStatus);
    setIsUpdating(false);
  };

  const hasRx = order.items.some((item) => item.prescription);
  const rxItem = order.items.find((item) => item.prescription);
  const receiptUrl = order.paymentReceiptUrl || order.transactionProofUrl;

  const getPaymentBadgeClass = (status: string) => {
    switch (status) {
      case "PENDING_VERIFICATION":
      case "PENDING":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "UNPAID":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "RECEIPT_SUBMITTED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "VERIFIED":
      case "PAID":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "FAILED":
      case "REJECTED":
        return "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs transition-opacity">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl z-10 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-6 bg-slate-50 text-slate-900 flex items-center justify-between border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-amber-500 text-slate-950 font-mono font-extrabold text-xs tracking-wider">
                {order.orderNumber || "ORDER-000"}
              </span>
              <span className="text-xs text-slate-400 font-mono">Ref #{order.id.slice(0, 8)}</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1">{order.customerName}</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onReceiptClick(order)}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center gap-1.5 border border-slate-200 transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-amber-600" />
              <span>Receipt</span>
            </button>

            <a
              href={`/api/admin/orders/${order.id}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Download className="w-4 h-4" />
              <span>PDF</span>
            </a>

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-200/60 text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Body Scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Order Status Stepper */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                Optical Order Status Stepper
              </h3>
              {isUpdating && (
                <span className="text-[11px] font-bold text-amber-700 animate-pulse">
                  Updating Status...
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ORDER_STEPS.map((step, idx) => {
                const isActive = currentStatus === step.status;
                return (
                  <button
                    key={step.status}
                    onClick={() => handleStepClick(step.status)}
                    disabled={isUpdating}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all cursor-pointer",
                      isActive
                        ? "bg-slate-900 text-white border-slate-900 shadow-md font-bold"
                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-extrabold opacity-60 font-mono">
                        0{idx + 1}
                      </span>
                      {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                    </div>
                    <p className="text-xs font-extrabold leading-tight">{step.label}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dedicated Payment Receipt Proof Section */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4.5 h-4.5 text-blue-600" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                  Payment Receipt Proof
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase">
                  Method: {order.paymentMethod || "COD"}
                </span>
                <select
                  value={paymentStatus}
                  onChange={(e) => handlePaymentStatusChange(e.target.value)}
                  disabled={isUpdating}
                  className={cn(
                    "px-3 py-1 rounded-xl text-[11px] font-extrabold border cursor-pointer focus:outline-none transition-colors",
                    getPaymentBadgeClass(paymentStatus)
                  )}
                >
                  <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
                  <option value="PAID">PAID</option>
                  <option value="FAILED">FAILED</option>
                  <option value="UNPAID">UNPAID</option>
                  <option value="REFUNDED">REFUNDED</option>
                </select>
              </div>
            </div>

            {receiptUrl ? (
              <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="relative w-16 h-16 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 cursor-pointer group flex-shrink-0"
                    onClick={() => setZoomImage(receiptUrl)}
                  >
                    <img
                      src={receiptUrl}
                      alt="Payment Receipt Proof Thumbnail"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-900">Payment Screenshot Proof</p>
                    <p className="text-[11px] text-slate-500 font-medium">Click thumbnail to inspect in high-resolution</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setZoomImage(receiptUrl)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> Preview Image
                  </button>
                  <a
                    href={receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Open Tab
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-white border border-slate-200 text-slate-500 text-xs font-medium">
                No payment receipt proof uploaded for this order (Cash on Delivery / Direct order).
              </div>
            )}
          </div>

          {/* Prescription Data Section (If Prescription Present) */}
          {hasRx && (
            <div className="space-y-4">
              {order.items
                .filter((i) => i.prescription)
                .map((item) => {
                  const rx = item.prescription!;
                  const humanLensName = item.lensPackageName || item.selectedLensName || rx.lensType || "Standard Prescription Lenses";
                  const visionType = item.visionType || (rx.lensType?.toLowerCase().includes("progressive") || humanLensName?.toLowerCase().includes("progressive") ? "Progressive" : "Single Vision");

                  return (
                    <div key={item.id} className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/60 space-y-4 shadow-2xs">
                      <div className="flex items-center justify-between pb-3 border-b border-amber-200/60 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-extrabold">
                            <Glasses className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                              Optical Prescription Specifications
                            </h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="px-1.5 py-0.5 rounded bg-amber-200/60 text-amber-900 font-extrabold text-[9px] uppercase tracking-wider">
                                {visionType}
                              </span>
                              <span className="text-[11px] text-amber-950 font-bold">
                                {item.frameName || item.product?.name} — {humanLensName}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                            Pupillary Distance
                          </span>
                          <span className="text-sm font-extrabold text-slate-900 font-mono">
                            {rx.pd} mm
                          </span>
                        </div>
                      </div>

                      {/* Eye Measurements Grid (OD Right vs OS Left) */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* OD - Right Eye */}
                        <div className="p-4 rounded-xl bg-white border border-amber-200/80 shadow-2xs space-y-2">
                          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                            <span className="text-xs font-extrabold text-slate-900">OD (Right Eye)</span>
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-900 text-[10px] font-bold">
                              Right Lens
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
                            <div className="bg-slate-50 p-2 rounded-lg">
                              <span className="text-[9px] font-bold text-slate-400 block">SPH</span>
                              <span className="font-extrabold text-slate-900">
                                {rx.odSph > 0 ? `+${rx.odSph.toFixed(2)}` : rx.odSph.toFixed(2)}
                              </span>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-lg">
                              <span className="text-[9px] font-bold text-slate-400 block">CYL</span>
                              <span className="font-extrabold text-slate-900">
                                {rx.odCyl !== null && rx.odCyl !== undefined ? rx.odCyl.toFixed(2) : "0.00"}
                              </span>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-lg">
                              <span className="text-[9px] font-bold text-slate-400 block">AXIS</span>
                              <span className="font-extrabold text-slate-900">
                                {rx.odAxis ? `${rx.odAxis}°` : "-"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* OS - Left Eye */}
                        <div className="p-4 rounded-xl bg-white border border-amber-200/80 shadow-2xs space-y-2">
                          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                            <span className="text-xs font-extrabold text-slate-900">OS (Left Eye)</span>
                            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-900 text-[10px] font-bold">
                              Left Lens
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
                            <div className="bg-slate-50 p-2 rounded-lg">
                              <span className="text-[9px] font-bold text-slate-400 block">SPH</span>
                              <span className="font-extrabold text-slate-900">
                                {rx.osSph > 0 ? `+${rx.osSph.toFixed(2)}` : rx.osSph.toFixed(2)}
                              </span>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-lg">
                              <span className="text-[9px] font-bold text-slate-400 block">CYL</span>
                              <span className="font-extrabold text-slate-900">
                                {rx.osCyl !== null && rx.osCyl !== undefined ? rx.osCyl.toFixed(2) : "0.00"}
                              </span>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-lg">
                              <span className="text-[9px] font-bold text-slate-400 block">AXIS</span>
                              <span className="font-extrabold text-slate-900">
                                {rx.osAxis ? `${rx.osAxis}°` : "-"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Uploaded Rx Doctor Slip Image */}
                      {rx.fileUrl && (
                        <div className="p-3 rounded-xl bg-white border border-amber-200/80 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="relative w-12 h-12 rounded-lg bg-slate-100 overflow-hidden border cursor-pointer group"
                              onClick={() => setZoomImage(rx.fileUrl)}
                            >
                              <Image
                                src={rx.fileUrl}
                                alt="Doctor Prescription Slip"
                                fill
                                className="object-cover group-hover:scale-105 transition-transform"
                              />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900">Uploaded Doctor Rx Slip</p>
                              <p className="text-[11px] text-slate-500 font-medium">Click image to inspect high-res attachment</p>
                            </div>
                          </div>

                          <button
                            onClick={() => setZoomImage(rx.fileUrl)}
                            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> Inspect
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}

          {/* Customer & Shipping Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Details Card */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-slate-600" /> Customer Information
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Full Name:</span>
                  <span className="font-extrabold text-slate-900">{order.customerName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Email Address:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-extrabold text-slate-900">{order.customerEmail}</span>
                    <button
                      onClick={() => copyToClipboard(order.customerEmail, "email")}
                      className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {copiedText === "email" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Phone Number:</span>
                  <span className="font-extrabold text-slate-900">{order.customerPhone || "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Delivery Address Card */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-600" /> Shipping Destination
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <p className="font-bold text-slate-900">{order.shippingAddress || "Standard Delivery Address"}</p>
                <p className="text-slate-500 font-medium">City: {order.shippingCity || "Pakistan"}</p>
                <p className="text-slate-500 font-medium">Payment Method: {order.paymentMethod || "Cash on Delivery (COD)"}</p>
              </div>
            </div>
          </div>

          {/* Itemized Order Breakdown */}
          {(() => {
            const shippingFee = order.shippingFee !== undefined ? order.shippingFee : 250;

            const totalFrameCost = order.items.reduce((sum, item) => {
              const frameCost = item.framePrice !== null && item.framePrice !== undefined
                ? Number(item.framePrice)
                : (item.prescription ? (item.price > (item.lensPrice ?? item.lensFinalPrice ?? 0) ? item.price - (item.lensPrice ?? item.lensFinalPrice ?? 0) : 0) : Number(item.price));
              return sum + (frameCost * item.quantity);
            }, 0);

            const totalLensCost = order.items.reduce((sum, item) => {
              const lensCost = item.lensPrice !== null && item.lensPrice !== undefined
                ? Number(item.lensPrice)
                : (item.lensFinalPrice !== null && item.lensFinalPrice !== undefined ? Number(item.lensFinalPrice) : 0);
              return sum + (lensCost * item.quantity);
            }, 0);

            const itemsSubtotal = (totalFrameCost + totalLensCost) > 0
              ? (totalFrameCost + totalLensCost)
              : order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

            const grandTotal = itemsSubtotal + shippingFee;

            return (
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 space-y-4 shadow-2xs">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
                  <span>Ordered Frame &amp; Lens Items ({order.items.length})</span>
                  <span className="text-slate-500 font-mono">Total Paid: {formatPrice(order.totalAmount)}</span>
                </h3>

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
                      item.prescription?.lensType ||
                      (item.prescription ? "Standard Prescription Lenses" : null);

                    const visionType = item.visionType ||
                      (item.prescription?.lensType?.toLowerCase().includes("progressive") || humanLensName?.toLowerCase().includes("progressive")
                        ? "Progressive"
                        : (item.prescription ? "Single Vision" : null));

                    const unitPrice = (frameCost !== null && lensCost !== null)
                      ? (frameCost + lensCost)
                      : item.price;

                    const itemFrameImg = item.frameImage || getFirstImage(item.product?.images);
                    const frameName = item.frameName || item.product?.name || "Eyewear Frame";
                    const frameId = item.frameId || item.productId?.slice(0, 8);

                    return (
                      <div key={item.id} className="py-4 flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                          <div className="w-20 h-20 rounded-xl border border-slate-200 bg-slate-50 p-1.5 flex-shrink-0 flex items-center justify-center overflow-hidden">
                            {itemFrameImg ? (
                              <img
                                src={itemFrameImg}
                                alt={frameName}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = "/placeholder-frame.png";
                                }}
                              />
                            ) : (
                              <Glasses className="w-8 h-8 text-slate-400" />
                            )}
                          </div>
                          <div className="space-y-1">
                            <div>
                              <p className="text-sm font-bold text-slate-900 leading-snug">{frameName}</p>
                              <p className="text-[10px] text-slate-400 font-mono">ID: {frameId}</p>
                            </div>

                            {frameCost !== null && (
                              <p className="text-xs font-semibold text-slate-700">
                                Frame: {formatPrice(frameCost)}
                              </p>
                            )}

                            {humanLensName && (
                              <div className="pt-0.5">
                                <div className="flex items-center gap-1.5">
                                  {visionType && (
                                    <span className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-900 font-extrabold text-[9px] uppercase tracking-wider">
                                      {visionType}
                                    </span>
                                  )}
                                  <span className="text-xs font-bold text-slate-900">
                                    {humanLensName}
                                  </span>
                                </div>
                                {lensCost !== null && (
                                  <p className="text-xs font-semibold text-slate-700 mt-0.5">
                                    Lens: {formatPrice(lensCost)}
                                  </p>
                                )}
                              </div>
                            )}

                            <p className="text-[11px] text-slate-500 font-mono pt-1">
                              Qty: {item.quantity} × {formatPrice(unitPrice)}
                            </p>
                          </div>
                        </div>

                        <div className="text-right font-mono">
                          <span className="text-sm font-black text-slate-900 block">
                            {formatPrice(unitPrice * item.quantity)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Subtotal Breakdown Section */}
                <div className="pt-4 border-t border-slate-200 space-y-2 bg-slate-50/80 p-4 rounded-xl">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Frame Subtotal:</span>
                    <span className="font-mono font-semibold text-slate-800">{formatPrice(totalFrameCost)}</span>
                  </div>
                  {totalLensCost > 0 && (
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Lens Subtotal:</span>
                      <span className="font-mono font-semibold text-slate-800">{formatPrice(totalLensCost)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Total Subtotal:</span>
                    <span className="font-mono font-semibold text-slate-800">{formatPrice(itemsSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Shipping:</span>
                    <span className="font-mono font-semibold text-slate-800">{formatPrice(shippingFee)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                    <span>Grand Total:</span>
                    <span className="font-mono text-base text-amber-900">{formatPrice(order.totalAmount || grandTotal)}</span>
                  </div>
                </div>
              </div>
            );
          })()}

        </div>
      </div>

      {/* Image Lightbox Modal */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex flex-col items-center justify-center space-y-4">
            <div className="relative w-full flex-1 min-h-0">
              <img
                src={zoomImage}
                alt="High-resolution receipt preview"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            
            <div className="flex items-center gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
              <a
                href={zoomImage}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <ExternalLink className="w-4 h-4" /> Open Full Image in New Tab
              </a>
              <button
                onClick={() => setZoomImage(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer transition-colors"
              >
                Close Preview
              </button>
            </div>

            <button
              onClick={() => setZoomImage(null)}
              className="absolute top-2 right-2 p-3 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
