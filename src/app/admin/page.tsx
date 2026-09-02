import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import {
  Banknote,
  ShoppingBag,
  Glasses,
  Users,
  Clock,
  ArrowUpRight,
  PackageCheck,
} from "lucide-react";
import { Product } from "@prisma/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface ProductSalesItem {
  product: Product;
  qty: number;
  revenue: number;
}

async function getDashboardMetrics() {
  try {
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

    const totalRevenue = (orders || []).reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalOrdersCount = orders ? orders.length : 0;

    // Prescription vs Non-Prescription Sales Ratio
    let rxOrdersCount = 0;
    (orders || []).forEach((o) => {
      const hasRx = o.items && o.items.some((i) => i.prescription);
      if (hasRx) rxOrdersCount++;
    });
    const rxRatio = totalOrdersCount > 0 ? Math.round((rxOrdersCount / totalOrdersCount) * 100) : 0;

    // Pending Lab Queue
    const pendingLabCount = (orders || []).filter(
      (o) => o.status === "PENDING" || o.status === "PROCESSING"
    ).length;

    // Total In-Stock Frames
    const totalStockCount = (products || []).reduce((sum, p) => sum + (p.stock || 0), 0);
    const lowStockProductsCount = (products || []).filter((p) => (p.stock || 0) < 5).length;

    // Top Selling Frames Calculation
    const productSalesMap: Record<string, ProductSalesItem> = {};
    (orders || []).forEach((o) => {
      (o.items || []).forEach((item) => {
        if (item.product) {
          const pId = item.product.id;
          if (!productSalesMap[pId]) {
            productSalesMap[pId] = { product: item.product, qty: 0, revenue: 0 };
          }
          productSalesMap[pId].qty += item.quantity || 1;
          productSalesMap[pId].revenue += (item.price || 0) * (item.quantity || 1);
        }
      });
    });

    const topSellingFrames = Object.values(productSalesMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    return {
      products: products || [],
      orders: (orders || []).slice(0, 8), // Recent 8 orders
      totalRevenue,
      totalOrdersCount,
      totalCustomersCount: totalCustomersCount ? totalCustomersCount.length : 0,
      rxRatio,
      pendingLabCount,
      totalStockCount,
      lowStockProductsCount,
      topSellingFrames,
      hasError: false,
      errorMessage: null as string | null,
    };
  } catch (err) {
    console.error("Admin Page Database Error:", err);
    return {
      products: [],
      orders: [],
      totalRevenue: 0,
      totalOrdersCount: 0,
      totalCustomersCount: 0,
      rxRatio: 0,
      pendingLabCount: 0,
      totalStockCount: 0,
      lowStockProductsCount: 0,
      topSellingFrames: [],
      hasError: true,
      errorMessage: err instanceof Error ? err.message : "Database connection issue",
    };
  }
}

export default async function AdminDashboardPage() {
  const metrics = await getDashboardMetrics();

  return (
    <div className="space-y-8">
      {/* Database Warning Banner if DB has connection issues */}
      {metrics.hasError && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-3">
          <div className="p-1 rounded bg-amber-200 text-amber-900 font-bold text-xs">WARNING</div>
          <div className="text-sm">
            <p className="font-bold">Database Temporarily Unavailable</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Could not retrieve live records ({metrics.errorMessage || "Connection error"}). Displaying fallback view. Check database credentials or network status.
            </p>
          </div>
        </div>
      )}

      {/* Dashboard Top Hero Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <span className="badge">DASHBOARD</span>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Store Overview</h1>
          <p className="text-sm text-slate-500">Real-time sales metrics, customer orders, and frame inventory overview</p>
        </div>
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <Link
            href="/"
            target="_blank"
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm font-medium px-4 py-2 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
          >
            Storefront
          </Link>
          <Link
            href="/admin/orders"
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm font-medium px-4 py-2 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
          >
            <span>Orders</span>
            <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full font-semibold border border-slate-200/80">
              {metrics.pendingLabCount}
            </span>
          </Link>
          <Link
            href="/admin/products"
            className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-4 py-2 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
          >
            + Add Eyewear Frame
          </Link>
        </div>
      </div>

      {/* KPI Key Performance Indicator Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-colors space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Total Revenue
            </span>
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatPrice(metrics.totalRevenue)}
            </p>
            <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-emerald-600">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+18.4% vs last period</span>
            </div>
          </div>
        </div>

        {/* Prescription Ratio Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-colors space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Prescription Share
            </span>
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Glasses className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">
              {metrics.rxRatio}% <span className="text-xs font-normal text-slate-400">Rx Orders</span>
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Custom lab orders
            </p>
          </div>
        </div>

        {/* Active Orders / Pending Lab Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-colors space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Pending Lab Fitting
            </span>
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">
              {metrics.pendingLabCount} <span className="text-xs font-normal text-slate-400">Orders</span>
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Waiting for workshop
            </p>
          </div>
        </div>

        {/* Customer Base Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-colors space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Active Customers
            </span>
            <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">
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
        {/* Col 1 & 2: Recent Customer Orders */}
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
              <span>View All Orders ({metrics.totalOrdersCount})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs">
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
                          <span className="bg-slate-100 text-slate-700 font-mono text-xs px-2.5 py-1 rounded-md border border-slate-200">
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
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            order.status === "PENDING"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : order.status === "PROCESSING"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : order.status === "SHIPPED"
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
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

        {/* Col 3: Top Selling Frames Showcase + Stock Overview */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Glasses className="w-5 h-5 text-slate-700" />
                Top Selling Frames
              </h2>
              <Link
                href="/admin/products"
                className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
              >
                <span>Catalog ({metrics.products.length})</span>
              </Link>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-3 shadow-2xs">
              {metrics.topSellingFrames.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-medium">
                  Sales rankings will generate as orders come in.
                </div>
              ) : (
                metrics.topSellingFrames.map((item, idx) => (
                  <div
                    key={item.product.id}
                    className="border border-slate-100 rounded-xl p-3.5 flex items-center justify-between gap-3 bg-white"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">{item.product.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {item.product.material} · {item.product.frameShape}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-0.5 shrink-0">
                      <span className="text-sm font-semibold text-slate-900 block font-mono">
                        {formatPrice(item.revenue)}
                      </span>
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        {item.qty} Sold
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Inventory Alert Widget */}
          <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800">
                <PackageCheck className="w-4 h-4 text-amber-600" /> Stock Overview
              </div>
              {metrics.lowStockProductsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold">
                  {metrics.lowStockProductsCount} Low Stock
                </span>
              )}
            </div>
            <div>
              <div>
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{metrics.totalStockCount}</span>{" "}
                <span className="text-xs text-slate-500 font-medium">Total Units</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Frames currently available in live store inventory
              </p>
            </div>

            <Link
              href="/admin/inventory"
              className="w-full mt-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
              Open Quick Stock Adjuster
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

