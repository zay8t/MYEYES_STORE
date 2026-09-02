"use client";

import React, { useRef } from "react";
import { X, Printer, Download, Glasses, CheckCircle2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";

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
  framePrice: number | null;
  lensBasePriceKey: string | null;
  lensBasePriceValue: number | null;
  lensMultiplier: number | null;
  lensFinalPrice: number | null;
  isAsymmetricRx?: boolean | null;
  rightEyeLensPrice?: number | null;
  leftEyeLensPrice?: number | null;
  rightMultiplier?: number | null;
  leftMultiplier?: number | null;
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

interface A4ReceiptModalProps {
  order: OrderReceiptData;
  onClose: () => void;
}

export default function A4ReceiptModal({ order, onClose }: A4ReceiptModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const displayOrderNo = order.orderNumber || "00000000";
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
    window.print();
  };

  const handleDownloadPdf = () => {
    // Triggers direct backend A4 PDF streaming
    window.open(`/api/admin/orders/${order.id}/pdf`, "_blank");
  };

  const shippingFee = order.shippingFee !== undefined ? order.shippingFee : 250;
  const itemsSubtotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const getFriendlyPaymentMethod = (method?: string | null) => {
    switch (method) {
      case "COD":
        return "Cash on Delivery (COD)";
      case "EASYPAISA":
        return "EasyPaisa / JazzCash Direct Transfer";
      case "ALFALAH":
        return "Bank Alfalah IBFT";
      default:
        return method || "Direct Payment";
    }
  };

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex justify-center p-2 sm:p-6 print:p-0 print:bg-white print:static print:inset-auto">
      
      {/* Modal Dialog Backdrop Click (Hidden when printing) */}
      <div
        className="fixed inset-0 print:hidden cursor-pointer"
        onClick={onClose}
      />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-4xl flex flex-col my-auto print:my-0 print:max-w-none">
        
        {/* Modal Action Bar (Completely Light, Minimal, and Ink-Friendly) */}
        <div className="bg-white border-b border-slate-200 text-slate-900 p-4 rounded-t-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Glasses className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-slate-900 block">
                Receipt / Invoice Preview
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
              className="bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer ml-1"
              title="Close modal"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Canvas Wrapper (Styled as Minimal Light A4 Document) */}
        <div className="bg-slate-100/70 p-4 sm:p-8 rounded-b-2xl overflow-x-auto flex justify-center print:p-0 print:bg-white print:rounded-none">
          
          <div
            ref={printRef}
            id="printable-receipt-canvas"
            className="printable-area w-[210mm] min-h-[297mm] bg-white border border-slate-200/80 shadow-lg p-10 text-slate-900 font-sans leading-relaxed text-xs flex flex-col justify-between print:shadow-none print:border-none print:w-full print:min-h-0 print:p-8"
          >
            <div>
              {/* Header Section */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-6 mb-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <img
                      src="/logo.svg"
                      alt="My Eyes Logo"
                      className="h-10 w-auto object-contain"
                    />
                    <div>
                      <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
                        MY EYES
                      </h1>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                        Optical Store &amp; Custom Lens Fitting Lab
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 pt-1">
                    Website: www.myeyes.pk · Email: myeyes2026@gmail.com · Phone: +92 339 0103262
                  </p>
                </div>

                <div className="text-right space-y-1">
                  <h2 className="text-xl font-bold tracking-tight text-slate-800 uppercase">
                    Order Receipt / Invoice
                  </h2>
                  <div className="pt-1.5">
                    <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Customer Order No
                    </span>
                    <span className="text-lg font-mono font-black text-slate-900">
                      {displayOrderNo}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Meta & Customer Info Grid */}
              <div className="grid grid-cols-2 gap-5 bg-slate-50/50 border border-slate-200 rounded-xl p-5 mb-6">
                
                {/* Order Details */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-2">
                    Order Information
                  </h3>
                  <div className="space-y-1.5">
                    <p className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Order Date:</span>
                      <span className="text-sm font-medium text-slate-800 text-right">{orderDate} at {orderTime}</span>
                    </p>
                    <p className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Order Status:</span>
                      <span className="text-sm font-semibold uppercase text-slate-900 text-right">{order.status}</span>
                    </p>
                    <p className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Payment Method:</span>
                      <span className="text-sm font-medium text-slate-800 text-right">{getFriendlyPaymentMethod(order.paymentMethod)}</span>
                    </p>
                    <p className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Payment Status:</span>
                      <span className="text-sm font-bold uppercase text-slate-900 text-right">
                        {order.paymentStatus === "PAID (VERIFIED)" || order.paymentStatus === "PAID"
                          ? "PAID (VERIFIED)"
                          : order.paymentStatus === "FAILED" || order.paymentStatus === "PAYMENT FAILED / REJECTED"
                          ? "PAYMENT FAILED / UNDER REVIEW"
                          : order.paymentMethod === "COD"
                          ? "CASH ON DELIVERY (PENDING DELIVERY)"
                          : "PENDING VERIFICATION"}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-2">
                    Customer Details
                  </h3>
                  <div className="space-y-1.5">
                    <p className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Customer:</span>
                      <span className="text-sm font-bold text-slate-900 text-right">{order.customerName}</span>
                    </p>
                    <p className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email:</span>
                      <span className="text-sm font-medium text-slate-800 text-right">{order.customerEmail}</span>
                    </p>
                    {order.customerPhone && (
                      <p className="flex items-baseline justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone:</span>
                        <span className="text-sm font-mono font-medium text-slate-800 text-right">{order.customerPhone}</span>
                      </p>
                    )}
                    <div className="pt-1 border-t border-slate-100">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Delivery Address:</span>
                      <p className="text-sm font-medium text-slate-800 leading-snug">
                        {order.shippingAddress || "N/A"}, {order.shippingCity || order.city || ""}{" "}
                        {order.postalCode ? `- ${order.postalCode}` : ""}
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Itemized Order Table */}
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                  Ordered Products &amp; Services
                </h3>
                <table className="w-full border-collapse text-left">
                  <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-y border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Product</th>
                      <th className="py-2.5 px-3">Lens / Package Specs</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 border-b border-slate-200 text-slate-800">
                    {order.items.map((item) => (
                      <tr key={item.id} className="align-top">
                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-900 block">{item.product?.name || "Eyewear Frame"}</span>
                          <span className="text-[10px] text-slate-500 font-mono">ID: {item.productId.slice(0, 8)}</span>
                          {item.framePrice !== null && (
                            <span className="text-[10px] text-slate-500 block mt-0.5">Frame: {formatPrice(item.framePrice)}</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {item.prescription ? (
                            <div className="space-y-0.5">
                              <span className="font-semibold text-slate-900 block">
                                {item.prescription.lensType}
                              </span>
                              {item.isAsymmetricRx ? (
                                <div className="mt-1 space-y-0.5">
                                  <span className="text-[9px] font-medium text-amber-800 bg-amber-50/70 border border-amber-200/80 px-1.5 py-0.5 rounded block uppercase w-max">
                                    OD: Tier {item.lensBasePriceKey} × {item.rightMultiplier}x → {formatPrice(item.rightEyeLensPrice || 0)}
                                  </span>
                                  <span className="text-[9px] font-medium text-amber-800 bg-amber-50/70 border border-amber-200/80 px-1.5 py-0.5 rounded block uppercase w-max">
                                    OS: Tier {item.lensBasePriceKey} × {item.leftMultiplier}x → {formatPrice(item.leftEyeLensPrice || 0)}
                                  </span>
                                  <span className="text-[10px] text-slate-500 block">Combined Lens: {formatPrice(item.lensFinalPrice || 0)}</span>
                                </div>
                              ) : (
                                <>
                                  {item.lensBasePriceKey && (
                                    <span className="text-[10px] font-medium text-amber-800 bg-amber-50/70 border border-amber-200/80 px-1.5 py-0.5 rounded inline-block uppercase mt-1">
                                      Tier {item.lensBasePriceKey}: {formatPrice(item.lensBasePriceValue || 0)} × {item.lensMultiplier}x
                                    </span>
                                  )}
                                  {item.lensFinalPrice !== null && (
                                    <span className="text-[10px] text-slate-500 block">Lens: {formatPrice(item.lensFinalPrice)}</span>
                                  )}
                                </>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-500">Standard Demo Frame Only</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-slate-900">{item.quantity}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700">{formatPrice(item.price)}</td>
                        <td className="py-3 px-3 text-right font-bold font-mono text-slate-900">
                          {formatPrice(item.price * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Optical Prescription Specification Section (If Present) */}
              {order.items.some((i) => i.prescription) && (
                <div className="mb-6 bg-slate-50/50 p-5 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <Glasses className="w-4 h-4 text-amber-600" />
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Optical Prescription Specifications (Rx)
                    </h3>
                  </div>

                  {order.items
                    .filter((i) => i.prescription)
                    .map((item) => {
                      const rx = item.prescription!;
                      return (
                        <div key={item.id} className="space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-900">
                              {item.product?.name} — {rx.lensType}
                            </span>
                            <span className="font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                              Pupillary Distance (PD): {rx.pd} mm
                            </span>
                          </div>

                          <table className="w-full text-center font-mono text-xs border border-slate-200 rounded-lg overflow-hidden">
                            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase border-y border-slate-200">
                              <tr>
                                <th className="py-2 px-3 text-left">Eye</th>
                                <th className="py-2 px-3">Sphere (SPH)</th>
                                <th className="py-2 px-3">Cylinder (CYL)</th>
                                <th className="py-2 px-3">Axis</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100 text-slate-800">
                              <tr>
                                <td className="py-2 px-3 text-left font-sans font-semibold text-slate-900">Right Eye (OD)</td>
                                <td className="py-2 px-3">{rx.odSph.toFixed(2)}</td>
                                <td className="py-2 px-3">{rx.odCyl !== null && rx.odCyl !== undefined ? rx.odCyl.toFixed(2) : "0.00"}</td>
                                <td className="py-2 px-3">{rx.odAxis !== null && rx.odAxis !== undefined ? `${rx.odAxis}°` : "-"}</td>
                              </tr>
                              <tr>
                                <td className="py-2 px-3 text-left font-sans font-semibold text-slate-900">Left Eye (OS)</td>
                                <td className="py-2 px-3">{rx.osSph.toFixed(2)}</td>
                                <td className="py-2 px-3">{rx.osCyl !== null && rx.osCyl !== undefined ? rx.osCyl.toFixed(2) : "0.00"}</td>
                                <td className="py-2 px-3">{rx.osAxis !== null && rx.osAxis !== undefined ? `${rx.osAxis}°` : "-"}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* Pricing Breakdown & Grand Total */}
              <div className="flex justify-end mb-8">
                <div className="w-64 space-y-2 text-right">
                  <div className="flex justify-between text-slate-600 border-b border-slate-100 pb-1">
                    <span className="text-xs font-medium">Subtotal:</span>
                    <span className="font-mono font-medium text-slate-800">{formatPrice(itemsSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 border-b border-slate-100 pb-1">
                    <span className="text-xs font-medium">Standard Shipping:</span>
                    <span className="font-mono font-medium text-slate-800">Rs. {shippingFee}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-bold text-sm pt-1 border-b border-slate-300 pb-1">
                    <span>Grand Total:</span>
                    <span className="font-mono text-base font-extrabold text-slate-900">{formatPrice(order.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Section */}
            <div className="border-t border-slate-200 pt-6 mt-6 text-center space-y-2">
              <p className="font-semibold text-slate-800 text-xs">
                Thank you for choosing My Eyes Optical Studio.
              </p>
              <p className="text-[10px] text-slate-500">
                For optical queries or support regarding this order receipt, contact our lab team at support@myeyes.pk or +92 339 0103262.
              </p>
              <div className="pt-2 text-[9px] text-slate-400 font-mono uppercase tracking-widest flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Verified Electronic Invoice · My Eyes Store PK
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Global CSS for Clean, Ink-Friendly A4 Printing */}
      <style jsx global>{`
        @media print {
          /* Hide all app navigation, header buttons, and modal overlays */
          body > *:not(.printable-modal-wrapper),
          header, nav, aside, button, .no-print {
            display: none !important;
          }

          body {
            background: #ffffff !important;
            color: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Remove modal backdrop & shadows */
          .fixed.inset-0 {
            position: static !important;
            background: transparent !important;
            padding: 0 !important;
            box-shadow: none !important;
          }

          #printable-receipt-canvas {
            display: block !important;
            visibility: visible !important;
            position: relative !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 8mm !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
            color: #0f172a !important;
          }

          #printable-receipt-canvas * {
            visibility: visible !important;
          }
        }
      `}</style>
    </div>
  );
}

export { A4ReceiptModal };
