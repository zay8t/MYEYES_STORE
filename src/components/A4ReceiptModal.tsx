"use client";

import React, { useRef } from "react";
import { X, Printer, Download, Glasses, CheckCircle2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { formatOrderNumber } from "@/lib/order-number";

interface Prescription {
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
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  images: string;
  category: string;
}

interface OrderItem {
  id: string;
  productId: string;
  prescriptionId: string | null;
  price: number;
  quantity: number;
  product: Product;
  prescription: Prescription | null;
  frameId?: string | null;
  frameName?: string | null;
  frameImage?: string | null;
  framePrice?: number | null;
  visionType?: string | null;
  lensPackageName?: string | null;
  lensPrice?: number | null;
  subtotal?: number | null;
  selectedLensName?: string | null;
  lensBasePriceKey?: string | null;
  lensBasePriceValue?: number | null;
  lensMultiplier?: number | null;
  lensFinalPrice?: number | null;
  isAsymmetricRx?: boolean | null;
  rightEyeLensPrice?: number | null;
  leftEyeLensPrice?: number | null;
  rightMultiplier?: number | null;
  leftMultiplier?: number | null;
}

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



export interface OrderReceiptData {
  id: string;
  orderNumber?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  phone?: string | null;
  shippingAddress?: string | null;
  shippingCity?: string | null;
  city?: string | null;
  postalCode?: string | null;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  paymentReceiptUrl?: string | null;
  transactionProofUrl?: string | null;
  shippingFee?: number;
  totalAmount: number;
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | string;
  createdAt: string;
  items: OrderItem[];
}

export interface A4ReceiptModalProps {
  order: OrderReceiptData;
  onClose: () => void;
  isOpen?: boolean;
}

export type OrderReceiptModalProps = A4ReceiptModalProps;

export default function A4ReceiptModal({ order, onClose, isOpen }: A4ReceiptModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (isOpen === false) return null;

  const displayOrderNo = formatOrderNumber(order);
  const orderDate = new Date(order.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const orderTime = new Date(order.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handlePrint = () => {
    const receiptElement =
      document.getElementById("printable-receipt-card") ||
      document.getElementById("printable-receipt-canvas") ||
      printRef.current;

    if (!receiptElement) {
      const printTab = window.open(
        `/receipts/${order.orderNumber || order.id}?print=true`,
        "_blank"
      );
      if (printTab) printTab.focus();
      return;
    }

    const printIframe = document.createElement("iframe");
    printIframe.style.position = "fixed";
    printIframe.style.right = "0";
    printIframe.style.bottom = "0";
    printIframe.style.width = "0";
    printIframe.style.height = "0";
    printIframe.style.border = "0";
    document.body.appendChild(printIframe);

    const frameDoc =
      printIframe.contentDocument || printIframe.contentWindow?.document;
    if (!frameDoc) return;

    // Grab all global stylesheets and Tailwind styles
    const styles = Array.from(
      document.querySelectorAll('link[rel="stylesheet"], style')
    )
      .map((el) => el.outerHTML)
      .join("");

    frameDoc.open();
    frameDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Order Receipt #${order.orderNumber || order.id}</title>
          ${styles}
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 12mm;
            }
            html, body {
              background: #ffffff !important;
              margin: 0 !important;
              padding: 0 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #printable-receipt-card, #printable-receipt-canvas {
              width: 100% !important;
              max-width: 100% !important;
              box-shadow: none !important;
              border: none !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .receipt-section,
            .receipt-table-row,
            .receipt-rx-box,
            .receipt-totals-box,
            table, tr, td, th {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }
          </style>
        </head>
        <body>
          ${receiptElement.outerHTML}
        </body>
      </html>
    `);
    frameDoc.close();

    printIframe.contentWindow?.focus();
    setTimeout(() => {
      printIframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(printIframe)) {
          document.body.removeChild(printIframe);
        }
      }, 1000);
    }, 350);
  };

  const handleDownloadPdf = () => {
    // Triggers direct backend A4 PDF streaming
    window.open(`/api/orders/${order.id}/pdf`, "_blank");
  };

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

  const getFriendlyPaymentMethod = (method?: string | null) => {

    switch (method) {
      case "COD":
        return "Cash on Delivery (COD)";
      case "EASYPAISA":
        return "EasyPaisa Direct Transfer";
      case "JAZZCASH":
        return "JazzCash Direct Transfer";
      case "BANK_TRANSFER":
      case "ALFALAH":
      case "RAAST":
        return "Bank Transfer / Raast IBFT";
      default:
        return method || "Direct Payment";
    }
  };

  const isPaid =
    order.paymentStatus === "PAID" ||
    order.paymentStatus === "PAID (VERIFIED)";
  const isPending =
    order.paymentStatus === "PENDING_VERIFICATION" ||
    order.paymentStatus === "SUBMITTED" ||
    (!isPaid && order.paymentMethod !== "COD");

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex justify-center p-2 sm:p-6 print:p-0 print:bg-white print:static print:inset-auto">
      
      {/* Modal Dialog Backdrop Click (Hidden when printing) */}
      <div
        className="fixed inset-0 print:hidden cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-4xl flex flex-col my-auto print:my-0 print:max-w-none">
        
        {/* Modal Action Bar (Completely Light, Minimal, and Ink-Friendly) */}
        <div className="bg-white border-b border-slate-200 text-slate-900 p-4 rounded-t-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600">
              <Glasses className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-slate-900 block leading-tight">
                Order Receipt Preview
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Order #{displayOrderNo}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-medium text-sm px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Print Receipt</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              className="bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer ml-1"
              title="Close modal"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Canvas Wrapper (Styled as Minimal Light A4 Document) */}
        <div className="bg-slate-100/70 p-3 sm:p-6 rounded-b-2xl overflow-x-auto flex justify-center print:p-0 print:bg-white print:rounded-none">
          
          <div
            ref={printRef}
            id="printable-receipt-card"
            className="printable-area w-full max-w-[210mm] bg-white border border-slate-200 rounded-xl shadow-lg p-5 sm:p-8 text-slate-900 font-sans leading-normal text-xs flex flex-col justify-between print:shadow-none print:border-none print:w-full print:min-h-0 print:p-0 print:m-0 print:rounded-none"
          >
            <div>
              {/* Header Section */}
              <div className="receipt-section flex justify-between items-start border-b border-slate-200 pb-3 mb-3.5">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2.5">
                    <img
                      src="/logo.svg"
                      alt="My Eyes Logo"
                      className="h-8 w-auto object-contain"
                    />
                    <div>
                      <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase leading-none">
                        MY EYES
                      </h1>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-tight mt-0.5">
                        Optical Store &amp; Custom Lens Fitting Lab
                      </p>
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-500 pt-0.5">
                    Website: www.myeyes.pk · Email: myeyes2026@gmail.com · Phone: +92 339 0103262
                  </p>
                </div>

                <div className="text-right space-y-0.5">
                  <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase block">
                    Order Receipt / Invoice
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 font-mono tracking-tight leading-none">
                    #{displayOrderNo}
                  </h2>
                </div>
              </div>

              {/* Order Meta & Customer Info Grid */}
              <div className="receipt-section grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-slate-50/60 border border-slate-200 rounded-xl p-3.5 mb-3.5">
                
                {/* Order Information */}
                <div className="space-y-2">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200/80 pb-1">
                    Order Information
                  </h3>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">Order Date:</span>
                      <span className="font-medium text-slate-800 text-right">{orderDate} at {orderTime}</span>
                    </div>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">Order Status:</span>
                      <span className="font-medium text-slate-800 text-right">
                        {order.status === "DELIVERED" ? (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold px-2 py-0.5 rounded-md inline-block">
                            Delivered
                          </span>
                        ) : order.status === "SHIPPED" || order.status === "PROCESSING" ? (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold px-2 py-0.5 rounded-md inline-block">
                            {order.status === "PROCESSING" ? "In Lab Fitting" : "Shipped"}
                          </span>
                        ) : (
                          <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold px-2 py-0.5 rounded-md inline-block">
                            {order.status}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">Payment Method:</span>
                      <span className="font-medium text-slate-800 text-right">{getFriendlyPaymentMethod(order.paymentMethod)}</span>
                    </div>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">Payment Status:</span>
                      <span className="font-medium text-slate-800 text-right">
                        {isPaid ? (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold px-2 py-0.5 rounded-md inline-block">
                            Paid (Verified)
                          </span>
                        ) : order.paymentMethod === "COD" ? (
                          <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold px-2 py-0.5 rounded-md inline-block">
                            Cash on Delivery
                          </span>
                        ) : isPending ? (
                          <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold px-2 py-0.5 rounded-md inline-block">
                            Pending Verification
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-semibold px-2 py-0.5 rounded-md inline-block">
                            {order.paymentStatus || "Unpaid"}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="space-y-2">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200/80 pb-1">
                    Customer Details
                  </h3>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">Customer Name:</span>
                      <span className="font-medium text-slate-800 text-right">{order.customerName}</span>
                    </div>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">Email:</span>
                      <span className="font-medium text-slate-800 text-right truncate max-w-[180px]">{order.customerEmail}</span>
                    </div>
                    {(order.customerPhone || order.phone) && (
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">Phone:</span>
                        <span className="font-mono font-medium text-slate-800 text-right">
                          {order.customerPhone || order.phone}
                        </span>
                      </div>
                    )}
                    <div className="pt-0.5 border-t border-slate-200/60">
                      <span className="font-semibold uppercase tracking-wider text-slate-400 text-[10px] block mb-0.5">
                        Delivery Address:
                      </span>
                      <p className="font-medium text-slate-800 leading-snug">
                        {order.shippingAddress || "N/A"}, {order.shippingCity || order.city || ""}{" "}
                        {order.postalCode ? `- ${order.postalCode}` : ""}
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Itemized Order Table */}
              <div className="receipt-section mb-3.5">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Ordered Products &amp; Services
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-2 px-2.5">Product</th>
                        <th className="py-2 px-2.5">Specs / Lens</th>
                        <th className="py-2 px-2.5 text-center">Qty</th>
                        <th className="py-2 px-2.5 text-right">Unit Price</th>
                        <th className="py-2 px-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800 text-xs">
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

                        const totalPrice = unitPrice * item.quantity;
                        const itemFrameImg = item.frameImage || getFirstImage(item.product?.images);

                        return (
                          <tr key={item.id} className="receipt-table-row border-b border-slate-100 align-top">
                            <td className="py-2.5 px-2.5">
                              <div className="flex items-start gap-2.5">
                                <div className="w-10 h-10 rounded-lg border border-slate-200 bg-slate-50 p-0.5 shrink-0 flex items-center justify-center overflow-hidden">
                                  {itemFrameImg ? (
                                    <img
                                      src={itemFrameImg}
                                      alt={item.frameName || item.product?.name || "Eyewear Frame"}
                                      className="w-full h-full object-contain"
                                      onError={(e) => {
                                        (e.currentTarget as HTMLImageElement).src = "/placeholder-frame.png";
                                      }}
                                    />
                                  ) : (
                                    <Glasses className="w-5 h-5 text-slate-400" />
                                  )}
                                </div>
                                <div className="flex flex-col gap-0.5 min-w-0">
                                  <span className="font-bold text-slate-900 text-xs leading-snug">
                                    {item.frameName || item.product?.name || "Eyewear Frame"}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono leading-none">
                                    ID: {item.frameId || item.productId?.slice(0, 8)}
                                  </span>
                                  {frameCost !== null && (
                                    <span className="text-[11px] font-medium text-slate-600 leading-tight pt-0.5">
                                      Frame: {formatPrice(frameCost)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 px-2.5">
                              {item.prescription || humanLensName ? (
                                <div className="flex flex-col gap-1 text-xs">
                                  {visionType && (
                                    <span className="inline-block w-fit px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 text-[9px] font-bold uppercase tracking-wide border border-amber-200/80 leading-none">
                                      {visionType}
                                    </span>
                                  )}
                                  <span className="font-bold text-slate-900 text-xs leading-snug">
                                    {humanLensName}
                                  </span>
                                  {lensCost !== null && (
                                    <span className="text-[11px] font-medium text-slate-500 leading-tight">
                                      Lens: {formatPrice(lensCost)}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-500 text-xs leading-snug">Standard Frame Only</span>
                              )}
                            </td>
                            <td className="py-2.5 px-2.5 text-center font-semibold text-slate-900">{item.quantity}</td>
                            <td className="py-2.5 px-2.5 text-right font-mono text-slate-700">{formatPrice(unitPrice)}</td>
                            <td className="py-2.5 px-2.5 text-right font-bold font-mono text-slate-900">
                              {formatPrice(totalPrice)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Optical Prescription Specification Section (If Present) */}
              {order.items.some((i) => i.prescription) && (
                <div className="receipt-rx-box mb-3.5 bg-slate-50/60 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center gap-1.5 border-b border-slate-200/80 pb-1.5">
                    <Glasses className="w-3.5 h-3.5 text-amber-600" />
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Optical Prescription Specifications (Rx)
                    </h3>
                  </div>

                  {order.items
                    .filter((i) => i.prescription)
                    .map((item) => {
                      const rx = item.prescription!;
                      const rxLensName = item.lensPackageName || item.selectedLensName || rx.lensType || "Standard Prescription Lenses";
                      const rxVisionType = item.visionType || (rxLensName.toLowerCase().includes("progressive") ? "Progressive" : "Single Vision");

                      return (
                        <div key={item.id} className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs flex-wrap gap-2">
                            <span className="font-bold text-slate-900">
                              {item.frameName || item.product?.name} — [{rxVisionType}] {rxLensName}
                            </span>
                            <span className="bg-slate-100 text-slate-700 border border-slate-200 font-bold text-[11px] px-2 py-0.5 rounded-md">
                              Pupillary Distance (PD): {rx.pd} mm
                            </span>
                          </div>

                          <div className="overflow-x-auto rounded-lg border border-slate-200">
                            <table className="w-full text-center font-mono text-xs border-collapse">
                              <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                                <tr>
                                  <th className="py-1.5 px-2.5 text-left font-sans">Eye</th>
                                  <th className="py-1.5 px-2.5">Sphere (SPH)</th>
                                  <th className="py-1.5 px-2.5">Cylinder (CYL)</th>
                                  <th className="py-1.5 px-2.5">Axis</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-slate-100 text-slate-800">
                                <tr>
                                  <td className="py-1.5 px-2.5 text-left font-sans font-semibold text-slate-900 border-r border-slate-100">
                                    Right Eye (OD)
                                  </td>
                                  <td className="py-1.5 px-2.5 border-r border-slate-100">{rx.odSph.toFixed(2)}</td>
                                  <td className="py-1.5 px-2.5 border-r border-slate-100">
                                    {rx.odCyl !== null && rx.odCyl !== undefined ? rx.odCyl.toFixed(2) : "0.00"}
                                  </td>
                                  <td className="py-1.5 px-2.5">{rx.odAxis !== null && rx.odAxis !== undefined ? `${rx.odAxis}°` : "-"}</td>
                                </tr>
                                <tr>
                                  <td className="py-1.5 px-2.5 text-left font-sans font-semibold text-slate-900 border-r border-slate-100">
                                    Left Eye (OS)
                                  </td>
                                  <td className="py-1.5 px-2.5 border-r border-slate-100">{rx.osSph.toFixed(2)}</td>
                                  <td className="py-1.5 px-2.5 border-r border-slate-100">
                                    {rx.osCyl !== null && rx.osCyl !== undefined ? rx.osCyl.toFixed(2) : "0.00"}
                                  </td>
                                  <td className="py-1.5 px-2.5">{rx.osAxis !== null && rx.osAxis !== undefined ? `${rx.osAxis}°` : "-"}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* Pricing Breakdown & Grand Total */}
              <div className="receipt-totals-box flex justify-end mb-3">
                <div className="w-64 space-y-1 text-right text-xs">
                  <div className="flex justify-between text-slate-600 border-b border-slate-100 pb-1">
                    <span className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">Frame(s) Total:</span>
                    <span className="font-mono font-medium text-slate-800">{formatPrice(totalFrameCost)}</span>
                  </div>
                  {totalLensCost > 0 && (
                    <div className="flex justify-between text-slate-600 border-b border-slate-100 pb-1">
                      <span className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">Lens(es) Total:</span>
                      <span className="font-mono font-medium text-slate-800">{formatPrice(totalLensCost)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600 border-b border-slate-100 pb-1">
                    <span className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">Subtotal:</span>
                    <span className="font-mono font-medium text-slate-800">{formatPrice(itemsSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 border-b border-slate-100 pb-1">
                    <span className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">Standard Shipping:</span>
                    <span className="font-mono font-medium text-slate-800">{formatPrice(shippingFee)}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-bold text-sm pt-1 border-b border-slate-300 pb-1">
                    <span>Grand Total:</span>
                    <span className="font-mono text-sm font-extrabold text-slate-900">{formatPrice(order.totalAmount || grandTotal)}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer Section */}
            <div className="receipt-section border-t border-slate-200 pt-3 mt-3 text-center space-y-1">
              <p className="font-semibold text-slate-800 text-[11px]">
                Thank you for choosing My Eyes Optical Studio.
              </p>
              <p className="text-[9px] text-slate-500">
                For optical queries or support regarding this order receipt, contact our lab team at support@myeyes.pk or +92 339 0103262.
              </p>
              <div className="pt-0.5 text-[8px] text-slate-400 font-mono uppercase tracking-widest flex items-center justify-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                Verified Electronic Invoice · My Eyes Store PK
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Global CSS for Clean, Ink-Friendly Strict Single-Page A4 Printing */}
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 10mm 12mm;
        }

        @media print {
          *, *::before, *::after {
            box-sizing: border-box !important;
          }

          html, body {
            height: auto !important;
            background: #ffffff !important;
            color: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Hide all app navigation, header buttons, modal backdrops, and close icons */
          body > *:not(.printable-modal-wrapper),
          header, nav, aside, footer, button, .print\\:hidden, .no-print {
            display: none !important;
          }

          /* Remove modal backdrop, overlays & shadows */
          .fixed.inset-0 {
            position: static !important;
            background: #ffffff !important;
            padding: 0 !important;
            box-shadow: none !important;
            overflow: visible !important;
          }

          #printable-receipt-canvas {
            display: block !important;
            visibility: visible !important;
            position: relative !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: auto !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
            color: #0f172a !important;
          }

          #printable-receipt-canvas * {
            visibility: visible !important;
          }

          /* Prevent awkward mid-element splits across pages */
          .receipt-section,
          .receipt-table-row,
          .receipt-rx-box,
          .receipt-totals-box,
          table, tr, td, th {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          /* Ensure thin borders stay sharp without printing solid blocks */
          table, tr, td, th, div {
            border-color: #e2e8f0 !important;
          }
        }
      `}</style>
    </div>
  );
}

export { A4ReceiptModal, A4ReceiptModal as OrderReceiptModal };
