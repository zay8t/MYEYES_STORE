import React from "react";
import { prisma } from "@/lib/prisma";
import { ClipboardList, MessageCircle, User, Calendar, Phone } from "lucide-react";

export const revalidate = 0;

function formatDate(d: Date | string) {
  return new Date(d).toLocaleString("en-PK", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    abandoned: "bg-red-50 text-red-700 border border-red-200/60",
    converted: "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles[status] || "bg-slate-100 text-slate-600"}`}>
      {status}
    </span>
  );
}

export default async function AdminLeadsPage() {
  let leads: { id: string; name: string; age: number; whatsapp: string; frameId: string | null; status: string; createdAt: Date }[] = [];

  try {
    leads = await prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Leads page DB error:", error);
  }

  const total = leads.length;
  const converted = leads.filter(l => l.status === "converted").length;
  const abandoned = leads.filter(l => l.status === "abandoned").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center">
              <ClipboardList className="w-4.5 h-4.5 text-amber-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Partial Orders / Leads</h1>
          </div>
          <p className="text-sm text-slate-500">Customers who started the lens configurator but haven&apos;t completed checkout.</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Leads", value: total, color: "text-slate-900" },
          { label: "Converted", value: converted, color: "text-emerald-700" },
          { label: "Abandoned", value: abandoned, color: "text-red-700" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{s.label}</p>
            <p className={`text-2xl font-extrabold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Leads Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">All Leads</h2>
          <p className="text-xs text-slate-500 mt-0.5">{total} record{total !== 1 ? "s" : ""} — most recent first</p>
        </div>

        {leads.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <ClipboardList className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No leads yet</p>
            <p className="text-xs text-slate-500 mt-1">Leads will appear here when customers start the lens configurator.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100">
                  <th className="px-5 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Age</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">WhatsApp</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map(lead => {
                  const waNumber = lead.whatsapp.replace(/\D/g, "");
                  const waHref = `https://wa.me/92${waNumber.startsWith("92") ? waNumber.slice(2) : waNumber}`;
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
                      <td className="px-4 py-3.5 text-slate-700 font-medium">{lead.age} yrs</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {lead.whatsapp}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={lead.status} />
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(lead.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <a
                          href={waHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/30 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100/80 transition-colors font-semibold text-[11px]"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          WhatsApp
                        </a>
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
