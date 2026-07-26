"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Mail,
  Phone,
  MapPin,
  Download,
  FileText,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import A4ReceiptModal, { OrderReceiptData } from "@/components/A4ReceiptModal";

export interface CustomerData {
  email: string;
  name: string;
  phone: string;
  address: string;
  totalSpent: number;
  ordersCount: number;
  lastOrderDate: string;
  orders: OrderReceiptData[];
}

export interface CustomersCRMClientProps {
  initialCustomers: CustomerData[];
}

export default function CustomersCRMClient({ initialCustomers }: CustomersCRMClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<OrderReceiptData | null>(null);

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return initialCustomers;
    const q = searchQuery.toLowerCase();
    return initialCustomers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q)
    );
  }, [initialCustomers, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/60 inline-block mb-1">
            OPTICAL CUSTOMER RELATIONSHIP MANAGEMENT
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Customer Database & Optical Profiles
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Track customer spend, order history, phone numbers, and optical prescription records
          </p>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, email, or phone number..."
            className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:border-slate-900"
          />
        </div>
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-400 text-xs font-medium bg-white rounded-2xl border border-slate-200">
            No customers found matching search query.
          </div>
        ) : (
          filteredCustomers.map((c) => (
            <div key={c.email} className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-900 flex items-center justify-center font-extrabold text-sm border border-amber-200/60">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">{c.name}</h3>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" /> {c.email}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black font-mono text-slate-900 block">
                    {formatPrice(c.totalSpent)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase">
                    {c.ordersCount} Order(s)
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1.5 text-xs">
                {c.phone && (
                  <p className="text-slate-700 font-bold flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone: {c.phone}
                  </p>
                )}
                {c.address && (
                  <p className="text-slate-600 font-medium flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> Address: {c.address}
                  </p>
                )}
                <p className="text-slate-400 text-[11px]">
                  Latest Purchase: {new Date(c.lastOrderDate).toLocaleDateString()}
                </p>
              </div>

              {/* Order History Quick List */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Recent Orders & Receipts
                </span>
                <div className="space-y-1.5">
                  {c.orders.slice(0, 3).map((ord) => (
                    <div key={ord.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 text-xs">
                      <span className="font-mono font-extrabold text-slate-900">
                        {ord.orderNumber || "ORDER-000"}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-700">{formatPrice(ord.totalAmount)}</span>
                        <button
                          onClick={() => setSelectedReceiptOrder(ord)}
                          className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-800 flex items-center gap-1 cursor-pointer"
                        >
                          <FileText className="w-3 h-3" /> Receipt
                        </button>
                        <a
                          href={`/api/admin/orders/${ord.id}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded bg-slate-900 hover:bg-black text-white cursor-pointer"
                          title="Download PDF"
                        >
                          <Download className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Printable / Downloadable A4 Receipt Modal */}
      {selectedReceiptOrder && (
        <A4ReceiptModal
          order={selectedReceiptOrder}
          onClose={() => setSelectedReceiptOrder(null)}
        />
      )}
    </div>
  );
}
