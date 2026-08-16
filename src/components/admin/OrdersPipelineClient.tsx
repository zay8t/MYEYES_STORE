"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Glasses,
  Search,
  FileText,
  Download,
} from "lucide-react";
import { formatPrice, cn } from "@/lib/utils";
import OrderDetailsDrawer from "./OrderDetailsDrawer";
import A4ReceiptModal, { OrderReceiptData } from "@/components/A4ReceiptModal";
import { OrderStatus } from "@prisma/client";
import { updateOrderStatusAction, updatePaymentStatusAction } from "@/app/actions/admin";
import Toast from "./Toast";

export interface OrdersPipelineClientProps {
  initialOrders: OrderReceiptData[];
}

const FILTER_STAGES = [
  { id: "ALL", label: "All Orders" },
  { id: "PENDING", label: "Pending Prescription" },
  { id: "PROCESSING", label: "Lab Cutting" },
  { id: "SHIPPED", label: "Dispatched" },
  { id: "DELIVERED", label: "Delivered" },
];

export default function OrdersPipelineClient({ initialOrders }: OrdersPipelineClientProps) {
  const [orders, setOrders] = useState<OrderReceiptData[]>(initialOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeStage, setActiveStage] = useState("ALL");
  const [selectedDrawerOrder, setSelectedDrawerOrder] = useState<OrderReceiptData | null>(null);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<OrderReceiptData | null>(null);

  // 300ms Debounce Search Implementation
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Sync initialOrders if RSC revalidates
  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  const [toast, setToast] = useState<{ message: string; type?: "success" | "error" | "info" } | null>(null);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    const previousOrders = [...orders];
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as OrderReceiptData["status"] } : o))
    );
    setToast({ message: `Order #${orderId.slice(0, 8)} status updated to ${newStatus}`, type: "success" });

    const result = await updateOrderStatusAction(orderId, newStatus);
    if (!result.success) {
      setOrders(previousOrders);
      setToast({ message: result.error || "Failed to update order status", type: "error" });
    }
  };

  const handlePaymentStatusChange = async (orderId: string, newPaymentStatus: string) => {
    const previousOrders = [...orders];
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, paymentStatus: newPaymentStatus } : o))
    );
    setToast({ message: `Order #${orderId.slice(0, 8)} payment status updated to ${newPaymentStatus}`, type: "success" });

    const result = await updatePaymentStatusAction(orderId, newPaymentStatus);
    if (!result.success) {
      setOrders(previousOrders);
      setToast({ message: result.error || "Failed to update payment status", type: "error" });
    }
  };

  // Filtered Orders Calculation
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (activeStage !== "ALL" && order.status !== activeStage) {
        return false;
      }
      if (debouncedQuery.trim() !== "") {
        const q = debouncedQuery.toLowerCase();
        const nameMatch = order.customerName?.toLowerCase().includes(q);
        const emailMatch = order.customerEmail?.toLowerCase().includes(q);
        const idMatch = order.id?.toLowerCase().includes(q);
        const orderNoMatch = order.orderNumber?.toLowerCase().includes(q);
        const phoneMatch = order.customerPhone?.toLowerCase().includes(q);
        return nameMatch || emailMatch || idMatch || orderNoMatch || phoneMatch;
      }
      return true;
    });
  }, [orders, activeStage, debouncedQuery]);

  // Metrics
  const totalOrders = orders.length;
  const pendingCount = orders.filter((o) => o.status === "PENDING" || o.status === "PROCESSING").length;
  const dispatchedCount = orders.filter((o) => o.status === "SHIPPED" || o.status === "DELIVERED").length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-50 text-amber-900 border-amber-200";
      case "PROCESSING":
        return "bg-blue-50 text-blue-900 border-blue-200";
      case "SHIPPED":
        return "bg-indigo-50 text-indigo-900 border-indigo-200";
      case "DELIVERED":
        return "bg-emerald-50 text-emerald-900 border-emerald-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getPaymentStatusBadgeClass = (status?: string | null) => {
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
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/60 inline-block mb-1">
            OPTICAL ORDER FULFILLMENT
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Prescription Pipeline Suite
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage custom lens grinding, optical verification, and customer delivery receipts
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Total Orders
          </span>
          <p className="text-2xl font-black text-slate-900 font-mono">{totalOrders}</p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 block">
            Pending Lab Queue
          </span>
          <p className="text-2xl font-black text-amber-950 font-mono">{pendingCount}</p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">
            Dispatched / Delivered
          </span>
          <p className="text-2xl font-black text-emerald-950 font-mono">{dispatchedCount}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Pipeline Revenue
          </span>
          <p className="text-2xl font-black text-slate-900 font-mono">{formatPrice(totalRevenue)}</p>
        </div>
      </div>

      {/* Search & Dynamic Status Tabs Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-4">
        {/* Stage Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {FILTER_STAGES.map((stage) => {
            const count =
              stage.id === "ALL"
                ? orders.length
                : orders.filter((o) => o.status === stage.id).length;
            const isActive = activeStage === stage.id;

            return (
              <button
                key={stage.id}
                onClick={() => setActiveStage(stage.id)}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer",
                  isActive
                    ? "bg-amber-500 text-slate-950 font-extrabold shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <span>{stage.label}</span>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-mono",
                    isActive ? "bg-amber-500 text-slate-950" : "bg-slate-200 text-slate-800"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Debounced search by Order #, Customer Name, Email, or Phone..."
            className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:border-slate-900"
          />
        </div>
      </div>

      {/* Desktop Table view (lg and above) */}
      <div className="hidden lg:block rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-700 font-extrabold text-[11px] uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Order # / Date</th>
                <th className="px-6 py-4">Customer Details</th>
                <th className="px-6 py-4">Optical Specs</th>
                <th className="px-6 py-4">Total Amount</th>
                <th className="px-6 py-4">Payment Status</th>
                <th className="px-6 py-4">Pipeline Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 font-medium">
                    No prescription orders found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const hasRx = order.items.some((i) => i.prescription);

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-mono">
                        <span className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200/80 text-slate-900 font-mono font-extrabold text-xs block w-max">
                          {order.orderNumber || "ORDER-000"}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-extrabold text-slate-900">{order.customerName}</p>
                        <p className="text-slate-500 text-[11px]">{order.customerEmail}</p>
                      </td>

                      <td className="px-6 py-4">
                        {hasRx ? (
                          <span className="px-2.5 py-1 rounded bg-amber-50 border border-amber-200 text-amber-900 font-extrabold text-[10px] uppercase inline-flex items-center gap-1">
                            <Glasses className="w-3 h-3 text-amber-600" /> Custom Rx
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-600 font-semibold text-[10px]">
                            Frame Only
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 font-mono font-extrabold text-slate-900">
                        {formatPrice(order.totalAmount)}
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                            {order.paymentMethod || "COD"}
                          </span>
                          <select
                            value={order.paymentStatus || (order.paymentMethod === "COD" ? "PENDING" : "RECEIPT_SUBMITTED")}
                            onChange={(e) => handlePaymentStatusChange(order.id, e.target.value)}
                            className={cn(
                              "px-2.5 py-1 rounded-xl text-[11px] font-extrabold border cursor-pointer focus:outline-none transition-colors",
                              getPaymentStatusBadgeClass(order.paymentStatus || (order.paymentMethod === "COD" ? "PENDING" : "RECEIPT_SUBMITTED"))
                            )}
                          >
                            <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
                            <option value="PAID">PAID</option>
                            <option value="FAILED">FAILED</option>
                            <option value="UNPAID">UNPAID</option>
                            <option value="REFUNDED">REFUNDED</option>
                          </select>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-extrabold border cursor-pointer focus:outline-none",
                            getStatusBadgeClass(order.status)
                          )}
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="PROCESSING">PROCESSING</option>
                          <option value="SHIPPED">SHIPPED</option>
                          <option value="DELIVERED">DELIVERED</option>
                        </select>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedDrawerOrder(order)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold transition-colors cursor-pointer"
                          >
                            Review Rx
                          </button>
                          <button
                            onClick={() => setSelectedReceiptOrder(order)}
                            className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                            title="View Receipt"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <a
                            href={`/api/admin/orders/${order.id}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-xl bg-slate-900 hover:bg-black text-white transition-colors cursor-pointer"
                            title="Download Official A4 PDF"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile/Tablet Touch-Friendly Cards (< lg) */}
      <div className="lg:hidden space-y-3.5">
        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-medium bg-white rounded-2xl border border-slate-200">
            No prescription orders found matching criteria.
          </div>
        ) : (
          filteredOrders.map((order) => {
            const hasRx = order.items.some((i) => i.prescription);

            return (
              <div key={order.id} className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-slate-900 text-white font-mono font-extrabold text-xs">
                      {order.orderNumber || "ORDER-000"}
                    </span>
                    {hasRx && (
                      <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-900 font-extrabold text-[10px] uppercase">
                        Rx Included
                      </span>
                    )}
                  </div>
                  <span className="font-mono font-black text-slate-900 text-sm">
                    {formatPrice(order.totalAmount)}
                  </span>
                </div>

                <div>
                  <p className="font-extrabold text-slate-900 text-sm">{order.customerName}</p>
                  <p className="text-xs text-slate-500">{order.customerEmail}</p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                      className={cn(
                        "px-3 py-2 rounded-xl text-xs font-extrabold border cursor-pointer focus:outline-none min-h-[38px]",
                        getStatusBadgeClass(order.status)
                      )}
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="PROCESSING">PROCESSING</option>
                      <option value="SHIPPED">SHIPPED</option>
                      <option value="DELIVERED">DELIVERED</option>
                    </select>

                    <select
                      value={order.paymentStatus || (order.paymentMethod === "COD" ? "PENDING" : "RECEIPT_SUBMITTED")}
                      onChange={(e) => handlePaymentStatusChange(order.id, e.target.value)}
                      className={cn(
                        "px-3 py-2 rounded-xl text-xs font-extrabold border cursor-pointer focus:outline-none min-h-[38px]",
                        getPaymentStatusBadgeClass(order.paymentStatus || (order.paymentMethod === "COD" ? "PENDING" : "RECEIPT_SUBMITTED"))
                      )}
                    >
                      <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
                      <option value="PAID">PAID</option>
                      <option value="FAILED">FAILED</option>
                      <option value="UNPAID">UNPAID</option>
                      <option value="REFUNDED">REFUNDED</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => setSelectedDrawerOrder(order)}
                      className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold min-h-[38px] cursor-pointer"
                    >
                      Review Rx
                    </button>
                    <button
                      onClick={() => setSelectedReceiptOrder(order)}
                      className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer"
                      title="View Receipt"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    <a
                      href={`/api/admin/orders/${order.id}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-slate-900 hover:bg-black text-white transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer"
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Slide-Over Prescription Drawer */}
      {selectedDrawerOrder && (
        <OrderDetailsDrawer
          order={selectedDrawerOrder}
          onClose={() => setSelectedDrawerOrder(null)}
          onReceiptClick={(ord) => {
            setSelectedDrawerOrder(null);
            setSelectedReceiptOrder(ord);
          }}
        />
      )}

      {/* Printable/Downloadable A4 Receipt Modal */}
      {selectedReceiptOrder && (
        <A4ReceiptModal
          order={selectedReceiptOrder}
          onClose={() => setSelectedReceiptOrder(null)}
        />
      )}

      {/* Toast Feedback Notification */}
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
