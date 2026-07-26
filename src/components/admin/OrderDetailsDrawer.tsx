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
} from "lucide-react";
import { formatPrice, cn } from "@/lib/utils";
import { OrderStatus } from "@prisma/client";
import { updateOrderStatusAction } from "@/app/actions/admin";
import { OrderReceiptData } from "@/components/A4ReceiptModal";

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

  const hasRx = order.items.some((item) => item.prescription);
  const rxItem = order.items.find((item) => item.prescription);

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
                Optical Pipeline Status Stepper
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

          {/* Prescription Data Section (If Prescription Present) */}
          {hasRx && rxItem?.prescription && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/60 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-amber-200/60">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-extrabold">
                    <Glasses className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                      Optical Prescription Specifications
                    </h3>
                    <p className="text-[11px] text-amber-900 font-bold">
                      Package: {rxItem.prescription.lensType}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                    Pupillary Distance
                  </span>
                  <span className="text-sm font-extrabold text-slate-900 font-mono">
                    {rxItem.prescription.pd} mm
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
                        {rxItem.prescription.odSph > 0 ? `+${rxItem.prescription.odSph}` : rxItem.prescription.odSph}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg">
                      <span className="text-[9px] font-bold text-slate-400 block">CYL</span>
                      <span className="font-extrabold text-slate-900">
                        {rxItem.prescription.odCyl !== null ? rxItem.prescription.odCyl : "0.00"}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg">
                      <span className="text-[9px] font-bold text-slate-400 block">AXIS</span>
                      <span className="font-extrabold text-slate-900">
                        {rxItem.prescription.odAxis ? `${rxItem.prescription.odAxis}°` : "-"}
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
                        {rxItem.prescription.osSph > 0 ? `+${rxItem.prescription.osSph}` : rxItem.prescription.osSph}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg">
                      <span className="text-[9px] font-bold text-slate-400 block">CYL</span>
                      <span className="font-extrabold text-slate-900">
                        {rxItem.prescription.osCyl !== null ? rxItem.prescription.osCyl : "0.00"}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg">
                      <span className="text-[9px] font-bold text-slate-400 block">AXIS</span>
                      <span className="font-extrabold text-slate-900">
                        {rxItem.prescription.osAxis ? `${rxItem.prescription.osAxis}°` : "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Uploaded Rx Doctor Slip Image */}
              {rxItem.prescription.fileUrl && (
                <div className="p-3 rounded-xl bg-white border border-amber-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="relative w-12 h-12 rounded-lg bg-slate-100 overflow-hidden border cursor-pointer group"
                      onClick={() => setZoomImage(rxItem.prescription!.fileUrl)}
                    >
                      <Image
                        src={rxItem.prescription.fileUrl}
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
                    onClick={() => setZoomImage(rxItem.prescription!.fileUrl)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> Inspect
                  </button>
                </div>
              )}
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
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 space-y-3 shadow-2xs">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>Ordered Frame & Lens Items ({order.items.length})</span>
              <span className="text-slate-500 font-mono">Total Paid: {formatPrice(order.totalAmount)}</span>
            </h3>

            <div className="divide-y divide-slate-100">
              {order.items.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold">
                      <Glasses className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{item.product?.name || "Eyewear Frame"}</p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Qty: {item.quantity} × {formatPrice(item.price)}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-slate-900 font-mono">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Image Lightbox Modal */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setZoomImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex flex-col items-center justify-center">
            <Image
              src={zoomImage}
              alt="Prescription Doctor Slip Zoom"
              fill
              className="object-contain rounded-xl"
            />
            <button
              onClick={() => setZoomImage(null)}
              className="absolute top-4 right-4 p-3 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
