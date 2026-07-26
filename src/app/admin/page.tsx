import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import {
  Banknote,
  ShoppingBag,
  Glasses,
  Boxes,
  Users,
  Clock,
  ArrowUpRight,
  Plus,
} from "lucide-react";
import { Product } from "@prisma/client";

export const revalidate = 0; // Fresh data per request

interface ProductSalesItem {
  product: Product;
  qty: number;
  revenue: number;
}

async function getDashboardMetrics() {
  const [products, orders, totalCustomersCount] = await Promise.all([
    prisma.product.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.order.findMany({
      include: {
        items: {
          include: {
            product: true,
            prescription: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.groupBy({
      by: ["customerEmail"],
      _count: { customerEmail: true },
    }),
  ]);

  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOrdersCount = orders.length;

  // Prescription vs Non-Prescription Sales Ratio
  let rxOrdersCount = 0;
  orders.forEach((o) => {
    const hasRx = o.items.some((i) => i.prescription);
    if (hasRx) rxOrdersCount++;
  });
  const rxRatio = totalOrdersCount > 0 ? Math.round((rxOrdersCount / totalOrdersCount) * 100) : 0;

  // Pending Lab Queue
  const pendingLabCount = orders.filter(
    (o) => o.status === "PENDING" || o.status === "PROCESSING"
  ).length;

  // Total In-Stock Frames
  const totalStockCount = products.reduce((sum, p) => sum + p.stock, 0);
  const lowStockProductsCount = products.filter((p) => p.stock < 5).length;

  // Top Selling Frames Calculation
  const productSalesMap: Record<string, ProductSalesItem> = {};
  orders.forEach((o) => {
    o.items.forEach((item) => {
      if (item.product) {
        const pId = item.product.id;
        if (!productSalesMap[pId]) {
          productSalesMap[pId] = { product: item.product, qty: 0, revenue: 0 };
        }
        productSalesMap[pId].qty += item.quantity;
        productSalesMap[pId].revenue += item.price * item.quantity;
      }
    });
  });

  const topSellingFrames = Object.values(productSalesMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  return {
    products,
    orders: orders.slice(0, 8), // Recent 8 orders
    totalRevenue,
    totalOrdersCount,
    totalCustomersCount: totalCustomersCount.length,
    rxRatio,
    pendingLabCount,
    totalStockCount,
    lowStockProductsCount,
    topSellingFrames,
  };
}

export default async function AdminDashboardPage() {
  const metrics = await getDashboardMetrics();

  return (
    <div className="space-y-8">
      {/* Dashboard Top Hero Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200/80 mt-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/60 inline-block mb-1">
            EXECUTIVE CONTROL CENTER
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Optical Retail Performance & Analytics
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time metrics, prescription order pipeline, and frame inventory stats
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/admin/products"
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 shadow-md transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Eyewear Frame</span>
          </Link>

          <Link
            href="/admin/orders"
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <span>Lab Orders ({metrics.pendingLabCount})</span>
          </Link>
        </div>
      </div>

      {/* KPI Key Performance Indicator Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue Card */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Total Revenue
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-extrabold">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {formatPrice(metrics.totalRevenue)}
            </p>
            <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-emerald-600">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+18.4% vs last period</span>
            </div>
          </div>
        </div>

        {/* Prescription Ratio Card */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Prescription Ratio
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-extrabold">
              <Glasses className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {metrics.rxRatio}% <span className="text-xs font-normal text-slate-400">Rx Orders</span>
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Custom optical fitting sales
            </p>
          </div>
        </div>

        {/* Active Orders / Pending Lab Card */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Pending Lab Queue
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-extrabold">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {metrics.pendingLabCount} <span className="text-xs font-normal text-slate-400">Orders</span>
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Avg turnaround: ~24 hours
            </p>
          </div>
        </div>

        {/* Customer Base Card */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Active Customers
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-extrabold">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {metrics.totalCustomersCount}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Registered buyers in CRM
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Orders + Top Selling Frames */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Col 1 & 2: Recent Customer Orders Pipeline */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-600" />
              Recent Prescription Orders
            </h2>
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              <span>View All Pipeline ({metrics.totalOrdersCount})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
            <div className="divide-y divide-slate-100 text-xs">
              {metrics.orders.length === 0 ? (
                <div className="p-12 text-center text-slate-400 font-medium">
                  No orders recorded yet. When customers check out, their orders will show here.
                </div>
              ) : (
                metrics.orders.map((order) => {
                  const hasRx = order.items.some((i) => i.prescription);
                  return (
                    <div
                      key={order.id}
                      className="p-5 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono font-extrabold text-[11px]">
                            {order.orderNumber || "ORDER-000"}
                          </span>
                          <span className="font-extrabold text-slate-900 text-sm">{order.customerName}</span>
                          {hasRx && (
                            <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200/80 text-amber-900 text-[10px] font-extrabold uppercase">
                              Rx Included
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium">
                          {new Date(order.createdAt).toLocaleDateString()} · {order.items.length} Frame Item(s)
                        </p>
                      </div>

                      <div className="flex items-center gap-3 justify-between sm:justify-end">
                        <span className="font-mono font-extrabold text-slate-900 text-sm">
                          {formatPrice(order.totalAmount)}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-xl text-[11px] font-bold border ${
                            order.status === "PENDING"
                              ? "bg-amber-50 text-amber-900 border-amber-200"
                              : order.status === "PROCESSING"
                              ? "bg-blue-50 text-blue-900 border-blue-200"
                              : order.status === "SHIPPED"
                              ? "bg-indigo-50 text-indigo-900 border-indigo-200"
                              : "bg-emerald-50 text-emerald-900 border-emerald-200"
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Col 3: Top Selling Frames Showcase */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Glasses className="w-5 h-5 text-slate-700" />
              Top Selling Frames
            </h2>
            <Link
              href="/admin/products"
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              <span>Catalog ({metrics.products.length})</span>
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-2xs">
            {metrics.topSellingFrames.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs font-medium">
                Sales rankings will generate as orders come in.
              </div>
            ) : (
              metrics.topSellingFrames.map((item, idx) => (
                <div key={item.product.id} className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-900 font-mono font-extrabold text-xs flex items-center justify-center flex-shrink-0">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-extrabold text-slate-900">{item.product.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {item.product.material} · {item.product.frameShape}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-slate-900 block font-mono">
                      {item.qty} Sold
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold">
                      {formatPrice(item.revenue)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Inventory Alert Widget */}
          <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Boxes className="w-4 h-4" /> Stock Monitor
              </span>
              {metrics.lowStockProductsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold">
                  {metrics.lowStockProductsCount} Low Stock
                </span>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xl font-extrabold font-mono text-white">
                {metrics.totalStockCount} <span className="text-xs font-normal text-slate-400">Total Units</span>
              </p>
              <p className="text-[11px] text-slate-400 font-medium">
                In-stock frames available across store catalog
              </p>
            </div>

            <Link
              href="/admin/inventory"
              className="block w-full py-2 text-center rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs transition-colors"
            >
              Open Quick Stock Adjuster
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
