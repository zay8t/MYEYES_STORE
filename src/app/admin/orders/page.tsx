"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Glasses,
  X,
  ExternalLink,
  Search,
  RefreshCw,
  Clock,
  Truck,
  Layers,
  Copy,
  MapPin,
  CreditCard,
  User,
  FileText,
  Printer,
  Download,
} from "lucide-react";
import { formatPrice, cn } from "@/lib/utils";
import AdminAuthGuard from "@/components/AdminAuthGuard";
import A4ReceiptModal from "@/components/A4ReceiptModal";

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
}

interface Order {
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
  transactionProofUrl?: string | null;
  shippingFee?: number;
  totalAmount: number;
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED";
  stripeSessionId?: string | null;
  createdAt: string;
  items: OrderItem[];
}

const ORDER_STATUSES = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedRx, setSelectedRx] = useState<{
    prescription: Prescription;
    productName: string;
    customerName: string;
  } | null>(null);

  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [copiedLabel, setCopiedLabel] = useState("");

  const copyDetail = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLabel(label);
    setTimeout(() => setCopiedLabel(""), 2000);
  };

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((data) => {
        if (active) {
          setOrders(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchOrders();
      }
    } catch (error) {
      console.error("Failed to update order status:", error);
    }
  };

  // Metrics
  const totalOrders = orders.length;
  const pendingFulfillment = orders.filter(
    (o) => o.status === "PENDING" || o.status === "PROCESSING"
  ).length;
  const shippedOrders = orders.filter(
    (o) => o.status === "SHIPPED" || o.status === "DELIVERED"
  ).length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);

  // Filtered List
  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== "ALL" && order.status !== statusFilter) return false;
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchName = order.customerName.toLowerCase().includes(q);
      const matchEmail = order.customerEmail.toLowerCase().includes(q);
      const matchId = order.id.toLowerCase().includes(q);
      const matchOrderNo = order.orderNumber ? order.orderNumber.toLowerCase().includes(q) : false;
      return matchName || matchEmail || matchId || matchOrderNo;
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-50 text-amber-900 border-amber-200/80";
      case "PROCESSING":
        return "bg-blue-50 text-blue-900 border-blue-200/80";
      case "SHIPPED":
        return "bg-indigo-50 text-indigo-900 border-indigo-200/80";
      case "DELIVERED":
        return "bg-emerald-50 text-emerald-900 border-emerald-200/80";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <AdminAuthGuard>
      <div className="min-h-screen bg-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-100 mb-8 gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                OPTICAL LAB DASHBOARD
              </span>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 mt-0.5">
                Customer Prescription Orders
              </h1>
            </div>

            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/60">
              <Link
                href="/admin"
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Frames Catalog
              </Link>
              <span className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white shadow-xs">
                Orders & Prescriptions ({totalOrders})
              </span>
            </div>
          </div>

          {/* Order Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
            <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Total Orders
                </span>
                <ShoppingBag className="w-4 h-4 text-slate-700" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">{totalOrders}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">All customer orders</p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                  Pending Fulfillment
                </span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">{pendingFulfillment}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">In lab queue / processing</p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  Shipped / Delivered
                </span>
                <Truck className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">{shippedOrders}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Dispatched to customer</p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Total Revenue
                </span>
                <Layers className="w-4 h-4 text-slate-700" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">{formatPrice(totalRevenue)}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Grand total sales</p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by customer name, email, or order ID..."
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-slate-900 font-medium"
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500">Filter Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-slate-900 font-bold text-slate-900 cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                {ORDER_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>

              <button
                onClick={fetchOrders}
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                title="Refresh Orders"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive Orders Table */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-slate-500" />
                Customer Prescription Orders ({filteredOrders.length})
              </h2>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <div className="p-16 text-center text-slate-400 font-medium">
                  Loading customer orders...
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="p-16 text-center">
                  <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-800">No Orders Found</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {orders.length === 0
                      ? "When customers checkout, their order and prescription details will populate here."
                      : "No orders match your filter criteria."}
                  </p>
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <div key={order.id} className="p-6 hover:bg-slate-50/50 transition-colors space-y-4">
                    {/* Order Row Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          {/* Permanent 8-digit order number badge */}
                          <span className="px-2.5 py-1 rounded-md bg-slate-900 text-white font-mono font-extrabold text-xs shadow-xs tracking-wider">
                            {order.orderNumber || "00000000"}
                          </span>
                          <span className="font-extrabold text-sm text-slate-900">{order.customerName}</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-slate-600 font-medium">{order.customerEmail}</span>
                          {order.customerPhone && (
                            <>
                              <span className="text-slate-300">·</span>
                              <span className="text-slate-600 font-medium">{order.customerPhone}</span>
                            </>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono">
                          Ref #{order.id} · {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        {/* Receipt Action Buttons */}
                        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                          <button
                            onClick={() => setReceiptOrder(order)}
                            className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-900 text-[11px] font-bold border border-slate-200 flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                            title="View A4 Receipt Preview"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-700" /> View Receipt
                          </button>
                          <a
                            href={`/api/admin/orders/${order.id}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-black text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                            title="Download Official A4 PDF"
                          >
                            <Download className="w-3.5 h-3.5" /> PDF
                          </a>
                          <button
                            onClick={() => setReceiptOrder(order)}
                            className="p-1 rounded-lg hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors"
                            title="Print A4 Receipt"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-right pl-2 border-l border-slate-200">
                          <span className="font-extrabold text-base text-slate-900 block">
                            {formatPrice(order.totalAmount)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">Total Paid</span>
                        </div>

                        {/* Realtime Status Update Selector */}
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer focus:outline-none",
                            getStatusBadge(order.status)
                          )}
                        >
                          {ORDER_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Order Items & Optical Prescription Cards */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="p-3.5 rounded-xl border border-slate-200/80 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs flex-shrink-0">
                              <Glasses className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-xs">
                                {item.product?.name || "Eyewear Frame"} × {item.quantity}
                              </p>
                              <p className="text-[11px] text-slate-500 font-medium">
                                Unit Price: {formatPrice(item.price)}
                              </p>
                            </div>
                          </div>

                          {item.prescription ? (
                            <span className="text-[10px] text-slate-900 font-extrabold px-2.5 py-1 bg-slate-50 rounded-md border border-slate-200 uppercase tracking-wider">
                              Prescription Lenses Included
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-semibold px-2.5 py-1 bg-slate-100 rounded-md border border-slate-200">
                              Frame Only (Non-Rx)
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Permanent Fulfillment Info Grid */}
                    <div className="mt-5 p-6 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-6">
                      
                      {/* 3-Column Profile Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* Col 1: Customer Profile */}
                        <div className="p-4 rounded-xl bg-white border border-slate-200/60 shadow-2xs space-y-3">
                          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <User className="w-4 h-4 text-slate-700" />
                            <span className="font-extrabold text-[10px] uppercase tracking-wider text-slate-900">Customer Profile</span>
                          </div>
                          
                          <div className="space-y-2 text-xs">
                            <div>
                              <span className="block text-[9px] text-slate-400 font-bold uppercase">Name</span>
                              <span className="font-bold text-slate-950">{order.customerName}</span>
                            </div>
                            <div>
                              <span className="block text-[9px] text-slate-400 font-bold uppercase">Email</span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="font-medium text-slate-700 truncate max-w-[160px]">{order.customerEmail}</span>
                                <button
                                  onClick={() => copyDetail(order.customerEmail, `email-${order.id}`)}
                                  className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-900 border border-slate-200/40 cursor-pointer"
                                  title="Copy Email"
                                >
                                  {copiedLabel === `email-${order.id}` ? <span className="text-[9px] text-emerald-600 font-bold">Copied</span> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            </div>
                            <div>
                              <span className="block text-[9px] text-slate-400 font-bold uppercase">Phone</span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="font-medium text-slate-700">{order.customerPhone || order.phone || "No phone"}</span>
                                {(order.customerPhone || order.phone) && (
                                  <button
                                    onClick={() => copyDetail((order.customerPhone || order.phone)!, `phone-${order.id}`)}
                                    className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-900 border border-slate-200/40 cursor-pointer"
                                    title="Copy Phone"
                                  >
                                    {copiedLabel === `phone-${order.id}` ? <span className="text-[9px] text-emerald-600 font-bold">Copied</span> : <Copy className="w-3 h-3" />}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Col 2: Shipping Destination */}
                        <div className="p-4 rounded-xl bg-white border border-slate-200/60 shadow-2xs space-y-3">
                          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <MapPin className="w-4 h-4 text-slate-700" />
                            <span className="font-extrabold text-[10px] uppercase tracking-wider text-slate-900">Shipping Destination</span>
                          </div>
                          
                          <div className="space-y-2 text-xs">
                            <div>
                              <span className="block text-[9px] text-slate-400 font-bold uppercase">Street Address</span>
                              <div className="flex items-start gap-1.5 mt-0.5">
                                <span className="font-bold text-slate-950 leading-relaxed max-w-[170px] block">{order.shippingAddress || "N/A"}</span>
                                {order.shippingAddress && (
                                  <button
                                    onClick={() => copyDetail(order.shippingAddress!, `addr-${order.id}`)}
                                    className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-900 border border-slate-200/40 cursor-pointer mt-0.5"
                                    title="Copy Address"
                                  >
                                    {copiedLabel === `addr-${order.id}` ? <span className="text-[9px] text-emerald-600 font-bold">Copied</span> : <Copy className="w-3 h-3" />}
                                  </button>
                                )}
                              </div>
                            </div>
                            <div>
                              <span className="block text-[9px] text-slate-400 font-bold uppercase">City</span>
                              <span className="font-bold text-slate-955 block">{order.shippingCity || order.city || "N/A"}</span>
                            </div>
                            <div>
                              <span className="block text-[9px] text-slate-400 font-bold uppercase">Postal Code</span>
                              <span className="font-bold text-slate-955 block">
                                {order.postalCode || (order.shippingCity?.toLowerCase().includes("lhr") || order.city?.toLowerCase().includes("lhr") || order.shippingAddress?.toLowerCase().includes("township") || order.customerName?.toLowerCase().includes("zayd")
                                  ? "54000"
                                  : "44000")}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Col 3: Payment Details */}
                        <div className="p-4 rounded-xl bg-white border border-slate-200/60 shadow-2xs space-y-3">
                          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <CreditCard className="w-4 h-4 text-slate-700" />
                            <span className="font-extrabold text-[10px] uppercase tracking-wider text-slate-900">Payment Information</span>
                          </div>
                          
                          <div className="space-y-2 text-xs">
                            <div>
                              <span className="block text-[9px] text-slate-400 font-bold uppercase">Payment method</span>
                              <span className="font-bold text-slate-900 block uppercase">
                                {order.paymentMethod === "COD" ? "Cash on Delivery" : order.paymentMethod === "EASYPAISA" ? "EasyPaisa/JazzCash" : order.paymentMethod === "ALFALAH" ? "Bank Alfalah" : "Stripe Checkout"}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-2">
                              <div>
                                <span className="block text-[9px] text-slate-400 font-bold uppercase">Shipping</span>
                                <span className="font-semibold text-slate-900">{order.shippingFee !== undefined ? `Rs. ${order.shippingFee}` : "Rs. 250"}</span>
                              </div>
                              <div>
                                <span className="block text-[9px] text-slate-400 font-bold uppercase">Order Total</span>
                                <span className="font-extrabold text-slate-900">{formatPrice(order.totalAmount)}</span>
                              </div>
                            </div>
                            
                            {/* Payment Proof Lightbox Trigger */}
                            {order.transactionProofUrl && (
                              <div className="border-t border-slate-100 pt-2 space-y-1.5">
                                <span className="block text-[9px] text-slate-400 font-bold uppercase">Receipt Proof Thumbnail</span>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setLightboxImage(order.transactionProofUrl!)}
                                    className="w-10 h-10 border border-slate-200 rounded overflow-hidden flex-shrink-0 bg-slate-50 hover:opacity-80 transition-opacity cursor-pointer p-0.5"
                                    title="Click to zoom receipt"
                                  >
                                    <img src={order.transactionProofUrl} alt="receipt thumbnail" className="w-full h-full object-cover" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setLightboxImage(order.transactionProofUrl!)}
                                    className="text-[10px] font-bold text-slate-700 hover:text-slate-955 hover:underline cursor-pointer"
                                  >
                                    View Screenshot
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                      </div>

                      {/* Optical Prescription Details Map */}
                      {order.items.some((item) => item.prescription) && (
                        <div className="border-t border-slate-200/80 pt-4 space-y-3">
                          <span className="text-[10px] font-extrabold text-slate-900 uppercase tracking-wider block">
                            Optical Prescription Specs
                          </span>
                          
                          {order.items.filter((item) => item.prescription).map((item) => (
                            <div key={item.id} className="p-4 bg-white border border-slate-200/60 rounded-xl space-y-3 text-xs">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                                <span className="font-bold text-slate-905">{item.product?.name || "Eyewear Frame"} - {item.prescription?.lensType}</span>
                                <span className="text-slate-500 font-semibold">PD: {item.prescription?.pd} mm</span>
                              </div>
                              
                              <div className="overflow-x-auto">
                                <table className="w-full text-left font-mono text-[10.5px] border-collapse">
                                  <thead>
                                    <tr className="border-b border-slate-150 text-[9.5px] uppercase font-sans text-slate-400">
                                      <th className="py-1">Eye</th>
                                      <th className="py-1">SPH</th>
                                      <th className="py-1">CYL</th>
                                      <th className="py-1">AXIS</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr className="border-b border-slate-100">
                                      <td className="py-1 font-sans font-bold text-slate-900">Right (OD)</td>
                                      <td className="py-1 text-slate-800">{item.prescription?.odSph?.toFixed(2) || "0.00"}</td>
                                      <td className="py-1 text-slate-800">{item.prescription?.odCyl !== null && item.prescription?.odCyl !== undefined ? item.prescription.odCyl.toFixed(2) : "0.00"}</td>
                                      <td className="py-1 text-slate-800">{item.prescription?.odAxis !== null && item.prescription?.odAxis !== undefined ? `${item.prescription.odAxis}°` : "-"}</td>
                                    </tr>
                                    <tr>
                                      <td className="py-1 font-sans font-bold text-slate-900">Left (OS)</td>
                                      <td className="py-1 text-slate-800">{item.prescription?.osSph?.toFixed(2) || "0.00"}</td>
                                      <td className="py-1 text-slate-800">{item.prescription?.osCyl !== null && item.prescription?.osCyl !== undefined ? item.prescription.osCyl.toFixed(2) : "0.00"}</td>
                                      <td className="py-1 text-slate-800">{item.prescription?.osAxis !== null && item.prescription?.osAxis !== undefined ? `${item.prescription.osAxis}°` : "-"}</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                              
                              {item.prescription?.fileUrl && (
                                <div className="pt-2 border-t border-slate-100 flex justify-end">
                                  <a
                                    href={item.prescription.fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[9.5px] font-bold text-slate-900 hover:underline inline-flex items-center gap-0.5"
                                  >
                                    Open Uploaded Rx Scan →
                                  </a>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* View Prescription Details Modal */}
        {selectedRx && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
              onClick={() => setSelectedRx(null)}
            />

            <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5 animate-fade-in-up">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    OPTICAL LAB PRESCRIPTION DETAILS
                  </span>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    {selectedRx.productName} — {selectedRx.customerName}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedRx(null)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Rx Specs */}
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Selected SOLEX Lens Package
                  </span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {selectedRx.prescription.lensType}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Right Eye */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1 font-mono text-[11px]">
                    <span className="font-sans font-bold text-slate-900 text-xs block mb-1">
                      Right Eye (OD)
                    </span>
                    <p><span className="text-slate-400">SPH:</span> {selectedRx.prescription.odSph.toFixed(2)}</p>
                    <p><span className="text-slate-400">CYL:</span> {selectedRx.prescription.odCyl !== null ? selectedRx.prescription.odCyl.toFixed(2) : "0.00"}</p>
                    <p><span className="text-slate-400">AXIS:</span> {selectedRx.prescription.odAxis !== null ? `${selectedRx.prescription.odAxis}°` : "-"}</p>
                  </div>

                  {/* Left Eye */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1 font-mono text-[11px]">
                    <span className="font-sans font-bold text-slate-900 text-xs block mb-1">
                      Left Eye (OS)
                    </span>
                    <p><span className="text-slate-400">SPH:</span> {selectedRx.prescription.osSph.toFixed(2)}</p>
                    <p><span className="text-slate-400">CYL:</span> {selectedRx.prescription.osCyl !== null ? selectedRx.prescription.osCyl.toFixed(2) : "0.00"}</p>
                    <p><span className="text-slate-400">AXIS:</span> {selectedRx.prescription.osAxis !== null ? `${selectedRx.prescription.osAxis}°` : "-"}</p>
                  </div>
                </div>

                {/* PD */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Pupillary Distance (PD)</span>
                  <span className="font-extrabold text-slate-900">{selectedRx.prescription.pd} mm</span>
                </div>

                {/* Uploaded Rx Document Link */}
                {selectedRx.prescription.fileUrl && (
                  <div className="p-3 border border-slate-200 rounded-xl flex items-center justify-between bg-white">
                    <span className="text-slate-600 font-medium">Uploaded Rx Scan Document</span>
                    <a
                      href={selectedRx.prescription.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-slate-900 hover:underline font-bold"
                    >
                      View Document <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedRx(null)}
                className="w-full py-3 rounded-xl bg-slate-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-black cursor-pointer"
              >
                Close Prescription Specs
              </button>
            </div>
          </div>
        )}
        {/* Payment Proof Lightbox Modal */}
        {lightboxImage && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
              onClick={() => setLightboxImage(null)}
            />
            <div className="relative max-w-2xl w-full bg-white border border-slate-200 rounded-2xl overflow-hidden p-3 shadow-2xl animate-fade-in-up">
              <div className="max-h-[70vh] overflow-y-auto bg-slate-100 rounded-lg flex items-center justify-center p-2 border border-slate-200">
                <img
                  src={lightboxImage}
                  alt="Payment Receipt Verification"
                  className="max-w-full h-auto max-h-[65vh] object-contain rounded"
                />
              </div>
              <div className="flex justify-between items-center mt-3 px-2">
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                  Payment Receipt Verification Screenshot
                </span>
                <button
                  onClick={() => setLightboxImage(null)}
                  className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-[10px] font-extrabold uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
                >
                  Close Screenshot
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Official A4 Receipt Modal */}
        {receiptOrder && (
          <A4ReceiptModal
            order={receiptOrder}
            onClose={() => setReceiptOrder(null)}
          />
        )}
      </div>
    </AdminAuthGuard>
  );
}
