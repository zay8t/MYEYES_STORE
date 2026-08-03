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
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED";
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
    <div className="fixed inset-0 z-[200] overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex justify-center p-2 sm:p-6 print:p-0 print:bg-white print:static print:inset-auto">
      
      {/* Modal Dialog Backdrop Click (Hidden when printing) */}
      <div
        className="fixed inset-0 print:hidden cursor-pointer"
        onClick={onClose}
      />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-4xl flex flex-col my-auto print:my-0 print:max-w-none">
        
        {/* Modal Action Bar (Hidden when printing) */}
        <div className="bg-slate-900 text-white p-4 rounded-t-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg print:hidden">
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-sm tracking-tight text-white flex items-center gap-2">
              <Glasses className="w-4 h-4 text-amber-400" />
              Receipt / Invoice Preview — Order #{displayOrderNo}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs border border-slate-700"
            >
              <Printer className="w-3.5 h-3.5" /> Print Receipt
            </button>

            <button
              onClick={handleDownloadPdf}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" /> Download PDF
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer ml-1"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Print Printable Canvas Wrapper (Styled as A4 Document) */}
        <div className="bg-slate-200/80 p-4 sm:p-8 rounded-b-2xl overflow-x-auto flex justify-center print:p-0 print:bg-white print:rounded-none">
          
          <div
            ref={printRef}
            id="printable-receipt-canvas"
            className="printable-area w-[210mm] min-h-[297mm] bg-white shadow-2xl p-10 text-slate-900 font-sans leading-relaxed text-xs flex flex-col justify-between print:shadow-none print:w-full print:min-h-0 print:p-8"
          >
            <div>
              {/* Header Section */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <img
                      src="/logo.svg"
                      alt="My Eyes Logo"
                      className="h-10 w-auto object-contain"
                    />
                    <div>
                      <h1 className="text-xl font-black tracking-tight text-slate-950 uppercase">
                        MY EYES
                      </h1>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        Optical Store & Custom Lens Fitting Lab
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 pt-1">
                    Website: www.myeyes.pk · Email: myeyes2026@gmail.com · Phone: +92 300 6694928
                  </p>
                </div>

                <div className="text-right space-y-1">
                  <span className="inline-block bg-slate-950 text-white font-extrabold text-[11px] px-3 py-1 rounded uppercase tracking-wider">
                    ORDER RECEIPT / INVOICE
                  </span>
                  <div className="pt-2">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">
                      Customer Order No
                    </span>
                    <span className="text-lg font-mono font-black text-slate-950">
                      {displayOrderNo}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Meta & Customer Info Grid */}
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-200 mb-6">
                
                {/* Order Details */}
                <div className="space-y-2">
                  <h3 className="font-extrabold text-[11px] uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                    Order Information
                  </h3>
                  <div className="space-y-1 text-slate-700">
                    <p><strong className="text-slate-900">Order Date:</strong> {orderDate} at {orderTime}</p>
                    <p><strong className="text-slate-900">Order Status:</strong> <span className="uppercase font-bold text-slate-950">{order.status}</span></p>
                    <p><strong className="text-slate-900">Payment Method:</strong> {getFriendlyPaymentMethod(order.paymentMethod)}</p>
                    <p><strong className="text-slate-900">Payment Status:</strong> {order.status === "DELIVERED" ? "PAID" : "CONFIRMED / PENDING FULFILLMENT"}</p>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="space-y-2">
                  <h3 className="font-extrabold text-[11px] uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                    Customer Details
                  </h3>
                  <div className="space-y-1 text-slate-700">
                    <p className="font-bold text-slate-950 text-sm">{order.customerName}</p>
                    <p><strong className="text-slate-900">Email:</strong> {order.customerEmail}</p>
                    {order.customerPhone && <p><strong className="text-slate-900">Phone:</strong> {order.customerPhone}</p>}
                    <p className="pt-0.5">
                      <strong className="text-slate-900">Delivery Address:</strong><br />
                      {order.shippingAddress || "N/A"}, {order.shippingCity || order.city || ""}{" "}
                      {order.postalCode ? `- ${order.postalCode}` : ""}
                    </p>
                  </div>
                </div>

              </div>

              {/* Itemized Order Table */}
              <div className="mb-6">
                <h3 className="font-extrabold text-[11px] uppercase tracking-wider text-slate-900 mb-2">
                  Ordered Products & Services
                </h3>
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold text-[10px] uppercase tracking-wider">
                      <th className="py-2.5 px-3 rounded-l">Product</th>
                      <th className="py-2.5 px-3">Lens / Package Specs</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right rounded-r">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 border-b border-slate-200 text-slate-800">
                    {order.items.map((item) => (
                      <tr key={item.id} className="align-top">
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-950 block">{item.product?.name || "Eyewear Frame"}</span>
                          <span className="text-[10px] text-slate-500 font-mono">ID: {item.productId.slice(0, 8)}</span>
                          {item.framePrice !== null && (
                            <span className="text-[10px] text-slate-500 block mt-0.5">Frame Price: {formatPrice(item.framePrice)}</span>
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
                                  <span className="text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded block uppercase w-max">
                                    OD: Tier {item.lensBasePriceKey} × {item.rightMultiplier}x → {formatPrice(item.rightEyeLensPrice || 0)}
                                  </span>
                                  <span className="text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded block uppercase w-max">
                                    OS: Tier {item.lensBasePriceKey} × {item.leftMultiplier}x → {formatPrice(item.leftEyeLensPrice || 0)}
                                  </span>
                                  <span className="text-[10px] text-slate-500 block">Combined Lens Total: {formatPrice(item.lensFinalPrice || 0)}</span>
                                </div>
                              ) : (
                                <>
                                  {item.lensBasePriceKey && (
                                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded inline-block uppercase mt-1">
                                      Tier {item.lensBasePriceKey}: {formatPrice(item.lensBasePriceValue || 0)} × {item.lensMultiplier}x
                                    </span>
                                  )}
                                  {item.lensFinalPrice !== null && (
                                    <span className="text-[10px] text-slate-500 block">Lens Price: {formatPrice(item.lensFinalPrice)}</span>
                                  )}
                                </>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-500">Standard Demo Frame Only</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-bold">{item.quantity}</td>
                        <td className="py-3 px-3 text-right font-mono">{formatPrice(item.price)}</td>
                        <td className="py-3 px-3 text-right font-bold font-mono text-slate-950">
                          {formatPrice(item.price * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Optical Prescription Specification Section (If Present) */}
              {order.items.some((i) => i.prescription) && (
                <div className="mb-6 bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <Glasses className="w-4 h-4 text-slate-900" />
                    <h3 className="font-extrabold text-[11px] uppercase tracking-wider text-slate-950">
                      Optical Prescription Specifications (Rx)
                    </h3>
                  </div>

                  {order.items
                    .filter((i) => i.prescription)
                    .map((item) => {
                      const rx = item.prescription!;
                      return (
                        <div key={item.id} className="space-y-2">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="font-bold text-slate-950">
                              {item.product?.name} — {rx.lensType}
                            </span>
                            <span className="font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                              Pupillary Distance (PD): {rx.pd} mm
                            </span>
                          </div>

                          <table className="w-full text-center font-mono text-[11px] border border-slate-200 rounded overflow-hidden">
                            <thead className="bg-slate-200 text-slate-800 text-[10px] font-sans font-bold uppercase">
                              <tr>
                                <th className="py-1.5 px-2 text-left">Eye</th>
                                <th className="py-1.5 px-2">Sphere (SPH)</th>
                                <th className="py-1.5 px-2">Cylinder (CYL)</th>
                                <th className="py-1.5 px-2">Axis</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-150">
                              <tr>
                                <td className="py-1.5 px-2 text-left font-sans font-bold text-slate-900">Right Eye (OD)</td>
                                <td className="py-1.5 px-2 font-semibold">{rx.odSph.toFixed(2)}</td>
                                <td className="py-1.5 px-2 font-semibold">{rx.odCyl !== null && rx.odCyl !== undefined ? rx.odCyl.toFixed(2) : "0.00"}</td>
                                <td className="py-1.5 px-2 font-semibold">{rx.odAxis !== null && rx.odAxis !== undefined ? `${rx.odAxis}°` : "-"}</td>
                              </tr>
                              <tr>
                                <td className="py-1.5 px-2 text-left font-sans font-bold text-slate-900">Left Eye (OS)</td>
                                <td className="py-1.5 px-2 font-semibold">{rx.osSph.toFixed(2)}</td>
                                <td className="py-1.5 px-2 font-semibold">{rx.osCyl !== null && rx.osCyl !== undefined ? rx.osCyl.toFixed(2) : "0.00"}</td>
                                <td className="py-1.5 px-2 font-semibold">{rx.osAxis !== null && rx.osAxis !== undefined ? `${rx.osAxis}°` : "-"}</td>
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
                    <span>Subtotal:</span>
                    <span className="font-mono font-medium">{formatPrice(itemsSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 border-b border-slate-100 pb-1">
                    <span>Standard Shipping:</span>
                    <span className="font-mono font-medium">Rs. {shippingFee}</span>
                  </div>
                  <div className="flex justify-between text-slate-950 font-black text-sm pt-1 border-b-2 border-slate-900 pb-1">
                    <span>Grand Total:</span>
                    <span className="font-mono">{formatPrice(order.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Section */}
            <div className="border-t border-slate-200 pt-6 mt-6 text-center space-y-2">
              <p className="font-bold text-slate-900 text-xs">
                Thank you for choosing My Eyes.
              </p>
              <p className="text-[10px] text-slate-500">
                For optical queries or support regarding this order receipt, contact our support team at support@myeyes.pk.
              </p>
              <div className="pt-2 text-[9px] text-slate-400 font-mono uppercase tracking-widest flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Verified Electronic Invoice · My Eyes Store PK
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Global CSS for Clean A4 Printing */}
      <style jsx global>{`
        @media print {
          /* Hide app navigation, header buttons, and modal overlays */
          body > *:not(.printable-modal-wrapper),
          header, nav, aside, button, .no-print {
            display: none !important;
          }

          body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Ensure modal backdrop doesn't obscure or hide print area */
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
            padding: 10mm !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
            color: #000000 !important;
          }

          #printable-receipt-canvas * {
            visibility: visible !important;
          }
        }
      `}</style>
    </div>
  );
}
