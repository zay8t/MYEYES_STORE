"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Glasses,
  Download,
  FileText,
  User,
  MapPin,
  Clock,
  Eye,
  Check,
  Copy,
  FileCheck,
  ExternalLink,
  X,
  CheckCircle2,
} from "lucide-react";
import { formatPrice, cn } from "@/lib/utils";
import { OrderStatus } from "@prisma/client";
import { updateOrderStatusAction, updatePaymentStatusAction } from "@/app/actions/admin";
import A4ReceiptModal, { OrderReceiptData } from "@/components/A4ReceiptModal";
import Toast from "./Toast";

const ORDER_STEPS = [
  { status: "PENDING" as OrderStatus, label: "Pending Prescription" },
  { status: "PROCESSING" as OrderStatus, label: "Lab Cutting" },
  { status: "SHIPPED" as OrderStatus, label: "Dispatched" },
  { status: "DELIVERED" as OrderStatus, label: "Delivered" },
];

export default function AdminSingleOrderClient({ order: initialOrder }: { order: OrderReceiptData }) {
  const [order, setOrder] = useState<OrderReceiptData>(initialOrder);
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(order.status as OrderStatus);
  const [paymentStatus, setPaymentStatus] = useState<string>(
    order.paymentStatus || (order.paymentMethod === "COD" ? "PENDING" : "RECEIPT_SUBMITTED")
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [copiedText, setCopiedText] = useState("");
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: "success" | "error" | "info" } | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(""), 2000);
  };

  const handleStepClick = async (newStatus: OrderStatus) => {
    setIsUpdating(true);
    setCurrentStatus(newStatus);
    const res = await updateOrderStatusAction(order.id, newStatus);
    if (res.success) {
      setToast({ message: `Order pipeline status updated to ${newStatus}`, type: "success" });
    } else {
      setToast({ message: res.error || "Failed to update status", type: "error" });
    }
    setIsUpdating(false);
  };

  const handlePaymentStatusChange = async (newPayStatus: string) => {
    setIsUpdating(true);
    setPaymentStatus(newPayStatus);
    const res = await updatePaymentStatusAction(order.id, newPayStatus);
    if (res.success) {
      setToast({ message: `Payment status updated to ${newPayStatus}`, type: "success" });
    } else {
      setToast({ message: res.error || "Failed to update payment status", type: "error" });
    }
    setIsUpdating(false);
  };

  const hasRx = order.items.some((item) => item.prescription);
  const rxItem = order.items.find((item) => item.prescription);
  const receiptUrl = order.paymentReceiptUrl || order.transactionProofUrl;

  const getPaymentBadgeClass = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "RECEIPT_SUBMITTED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "VERIFIED":
      case "PAID":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "REJECTED":
        return "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-wider mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Orders Pipeline
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 font-mono">
              Order #{order.orderNumber || "ORDER-000"}
            </h1>
            <span className="px-3 py-1 rounded-full bg-slate-900 text-white font-mono text-xs font-bold">
              {order.status}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowReceiptModal(true)}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold border border-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4 text-amber-600" /> A4 Receipt
          </button>
          <a
            href={`/api/admin/orders/${order.id}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> Download PDF
          </a>
        </div>
      </div>

      {/* Stepper Status Bar */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600" /> Optical Pipeline Stepper
        </h2>
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
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-400"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-extrabold opacity-60 font-mono">0{idx + 1}</span>
                  {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <p className="text-xs font-extrabold">{step.label}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dedicated Payment Receipt Proof Section */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
              Payment Verification & Receipt Proof
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs font-extrabold text-slate-500 uppercase">
              Method: {order.paymentMethod || "COD"}
            </span>
            <select
              value={paymentStatus}
              onChange={(e) => handlePaymentStatusChange(e.target.value)}
              disabled={isUpdating}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-extrabold border cursor-pointer focus:outline-none transition-colors",
                getPaymentBadgeClass(paymentStatus)
              )}
            >
              <option value="PENDING">PENDING</option>
              <option value="RECEIPT_SUBMITTED">RECEIPT_SUBMITTED</option>
              <option value="VERIFIED">VERIFIED</option>
              <option value="PAID">PAID</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
        </div>

        {receiptUrl ? (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div
                className="relative w-20 h-20 rounded-xl bg-white overflow-hidden border border-slate-200 cursor-pointer group flex-shrink-0"
                onClick={() => setZoomImage(receiptUrl)}
              >
                <img
                  src={receiptUrl}
                  alt="Payment Receipt Proof Thumbnail"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Payment Verification Proof Screenshot</p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Uploaded during online checkout verification step</p>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-1">
                  <Check className="w-3.5 h-3.5" /> Cloudinary Verified Link
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZoomImage(receiptUrl)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold border border-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Eye className="w-4 h-4" /> Preview High-Res
              </button>
              <a
                href={receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
              >
                <ExternalLink className="w-4 h-4" /> Open Original Tab
              </a>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs font-medium">
            No payment receipt screenshot uploaded for this order (Cash on Delivery).
          </div>
        )}
      </div>

      {/* Prescription Data Section */}
      {hasRx && rxItem?.prescription && (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/60 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-amber-200/60">
            <div className="flex items-center gap-2">
              <Glasses className="w-5 h-5 text-amber-600" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                Optical Prescription Specifications
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-900 font-mono">
              PD: {rxItem.prescription.pd} mm
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white border border-amber-200 space-y-2">
              <p className="text-xs font-extrabold text-slate-900">OD (Right Eye)</p>
              <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
                <div className="bg-slate-50 p-2 rounded">SPH: {rxItem.prescription.odSph}</div>
                <div className="bg-slate-50 p-2 rounded">CYL: {rxItem.prescription.odCyl || "0.00"}</div>
                <div className="bg-slate-50 p-2 rounded">AXIS: {rxItem.prescription.odAxis ? `${rxItem.prescription.odAxis}°` : "-"}</div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-amber-200 space-y-2">
              <p className="text-xs font-extrabold text-slate-900">OS (Left Eye)</p>
              <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
                <div className="bg-slate-50 p-2 rounded">SPH: {rxItem.prescription.osSph}</div>
                <div className="bg-slate-50 p-2 rounded">CYL: {rxItem.prescription.osCyl || "0.00"}</div>
                <div className="bg-slate-50 p-2 rounded">AXIS: {rxItem.prescription.osAxis ? `${rxItem.prescription.osAxis}°` : "-"}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer & Shipping Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-2xs">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <User className="w-4 h-4 text-slate-600" /> Customer Information
          </h3>
          <div className="space-y-2 text-xs">
            <p><strong className="text-slate-900">Name:</strong> {order.customerName}</p>
            <p><strong className="text-slate-900">Email:</strong> {order.customerEmail}</p>
            <p><strong className="text-slate-900">Phone:</strong> {order.customerPhone || "N/A"}</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-2xs">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <MapPin className="w-4 h-4 text-slate-600" /> Shipping Destination
          </h3>
          <div className="space-y-2 text-xs">
            <p><strong className="text-slate-900">Address:</strong> {order.shippingAddress || "N/A"}</p>
            <p><strong className="text-slate-900">City:</strong> {order.shippingCity || "Pakistan"}</p>
          </div>
        </div>
      </div>

      {/* Itemized Order Breakdown */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-2xs">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
          <span>Items Purchased ({order.items.length})</span>
          <span className="font-mono text-slate-900 font-extrabold">Total: {formatPrice(order.totalAmount)}</span>
        </h3>

        <div className="divide-y divide-slate-100">
          {order.items.map((item) => (
            <div key={item.id} className="py-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">{item.product?.name || "Eyewear Frame"}</p>
                <p className="text-[11px] text-slate-500 font-medium">Qty: {item.quantity} × {formatPrice(item.price)}</p>
              </div>
              <span className="text-xs font-extrabold text-slate-900 font-mono">
                {formatPrice(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* High Resolution Image Modal */}
      {zoomImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
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
                <ExternalLink className="w-4 h-4" /> Open Original Image in New Tab
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

      {/* Printable A4 Receipt Modal */}
      {showReceiptModal && (
        <A4ReceiptModal
          order={order}
          onClose={() => setShowReceiptModal(false)}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
