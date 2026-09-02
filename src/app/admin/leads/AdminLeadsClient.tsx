"use client";

import React, { useState } from "react";
import { ClipboardList, MessageCircle, User, Calendar, Phone, CheckCircle2, AlertCircle, Trash2, Loader2 } from "lucide-react";

export interface LeadItem {
  id: string;
  name: string;
  age?: number;
  whatsapp: string;
  frameId?: string | null;
  frameName?: string | null;
  status: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleString("en-PK", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: string }) {
  const isConverted = status.toUpperCase() === "CONVERTED";
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
      isConverted ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60" : "bg-amber-50 text-amber-800 border border-amber-200/60"
    }`}>
      {isConverted ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
      {isConverted ? "CONVERTED" : "ACTIVE LEAD"}
    </span>
  );
}

export default function AdminLeadsClient({ initialLeads }: { initialLeads: LeadItem[] }) {
  const [leads, setLeads] = useState<LeadItem[]>(initialLeads);
  const [filter, setFilter] = useState<"ACTIVE" | "CONVERTED" | "ALL">("ACTIVE");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const total = leads.length;
  const converted = leads.filter(l => l.status.toUpperCase() === "CONVERTED").length;
  const active = total - converted;

  const filteredLeads = leads.filter(l => {
    if (filter === "ACTIVE") return l.status.toUpperCase() !== "CONVERTED";
    if (filter === "CONVERTED") return l.status.toUpperCase() === "CONVERTED";
    return true;
  });

  const handleDeleteLead = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lead from the queue?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/leads?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setLeads(prev => prev.filter(l => l.id !== id));
      } else {
        alert("Failed to delete lead from server.");
      }
    } catch {
      alert("Error deleting lead.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center">
              <ClipboardList className="w-4.5 h-4.5 text-amber-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">MY EYES Lead Management CRM</h1>
          </div>
          <p className="text-sm text-slate-500">Automated lead tracking & deduplication engine. Matching phone numbers are auto-deleted when orders are completed.</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active Lead Queue", value: active, color: "text-amber-700", filterKey: "ACTIVE" as const },
          { label: "Converted to Order", value: converted, color: "text-emerald-700", filterKey: "CONVERTED" as const },
          { label: "Total Leads", value: total, color: "text-slate-900", filterKey: "ALL" as const },
        ].map(s => (
          <button
            key={s.label}
            onClick={() => setFilter(s.filterKey)}
            className={`bg-white border rounded-2xl p-4 shadow-xs text-left transition-all cursor-pointer ${
              filter === s.filterKey ? "border-amber-500 ring-2 ring-amber-400/20" : "border-slate-200/80 hover:border-slate-300"
            }`}
          >
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{s.label}</p>
            <p className={`text-2xl font-extrabold mt-1 ${s.color}`}>{s.value}</p>
          </button>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { key: "ACTIVE" as const, label: `Active Queue (${active})` },
          { key: "CONVERTED" as const, label: `Converted (${converted})` },
          { key: "ALL" as const, label: `All History (${total})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === tab.key ? "bg-slate-900 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Leads Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              {filter === "ACTIVE" ? "Active Lead Queue" : filter === "CONVERTED" ? "Converted Orders Queue" : "All Leads"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{filteredLeads.length} record{filteredLeads.length !== 1 ? "s" : ""} displayed</p>
          </div>
        </div>

        {filteredLeads.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <ClipboardList className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No leads found in this view</p>
            <p className="text-xs text-slate-500 mt-1">Leads with matching phone numbers automatically auto-delete when customers place orders.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100">
                  <th className="px-5 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Customer Name</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Mobile Number</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Frame Name</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Captured Date & Time</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">CRM Status</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.map(lead => {
                  const waNumber = lead.whatsapp.replace(/\D/g, "");
                  const waHref = `https://wa.me/92${waNumber.startsWith("92") ? waNumber.slice(2) : (waNumber.startsWith("0") ? waNumber.slice(1) : waNumber)}`;
                  const isDeleting = deletingId === lead.id;

                  return (
                    <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-amber-50 border border-amber-200/60 flex items-center justify-center flex-shrink-0">
                            <User className="w-3.5 h-3.5 text-amber-600" />
                          </div>
                          <span className="font-semibold text-slate-900">{lead.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-slate-700 font-mono">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {lead.whatsapp}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center font-semibold text-slate-900 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-md border border-amber-200">
                          {lead.frameName || "Selected Frame"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(lead.updatedAt || lead.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={lead.status} />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <a
                            href={waHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/30 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100/80 transition-colors font-semibold text-[11px]"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            WhatsApp
                          </a>

                          <button
                            onClick={() => handleDeleteLead(lead.id)}
                            disabled={isDeleting}
                            title="Delete lead from queue"
                            className="inline-flex items-center gap-1 p-1.5 rounded-lg border border-red-200 text-red-600 bg-red-50/50 hover:bg-red-100 transition-colors font-semibold text-[11px] cursor-pointer"
                          >
                            {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
