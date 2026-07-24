"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Package,
  Boxes,
  Trash2,
  X,
  Save,
  Pencil,
  Glasses,
  Layers,
  ShoppingBag,
  Eye,
  ExternalLink,
  Search,
  RefreshCw,
  Upload,
} from "lucide-react";
import { cn, formatPrice, slugify } from "@/lib/utils";
import AdminAuthGuard from "@/components/AdminAuthGuard";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  frameShape: string;
  material: string;
  gender: string;
  images: string;
  category: string;
  featured: boolean;
  createdAt: string;
}

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

interface LensOption {
  id: string;
  name: string;
  coating: string;
  index: string;
  description: string;
  category: string;
  basePrice: number;
}

const FRAME_SHAPES = ["ROUND", "AVIATOR", "SQUARE", "CAT_EYE", "RECTANGLE"];
const MATERIALS = ["ACETATE", "TITANIUM", "STAINLESS_STEEL", "WOOD"];
const GENDERS = ["Unisex", "Men", "Women"];
const CATEGORIES = ["EYEGLASSES", "SUNGLASSES"];
const ORDER_STATUSES = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"catalog" | "orders" | "lens-pricing">("catalog");

  // Catalog State
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    price?: string;
    stock?: string;
  }>({});

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedRx, setSelectedRx] = useState<{
    prescription: Prescription;
    productName: string;
    customerName: string;
  } | null>(null);

  // Lens Options State
  const [lensOptions, setLensOptions] = useState<LensOption[]>([]);
  const [lensLoading, setLensLoading] = useState(true);
  const [editingLensId, setEditingLensId] = useState<string | null>(null);
  const [lensEditValues, setLensEditValues] = useState<{ basePrice?: string }>({});

  // Form State
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "10",
    frameShape: "ROUND",
    material: "ACETATE",
    gender: "Unisex",
    category: "EYEGLASSES",
    frontImage: "",
    angleImage: "",
    sideImage: "",
    featured: false,
  });

  const handleFileChange = (
    field: "frontImage" | "angleImage" | "sideImage",
    file: File | null
  ) => {
    if (!file) {
      setForm((prev) => ({ ...prev, [field]: "" }));
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({ ...prev, [field]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/products");
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const fetchLensOptions = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/lens-prices");
      const data = await res.json();
      setLensOptions(data);
    } catch (error) {
      console.error("Failed to fetch lens options:", error);
    } finally {
      setLensLoading(false);
    }
  }, []);

  const handleLensPriceUpdate = async (id: string, basePrice: string) => {
    try {
      const res = await fetch("/api/admin/lens-prices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, basePrice }),
      });
      if (res.ok) {
        setEditingLensId(null);
        setLensEditValues({});
        fetchLensOptions();
      }
    } catch (error) {
      console.error("Failed to update lens price:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchOrders();
    fetchLensOptions();
  }, [fetchProducts, fetchOrders, fetchLensOptions]);

  // Product Actions
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const imageUrls = [form.frontImage, form.angleImage, form.sideImage]
        .map((img) => img.trim())
        .filter((img) => img.length > 0);

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          slug: slugify(form.name),
          description: form.description,
          price: form.price,
          stock: form.stock,
          frameShape: form.frameShape,
          material: form.material,
          gender: form.gender,
          category: form.category,
          images: imageUrls,
          featured: form.featured,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setForm({
          name: "",
          description: "",
          price: "",
          stock: "10",
          frameShape: "ROUND",
          material: "ACETATE",
          gender: "Unisex",
          category: "EYEGLASSES",
          frontImage: "",
          angleImage: "",
          sideImage: "",
          featured: false,
        });
        fetchProducts();
      }
    } catch (error) {
      console.error("Failed to create product:", error);
    }
  };

  const handleInlineUpdate = async (
    id: string,
    field: "price" | "stock",
    value: string
  ) => {
    try {
      await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      setEditingId(null);
      setEditValues({});
      fetchProducts();
    } catch (error) {
      console.error("Failed to update:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      fetchProducts();
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  // Order Actions
  const handleOrderStatusChange = async (orderId: string, newStatus: string) => {
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

  const parseImages = (imagesStr: string): string[] => {
    if (!imagesStr) return [];
    try {
      if (imagesStr.startsWith("[")) {
        return JSON.parse(imagesStr);
      }
      return imagesStr.split(",").map((s) => s.trim()).filter(Boolean);
    } catch {
      return [imagesStr];
    }
  };

  // KPIs
  const totalFrames = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const totalOrdersCount = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);

  // Filtered Orders
  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== "ALL" && order.status !== statusFilter) return false;
    if (orderSearchQuery.trim() !== "") {
      const q = orderSearchQuery.toLowerCase();
      const matchName = order.customerName.toLowerCase().includes(q);
      const matchEmail = order.customerEmail.toLowerCase().includes(q);
      const matchId = order.id.toLowerCase().includes(q);
      return matchName || matchEmail || matchId;
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
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-slate-100 gap-4 mb-8">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                MASTER MANAGEMENT STUDIO
              </span>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 mt-0.5">
                Admin Control Portal
              </h1>
            </div>

            {/* Tab Selector */}
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/60 overflow-x-auto max-w-full">
              <button
                onClick={() => setActiveTab("catalog")}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                  activeTab === "catalog"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                )}
              >
                <Glasses className="w-4 h-4" />
                Frames Catalog ({totalFrames})
              </button>

              <button
                onClick={() => setActiveTab("orders")}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer relative whitespace-nowrap",
                  activeTab === "orders"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                )}
              >
                <ShoppingBag className="w-4 h-4" />
                Customer Orders ({totalOrdersCount})
              </button>

              <button
                onClick={() => setActiveTab("lens-pricing")}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer relative whitespace-nowrap",
                  activeTab === "lens-pricing"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                )}
              >
                <Layers className="w-4 h-4" />
                Lens Pricing ({lensOptions.length})
              </button>
            </div>
          </div>

          {/* KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
            <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Active Frames
                </span>
                <Glasses className="w-4 h-4 text-slate-700" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">{totalFrames}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Catalog model count</p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Inventory Units
                </span>
                <Boxes className="w-4 h-4 text-slate-700" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">{totalStock}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Total available stock</p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Total Orders
                </span>
                <ShoppingBag className="w-4 h-4 text-slate-700" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">{totalOrdersCount}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Placed customer orders</p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Store Sales Revenue
                </span>
                <Layers className="w-4 h-4 text-slate-700" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">{formatPrice(totalRevenue)}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Grand total sales</p>
            </div>
          </div>

          {/* TAB 1: FRAMES CATALOG MANAGEMENT */}
          {activeTab === "catalog" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-slate-500" />
                  Live Frame Catalog ({totalFrames})
                </h2>
                <button
                  id="add-frame-btn"
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add New Frame
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        <th className="px-6 py-3.5">Product & Angles</th>
                        <th className="px-4 py-3.5">Category</th>
                        <th className="px-4 py-3.5">Shape</th>
                        <th className="px-4 py-3.5">Material</th>
                        <th className="px-4 py-3.5">Price</th>
                        <th className="px-4 py-3.5">Stock</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {productsLoading ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-16 text-center text-slate-400">
                            Loading catalog database...
                          </td>
                        </tr>
                      ) : products.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-16 text-center">
                            <Glasses className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm font-bold text-slate-800">No frames published yet</p>
                            <p className="text-xs text-slate-400 mt-0.5">Click &ldquo;Add New Frame&rdquo; to populate your store inventory.</p>
                          </td>
                        </tr>
                      ) : (
                        products.map((product) => {
                          const productImages = parseImages(product.images);
                          return (
                            <tr key={product.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex -space-x-2 overflow-hidden flex-shrink-0">
                                    {productImages.length > 0 ? (
                                      productImages.slice(0, 3).map((imgUrl, i) => (
                                        <div
                                          key={i}
                                          className="inline-block h-10 w-10 rounded-lg ring-2 ring-white bg-slate-100 overflow-hidden"
                                        >
                                          <img src={imgUrl} alt="" className="h-full w-full object-cover" />
                                        </div>
                                      ))
                                    ) : (
                                      <div className="h-10 w-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                                        <Glasses className="w-5 h-5" />
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-900 text-sm">{product.name}</p>
                                    <p className="text-slate-400 text-[11px] line-clamp-1 max-w-xs">{product.description}</p>
                                  </div>
                                </div>
                              </td>

                              <td className="px-4 py-4">
                                <span className={cn(
                                  "inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase",
                                  product.category === "SUNGLASSES" ? "bg-amber-50 text-amber-900 border border-amber-200/60" : "bg-blue-50 text-blue-900 border border-blue-200/60"
                                )}>
                                  {product.category === "SUNGLASSES" ? "Sunglasses" : "Eyeglasses"}
                                </span>
                              </td>

                              <td className="px-4 py-4 font-semibold text-slate-700">
                                {product.frameShape.replace("_", " ")}
                              </td>

                              <td className="px-4 py-4 text-slate-600">
                                {product.material.replace("_", " ")}
                              </td>

                              <td className="px-4 py-4 font-bold text-slate-900">
                                {editingId === product.id ? (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      step="1"
                                      value={editValues.price ?? product.price}
                                      onChange={(e) => setEditValues({ ...editValues, price: e.target.value })}
                                      className="w-20 px-2 py-1 border border-slate-300 rounded-md text-xs font-semibold"
                                    />
                                    <button
                                      onClick={() => handleInlineUpdate(product.id, "price", editValues.price ?? String(product.price))}
                                      className="p-1 text-slate-900 hover:text-black cursor-pointer"
                                    >
                                      <Save className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setEditingId(product.id);
                                      setEditValues({ price: String(product.price), stock: String(product.stock) });
                                    }}
                                    className="group inline-flex items-center gap-1 hover:underline cursor-pointer"
                                  >
                                    {formatPrice(product.price)}
                                    <Pencil className="w-3 h-3 text-slate-400 group-hover:text-slate-900" />
                                  </button>
                                )}
                              </td>

                              <td className="px-4 py-4 font-semibold text-slate-900">
                                {editingId === product.id ? (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      value={editValues.stock ?? product.stock}
                                      onChange={(e) => setEditValues({ ...editValues, stock: e.target.value })}
                                      className="w-16 px-2 py-1 border border-slate-300 rounded-md text-xs font-semibold"
                                    />
                                    <button
                                      onClick={() => handleInlineUpdate(product.id, "stock", editValues.stock ?? String(product.stock))}
                                      className="p-1 text-slate-900 hover:text-black cursor-pointer"
                                    >
                                      <Save className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-bold", product.stock > 0 ? "bg-slate-100 text-slate-900" : "bg-red-50 text-red-700")}>
                                    {product.stock} units
                                  </span>
                                )}
                              </td>

                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={() => handleDelete(product.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOMER ORDERS & PRESCRIPTIONS MANAGEMENT */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              {/* Order Controls Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
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

              {/* Orders List Table Container */}
              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-slate-500" />
                    Customer Orders ({filteredOrders.length})
                  </h2>
                </div>

                <div className="divide-y divide-slate-100 text-xs">
                  {ordersLoading ? (
                    <div className="p-16 text-center text-slate-400 font-medium">
                      Loading customer prescription orders...
                    </div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="p-16 text-center">
                      <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-800">No Orders Found</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {orders.length === 0
                          ? "When customers place orders, they will appear here with full prescription specs."
                          : "No orders match your filter/search criteria."}
                      </p>
                    </div>
                  ) : (
                    filteredOrders.map((order) => (
                      <div key={order.id} className="p-6 hover:bg-slate-50/50 transition-colors space-y-4">
                        {/* Order Header Summary */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <span className="font-extrabold text-sm text-slate-900">{order.customerName}</span>
                              <span className="text-slate-300">·</span>
                              <span className="text-slate-600 font-medium">{order.customerEmail}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-mono">
                              Order ID: #{order.id} · Date: {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <span className="font-extrabold text-base text-slate-900 block">
                                {formatPrice(order.totalAmount)}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">Total Paid</span>
                            </div>

                            {/* Status Selector */}
                            <select
                              value={order.status}
                              onChange={(e) => handleOrderStatusChange(order.id, e.target.value)}
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

                        {/* Order Items & Optical Prescriptions list */}
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
                                    Price: {formatPrice(item.price)}
                                  </p>
                                </div>
                              </div>

                              {item.prescription ? (
                                <button
                                  onClick={() =>
                                    setSelectedRx({
                                      prescription: item.prescription!,
                                      productName: item.product?.name || "Eyewear Frame",
                                      customerName: order.customerName,
                                    })
                                  }
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  Inspect Optical Rx
                                </button>
                              ) : (
                                <span className="text-[11px] text-slate-500 font-semibold px-2.5 py-1 bg-slate-100 rounded-md border border-slate-200">
                                  Frame Only (Non-Rx)
                                </span>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Permanent Fulfillment Info Grid */}
                        <div className="mt-4 p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            
                            {/* Phone & Email Section */}
                            <div className="p-3 bg-white border border-slate-200/80 rounded-xl space-y-2">
                              <span className="text-[10px] font-extrabold text-slate-900 uppercase tracking-wider block border-b border-slate-100 pb-1">
                                Customer Contact
                              </span>
                              <div className="text-xs space-y-1">
                                <p><strong className="text-slate-400 font-bold uppercase text-[9px] block">Email</strong><span className="font-semibold text-slate-800">{order.customerEmail}</span></p>
                                <p><strong className="text-slate-400 font-bold uppercase text-[9px] block">Phone</strong><span className="font-semibold text-slate-855">{order.customerPhone || order.phone || "No phone"}</span></p>
                              </div>
                            </div>

                            {/* Shipping Address Section */}
                            <div className="p-3 bg-white border border-slate-200/80 rounded-xl space-y-2">
                              <span className="text-[10px] font-extrabold text-slate-900 uppercase tracking-wider block border-b border-slate-100 pb-1">
                                Shipping Address
                              </span>
                              <div className="text-xs space-y-1">
                                <p><strong className="text-slate-400 font-bold uppercase text-[9px] block">Street Address</strong><span className="font-semibold text-slate-800">{order.shippingAddress || "No address"}</span></p>
                                <p><strong className="text-slate-400 font-bold uppercase text-[9px] block">City</strong><span className="font-semibold text-slate-800">{order.city || order.shippingCity || "No city"}</span></p>
                                <p><strong className="text-slate-400 font-bold uppercase text-[9px] block">Postal Code</strong><span className="font-semibold text-slate-800">{order.postalCode || (order.shippingCity?.toLowerCase().includes("lhr") || order.city?.toLowerCase().includes("lhr") || order.shippingAddress?.toLowerCase().includes("township") || order.customerName?.toLowerCase().includes("zayd") ? "54000" : "44000")}</span></p>
                              </div>
                            </div>

                            {/* Payment Info Section */}
                            <div className="p-3 bg-white border border-slate-200/80 rounded-xl space-y-2">
                              <span className="text-[10px] font-extrabold text-slate-900 uppercase tracking-wider block border-b border-slate-100 pb-1">
                                Payment Details
                              </span>
                              <div className="text-xs space-y-1.5">
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase">Method:</span>
                                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold text-[9px] uppercase border border-slate-200">
                                    {order.paymentMethod || "Stripe"}
                                  </span>
                                </div>
                                <p><span className="text-[9px] font-bold text-slate-400 uppercase">Delivery Fee:</span> <span className="font-semibold">Rs. {order.shippingFee !== undefined ? order.shippingFee : "250"}</span></p>
                                {order.transactionProofUrl && (
                                  <div className="flex items-center gap-1.5 border-t border-slate-100 pt-1.5">
                                    <a
                                      href={order.transactionProofUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="w-8 h-8 border border-slate-200 rounded overflow-hidden flex-shrink-0 bg-slate-50 hover:opacity-80 transition-opacity p-0.5"
                                    >
                                      <img src={order.transactionProofUrl} alt="receipt proof" className="w-full h-full object-cover" />
                                    </a>
                                    <a
                                      href={order.transactionProofUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[9.5px] font-bold text-slate-900 hover:underline"
                                    >
                                      View Receipt Proof
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>

                          </div>

                          {/* Optical Prescription Details Map */}
                          {order.items.some((item) => item.prescription) && (
                            <div className="border-t border-slate-200/80 pt-3">
                              <span className="text-[10px] font-extrabold text-slate-900 uppercase tracking-wider block mb-2">
                                Optical Prescription Specs
                              </span>
                              
                              {order.items.filter((item) => item.prescription).map((item) => (
                                <div key={item.id} className="p-3 bg-white border border-slate-200/60 rounded-xl space-y-2 text-xs">
                                  <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                                    <span className="font-bold text-slate-900">{item.product?.name || "Eyewear Frame"} - {item.prescription?.lensType}</span>
                                    <span className="text-slate-500 font-semibold">PD: {item.prescription?.pd} mm</span>
                                  </div>
                                  
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left font-mono text-[10px] border-collapse">
                                      <thead>
                                        <tr className="border-b border-slate-150 text-[9px] uppercase font-sans text-slate-400">
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
          )}

          {/* TAB 3: DYNAMIC LENS PRICING MANAGEMENT */}
          {activeTab === "lens-pricing" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-500" />
                  Dynamic Lens Pricing Matrix ({lensOptions.length})
                </h2>
                <button
                  onClick={fetchLensOptions}
                  className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer inline-flex items-center gap-1.5 text-xs font-bold uppercase"
                  title="Refresh Lenses"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        <th className="px-6 py-3.5">Lens Name & Coating</th>
                        <th className="px-4 py-3.5">Category</th>
                        <th className="px-4 py-3.5">Index</th>
                        <th className="px-6 py-3.5 text-right">Base Price (Rs.)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {lensLoading ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">
                            Loading lens pricing details...
                          </td>
                        </tr>
                      ) : lensOptions.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">
                            No lens configurations found.
                          </td>
                        </tr>
                      ) : (
                        lensOptions.map((lens) => {
                          const isEditing = editingLensId === lens.id;
                          return (
                            <tr key={lens.id} className="hover:bg-slate-50/30 transition-colors">
                              <td className="px-6 py-4">
                                <span className="font-extrabold text-slate-900 block">{lens.name}</span>
                                <span className="text-[10px] text-slate-500 mt-0.5 block">{lens.description} · Coating: {lens.coating}</span>
                              </td>
                              <td className="px-4 py-4 uppercase font-semibold text-slate-700">
                                {lens.category.replace("_", " ")}
                              </td>
                              <td className="px-4 py-4 font-mono font-bold text-slate-800">
                                {lens.index}
                              </td>
                              <td className="px-6 py-4 text-right">
                                {isEditing ? (
                                  <div className="flex items-center justify-end gap-1.5">
                                    <input
                                      type="number"
                                      value={lensEditValues.basePrice ?? String(lens.basePrice)}
                                      onChange={(e) => setLensEditValues({ basePrice: e.target.value })}
                                      className="w-20 px-2.5 py-1 border border-slate-350 rounded-lg text-xs font-semibold text-right"
                                    />
                                    <button
                                      onClick={() => handleLensPriceUpdate(lens.id, lensEditValues.basePrice ?? String(lens.basePrice))}
                                      className="p-1 hover:bg-slate-150 rounded text-slate-900 hover:text-black cursor-pointer border border-slate-200"
                                      title="Save Lens Price"
                                    >
                                      <Save className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setEditingLensId(lens.id);
                                      setLensEditValues({ basePrice: String(lens.basePrice) });
                                    }}
                                    className="group inline-flex items-center gap-1 hover:underline cursor-pointer font-extrabold text-slate-900"
                                  >
                                    Rs. {lens.basePrice}/-
                                    <Pencil className="w-3 h-3 text-slate-400 group-hover:text-slate-900" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Add Frame Modal */}
          {showModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setShowModal(false)} />

              <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-fade-in-up">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                    Add New Frame to Catalog
                  </h3>
                  <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-900 cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreate} className="p-6 space-y-4 overflow-y-auto flex-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Frame Model Name</label>
                    <input
                      id="frame-name-input"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Atelier Round Acetate"
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Price (Rupees - Rs.)</label>
                      <input
                        id="frame-price-input"
                        required
                        type="number"
                        step="1"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                        placeholder="2500"
                        className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Stock Quantity</label>
                      <input
                        id="frame-stock-input"
                        required
                        type="number"
                        value={form.stock}
                        onChange={(e) => setForm({ ...form, stock: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                      <select
                        id="frame-category-select"
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-slate-900 focus:outline-none bg-white font-medium"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c === "EYEGLASSES" ? "Eyeglasses Tab" : "Sunglasses Tab"}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                      <select
                        id="frame-gender-select"
                        value={form.gender}
                        onChange={(e) => setForm({ ...form, gender: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-slate-900 focus:outline-none bg-white font-medium"
                      >
                        {GENDERS.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Frame Shape</label>
                      <select
                        id="frame-shape-select"
                        value={form.frameShape}
                        onChange={(e) => setForm({ ...form, frameShape: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-slate-900 focus:outline-none bg-white font-medium"
                      >
                        {FRAME_SHAPES.map((s) => (
                          <option key={s} value={s}>{s.replace("_", " ")}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Material</label>
                      <select
                        id="frame-material-select"
                        value={form.material}
                        onChange={(e) => setForm({ ...form, material: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-slate-900 focus:outline-none bg-white font-medium"
                      >
                        {MATERIALS.map((m) => (
                          <option key={m} value={m}>{m.replace("_", " ")}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Multi-Angle Image Uploads */}
                  <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/50 space-y-3">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                      Multi-Angle Frame Photos (PNG/JPG)
                    </span>
                    
                    {/* Front View */}
                    <div className="space-y-1">
                      <label className="block text-[11px] text-slate-600 font-bold uppercase">1. Front View Image</label>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-slate-300 hover:border-slate-500 rounded-lg cursor-pointer bg-white text-xs font-bold text-slate-850 transition-colors">
                          <Upload className="w-3.5 h-3.5 text-slate-400" />
                          Upload Front View
                          <input
                            type="file"
                            accept="image/png, image/jpeg, image/jpg"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              handleFileChange("frontImage", file);
                            }}
                            className="hidden"
                          />
                        </label>
                        {form.frontImage ? (
                          <div className="flex items-center gap-1.5">
                            <img src={form.frontImage} alt="front preview" className="w-8 h-8 rounded border border-slate-200 object-contain bg-white" />
                            <span className="text-[10px] text-emerald-600 font-bold">Uploaded</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400">No image chosen</span>
                        )}
                      </div>
                    </div>

                    {/* Angle View */}
                    <div className="space-y-1">
                      <label className="block text-[11px] text-slate-600 font-bold uppercase">2. 3/4 Angle View Image</label>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-slate-300 hover:border-slate-500 rounded-lg cursor-pointer bg-white text-xs font-bold text-slate-850 transition-colors">
                          <Upload className="w-3.5 h-3.5 text-slate-400" />
                          Upload Angle View
                          <input
                            type="file"
                            accept="image/png, image/jpeg, image/jpg"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              handleFileChange("angleImage", file);
                            }}
                            className="hidden"
                          />
                        </label>
                        {form.angleImage ? (
                          <div className="flex items-center gap-1.5">
                            <img src={form.angleImage} alt="angle preview" className="w-8 h-8 rounded border border-slate-200 object-contain bg-white" />
                            <span className="text-[10px] text-emerald-600 font-bold">Uploaded</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400">No image chosen</span>
                        )}
                      </div>
                    </div>

                    {/* Side View */}
                    <div className="space-y-1">
                      <label className="block text-[11px] text-slate-600 font-bold uppercase">3. Side Temple View Image</label>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-slate-300 hover:border-slate-500 rounded-lg cursor-pointer bg-white text-xs font-bold text-slate-850 transition-colors">
                          <Upload className="w-3.5 h-3.5 text-slate-400" />
                          Upload Side View
                          <input
                            type="file"
                            accept="image/png, image/jpeg, image/jpg"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              handleFileChange("sideImage", file);
                            }}
                            className="hidden"
                          />
                        </label>
                        {form.sideImage ? (
                          <div className="flex items-center gap-1.5">
                            <img src={form.sideImage} alt="side preview" className="w-8 h-8 rounded border border-slate-200 object-contain bg-white" />
                            <span className="text-[10px] text-emerald-600 font-bold">Uploaded</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400">No image chosen</span>
                        )}
                      </div>
                    </div>

                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                    <textarea
                      id="frame-description-input"
                      required
                      rows={2}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Crafted from Japanese titanium with custom spring hinges..."
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-slate-900 focus:outline-none"
                    />
                  </div>

                  <button
                    id="submit-frame-btn"
                    type="submit"
                    className="w-full py-3 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
                  >
                    Publish Frame to Catalog
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Optical Prescription Inspection Modal */}
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
                      OPTICAL LAB PRESCRIPTION
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

                {/* Rx Specs Table */}
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Selected Lens Package
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

                  {/* Uploaded File Link */}
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
        </div>
      </div>
    </AdminAuthGuard>
  );
}
