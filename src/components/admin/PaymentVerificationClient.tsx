"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Contrast,
  Eye,
  Clock,
  TrendingUp,
  Banknote,
  Phone,
  Mail,
  User,
  Hash,
  Shield,
  ShieldAlert,
  RefreshCw,
  FileText,
  Loader2,
  X,
  Check,
  Copy,
  ExternalLink,
  Maximize2,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  verifyPaymentAction,
  rejectPaymentAction,
  flagPaymentAction,
} from "@/app/actions/admin";

// ─────────────────────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────────────────────
export interface PaymentOrder {
  id: string;
  orderNumber?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  paymentMethod?: string | null;
  paymentStatus: string;
  paymentReceiptUrl?: string | null;
  transactionId?: string | null;
  paymentSenderName?: string | null;
  paymentSenderPhone?: string | null;
  ocrExtractedTid?: string | null;
  ocrConfidenceScore?: number | null;
  isOcrMatched: boolean;
  flaggedSuspicious: boolean;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
  rejectionReason?: string | null;
  customerNotified: boolean;
  totalAmount: number;
  createdAt: string;
  items: Array<{
    id: string;
    price: number;
    quantity: number;
    selectedLensName?: string | null;
    totalAmount?: number | null;
    product: { name: string; category: string };
    prescription?: {
      lensType: string;
      odSph: number;
      osSph: number;
      odCyl?: number | null;
      osCyl?: number | null;
      odAxis?: number | null;
      osAxis?: number | null;
      pd: number;
    } | null;
  }>;
  auditLogs: Array<{
    id: string;
    action: string;
    actor: string;
    notes?: string | null;
    createdAt: string;
  }>;
}

interface PaymentVerificationClientProps {
  initialOrders: PaymentOrder[];
}

// ─────────────────────────────────────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────────────────────────────────────
const REJECTION_REASONS = [
  "Invalid TID",
  "Amount Mismatch",
  "Blurry Screenshot",
  "Duplicate Receipt",
  "TID does not match bank records",
  "Wrong beneficiary account / mobile number",
  "Transaction is too old (>48 hours)",
];

const FILTER_TABS = [
  { id: "ALL", label: "All Orders", color: "text-slate-700 bg-white border-slate-200" },
  { id: "PENDING_VERIFICATION", label: "Pending Verification", color: "text-amber-700 bg-amber-50 border-amber-200" },
  { id: "PAID", label: "Approved / Paid", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  { id: "FAILED", label: "Rejected", color: "text-rose-700 bg-rose-50 border-rose-200" },
];

const ADMIN_EMAIL = "admin@myeyes.pk";

function formatPKR(amount: number) {
  return `Rs. ${amount.toLocaleString("en-PK")}/-`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Status Badge
// ─────────────────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    PENDING_VERIFICATION: { label: "Pending Verification", cls: "bg-amber-100 text-amber-800 border-amber-200" },
    RECEIPT_SUBMITTED: { label: "Receipt In", cls: "bg-blue-100 text-blue-800 border-blue-200" },
    PAID: { label: "✓ Approved / Paid", cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    FAILED: { label: "✗ Rejected", cls: "bg-rose-100 text-rose-800 border-rose-200" },
    FLAGGED_SUSPICIOUS: { label: "⚠ Flagged", cls: "bg-orange-100 text-orange-800 border-orange-200" },
    PENDING: { label: "Pending", cls: "bg-slate-100 text-slate-600 border-slate-200" },
    UNPAID: { label: "Unpaid", cls: "bg-amber-100 text-amber-800 border-amber-200" },
    SUBMITTED: { label: "Submitted", cls: "bg-blue-100 text-blue-800 border-blue-200" },
  };
  const cfg = map[status] || { label: status.replace(/_/g, " "), cls: "bg-slate-100 text-slate-600 border-slate-200" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  OCR TID Comparison Widget
// ─────────────────────────────────────────────────────────────────────────────
function TidComparison({ order }: { order: PaymentOrder }) {
  const customerTid = order.transactionId || "—";
  const ocrTid = order.ocrExtractedTid || "—";
  const isMatch = order.isOcrMatched;
  const confidence = order.ocrConfidenceScore ?? 0;

  if (!order.ocrExtractedTid && !order.transactionId) return null;

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" /> OCR TID Analysis
        </span>
        {order.ocrExtractedTid && (
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${confidence >= 80 ? "bg-emerald-100 text-emerald-700" : confidence >= 60 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
            {confidence.toFixed(0)}% confidence
          </span>
        )}
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Customer Entered</p>
          <p className="font-mono text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 px-2 py-1.5 rounded-lg break-all">{customerTid}</p>
        </div>
        <div>
          <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">OCR Extracted</p>
          <p className="font-mono text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 px-2 py-1.5 rounded-lg break-all">{ocrTid}</p>
        </div>
      </div>
      {order.ocrExtractedTid && order.transactionId && (
        <div className={`mx-4 mb-4 px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-bold ${isMatch ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {isMatch ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
          {isMatch ? "TIDs match — receipt appears genuine." : "TID mismatch — manual review required."}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Interactive Receipt Viewer
// ─────────────────────────────────────────────────────────────────────────────
function ReceiptViewer({ url, onMaximize }: { url: string; onMaximize?: () => void }) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [inverted, setInverted] = useState(false);
  const [panning, setPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!panning) return;
    setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
  };
  const handleMouseUp = () => setPanning(false);

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden bg-[#0f172a]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#1e293b] border-b border-slate-700">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Receipt Viewer</span>
        <div className="flex items-center gap-1">
          <button onClick={() => setZoom((z) => Math.min(3, z + 0.5))} className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 cursor-pointer" title="Zoom In (+)">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.5))} className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 cursor-pointer" title="Zoom Out (-)">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setRotation((r) => (r + 90) % 360)} className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 cursor-pointer" title="Rotate">
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setInverted((v) => !v)} className={`p-1.5 rounded-lg cursor-pointer ${inverted ? "bg-amber-500 text-white" : "bg-slate-700 hover:bg-slate-600 text-slate-300"}`} title="Invert Colors">
            <Contrast className="w-3.5 h-3.5" />
          </button>
          {onMaximize && (
            <button onClick={onMaximize} className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 cursor-pointer" title="Full Screen View">
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="text-[10px] font-mono text-slate-500 ml-1">{(zoom * 100).toFixed(0)}%</span>
          <a href={url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 cursor-pointer ml-1" title="Open Original">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
      {/* Viewer canvas */}
      <div
        className="overflow-hidden h-64 flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={onMaximize}
        title="Click to view full resolution"
      >
        <img
          src={url}
          alt="Payment receipt"
          draggable={false}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
            transition: panning ? "none" : "transform 0.2s ease",
            filter: inverted ? "invert(1)" : "none",
            maxWidth: "none",
            maxHeight: "none",
          }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Audit Log Timeline
// ─────────────────────────────────────────────────────────────────────────────
function AuditLogTimeline({ logs }: { logs: PaymentOrder["auditLogs"] }) {
  if (!logs.length) return null;
  const actionColors: Record<string, string> = {
    SUBMITTED: "bg-blue-500",
    OCR_PARSED: "bg-purple-500",
    APPROVED: "bg-emerald-500",
    REJECTED: "bg-red-500",
    FLAGGED: "bg-orange-500",
    NOTIFIED: "bg-teal-500",
  };

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
        <FileText className="w-3.5 h-3.5" /> Audit Log
      </p>
      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {[...logs].reverse().map((log) => (
          <div key={log.id} className="flex gap-2.5 text-[11px]">
            <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${actionColors[log.action] || "bg-slate-400"}`} />
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-slate-800">{log.action}</span>
                <span className="text-slate-400 text-[10px]">by {log.actor}</span>
                <span className="text-slate-300 text-[10px]">· {timeAgo(log.createdAt)}</span>
              </div>
              {log.notes && <p className="text-slate-500 mt-0.5 leading-snug">{log.notes}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Reject Dialog
// ─────────────────────────────────────────────────────────────────────────────
function RejectDialog({
  order,
  onClose,
  onConfirm,
  loading,
}: {
  order: PaymentOrder;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading: boolean;
}) {
  const [selected, setSelected] = useState(REJECTION_REASONS[0]);
  const [custom, setCustom] = useState("");
  const finalReason = custom.trim() || selected;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-900">Reject Payment</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Order #{order.orderNumber || order.id.slice(0, 8)}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Select Rejection Reason</label>
            {REJECTION_REASONS.map((r) => (
              <label key={r} className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${selected === r && !custom ? "border-red-400 bg-red-50" : "border-slate-200 hover:border-slate-300"}`}>
                <input
                  type="radio"
                  name="reason"
                  checked={selected === r && !custom}
                  onChange={() => { setSelected(r); setCustom(""); }}
                  className="accent-red-600"
                />
                <span className="text-xs text-slate-700 font-medium">{r}</span>
              </label>
            ))}
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Or Custom Reason</label>
            <textarea
              rows={2}
              placeholder="Enter custom rejection reason..."
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-xl p-3 resize-none focus:outline-none focus:border-slate-900"
            />
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium">
            ⚠️ The customer will receive a WhatsApp notification with a re-upload link.
          </div>
        </div>
        <div className="p-5 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(finalReason)}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
            Reject & Notify
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function PaymentVerificationClient({ initialOrders }: PaymentVerificationClientProps) {
  const [orders, setOrders] = useState<PaymentOrder[]>(initialOrders);
  const [activeTab, setActiveTab] = useState("PENDING_VERIFICATION");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selected, setSelected] = useState<PaymentOrder | null>(initialOrders[0] || null);
  const [actionLoading, setActionLoading] = useState(false);
  const [fullscreenReceipt, setFullscreenReceipt] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Show toast
  const showToast = (msg: string, type: "success" | "error" | "info" = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Filter orders
  const filtered = useMemo(() => {
    let list = orders;

    // Tab filter
    if (activeTab === "PENDING_VERIFICATION") {
      list = list.filter(
        (o) =>
          o.paymentStatus === "PENDING_VERIFICATION" ||
          (o.paymentStatus !== "PAID" && o.paymentStatus !== "FAILED")
      );
    } else if (activeTab === "PAID") {
      list = list.filter((o) => o.paymentStatus === "PAID");
    } else if (activeTab === "FAILED") {
      list = list.filter((o) => o.paymentStatus === "FAILED");
    }

    // Search filter
    const q = debouncedSearch.toLowerCase();
    if (q) {
      list = list.filter(
        (o) =>
          o.orderNumber?.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerPhone?.includes(q) ||
          o.paymentSenderName?.toLowerCase().includes(q) ||
          o.paymentSenderPhone?.includes(q) ||
          o.transactionId?.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, activeTab, debouncedSearch]);

  // Tab counts
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    c["PENDING_VERIFICATION"] = orders.filter(
      (o) =>
        o.paymentStatus === "PENDING_VERIFICATION" ||
        (o.paymentStatus !== "PAID" && o.paymentStatus !== "FAILED")
    ).length;
    c["PAID"] = orders.filter((o) => o.paymentStatus === "PAID").length;
    c["FAILED"] = orders.filter((o) => o.paymentStatus === "FAILED").length;
    c["ALL"] = orders.length;
    return c;
  }, [orders]);

  // Metrics
  const metrics = useMemo(() => {
    const pendingOrders = orders.filter(
      (o) =>
        o.paymentStatus === "PENDING_VERIFICATION" ||
        (o.paymentStatus !== "PAID" && o.paymentStatus !== "FAILED")
    );
    const pendingAmount = pendingOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const pendingCount = pendingOrders.length;

    const today = new Date().toDateString();
    const approvedTodayOrders = orders.filter((o) => {
      if (o.paymentStatus !== "PAID") return false;
      const d = o.verifiedAt ? new Date(o.verifiedAt) : new Date(o.createdAt);
      return d.toDateString() === today;
    });
    const approvedTodayAmount = approvedTodayOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const approvedTodayCount = approvedTodayOrders.length;

    const totalReceiptsCount = orders.filter((o) => Boolean(o.paymentReceiptUrl || o.transactionId)).length;

    return {
      pendingAmount,
      pendingCount,
      approvedTodayAmount,
      approvedTodayCount,
      totalReceiptsCount,
    };
  }, [orders]);

  const updateOrderInState = useCallback((orderId: string, patch: Partial<PaymentOrder>) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...patch } : o)));
    setSelected((prev) => (prev?.id === orderId ? { ...prev, ...patch } : prev));
  }, []);

  const handleApproveTarget = useCallback(async (targetOrder: PaymentOrder) => {
    if (actionLoading) return;
    setActionLoading(true);
    const result = await verifyPaymentAction(targetOrder.id, ADMIN_EMAIL);
    if (result.success) {
      updateOrderInState(targetOrder.id, {
        paymentStatus: "PAID",
        verifiedBy: ADMIN_EMAIL,
        verifiedAt: new Date().toISOString(),
      });
      showToast(`✅ Order #${targetOrder.orderNumber || targetOrder.id.slice(0, 8)} approved & customer notified.`, "success");
    } else {
      showToast(result.error || "Failed to approve", "error");
    }
    setActionLoading(false);
  }, [actionLoading, updateOrderInState]);

  const handleApprove = useCallback(async () => {
    if (!selected) return;
    await handleApproveTarget(selected);
  }, [selected, handleApproveTarget]);

  const handleRejectTarget = useCallback(async (targetOrder: PaymentOrder, reason: string) => {
    if (actionLoading) return;
    setActionLoading(true);
    const result = await rejectPaymentAction(targetOrder.id, ADMIN_EMAIL, reason);
    if (result.success) {
      updateOrderInState(targetOrder.id, { paymentStatus: "FAILED", rejectionReason: reason });
      showToast(`❌ Order #${targetOrder.orderNumber || targetOrder.id.slice(0, 8)} rejected. Customer notified.`, "error");
      setShowRejectDialog(false);
    } else {
      showToast(result.error || "Failed to reject", "error");
    }
    setActionLoading(false);
  }, [actionLoading, updateOrderInState]);

  const handleReject = useCallback(async (reason: string) => {
    if (!selected) return;
    await handleRejectTarget(selected, reason);
  }, [selected, handleRejectTarget]);

  const handleFlag = useCallback(async () => {
    if (!selected || actionLoading) return;
    setActionLoading(true);
    const result = await flagPaymentAction(selected.id, ADMIN_EMAIL, "Flagged for manager review via hotkey.");
    if (result.success) {
      updateOrderInState(selected.id, { paymentStatus: "FLAGGED_SUSPICIOUS", flaggedSuspicious: true });
      showToast(`⚠️ Order #${selected.orderNumber || selected.id.slice(0, 8)} flagged for review.`, "info");
    } else {
      showToast(result.error || "Failed to flag", "error");
    }
    setActionLoading(false);
  }, [selected, actionLoading, updateOrderInState]);

  // Keyboard hotkeys
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!selected || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "a" || e.key === "A") handleApprove();
      if (e.key === "r" || e.key === "R") setShowRejectDialog(true);
      if (e.key === "f" || e.key === "F") handleFlag();
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selected, handleApprove, handleFlag]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/payments", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.orders) setOrders(data.orders);
      }
    } catch { /* silent */ }
    setRefreshing(false);
  };

  const [copiedTid, setCopiedTid] = useState<string | null>(null);

  const handleCopyTid = (tid: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(tid);
    setCopiedTid(tid);
    setTimeout(() => setCopiedTid(null), 2000);
  };

  return (
    <div className="relative w-full max-w-full overflow-hidden" ref={containerRef}>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl text-sm font-bold flex items-center gap-2 animate-fade-in-up ${toast.type === "success" ? "bg-emerald-600 text-white" : toast.type === "error" ? "bg-red-600 text-white" : "bg-slate-900 text-white"}`}>
          {toast.type === "success" ? <Check className="w-4 h-4 shrink-0" /> : toast.type === "error" ? <X className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span className="line-clamp-2">{toast.msg}</span>
        </div>
      )}

      {/* Interactive Lightbox Modal */}
      {fullscreenReceipt && selected && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-4 animate-fade-in">
          {/* Modal Header */}
          <div className="w-full max-w-5xl flex items-center justify-between py-3 px-4 sm:px-5 bg-slate-900/90 border border-slate-800 rounded-2xl mb-3 text-white">
            <div className="min-w-0 pr-2">
              <h3 className="font-extrabold text-sm sm:text-base tracking-tight truncate">
                Verifying Payment for Order #{selected.orderNumber || selected.id.slice(0, 8)}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                Customer: <strong className="text-slate-200">{selected.customerName}</strong> · Total: <strong className="text-emerald-400">{formatPKR(selected.totalAmount)}</strong> · TID: <strong className="font-mono text-amber-300">{selected.transactionId || "N/A"}</strong>
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={fullscreenReceipt}
                target="_blank"
                rel="noopener noreferrer"
                download={`receipt_order_${selected.orderNumber || selected.id}.jpg`}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                title="Download / Open Original Image"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">Original</span>
              </a>
              <button
                onClick={() => setFullscreenReceipt(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Close Fullscreen View"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="w-full max-w-5xl max-h-[80vh] flex flex-col md:flex-row items-center justify-center gap-4 overflow-y-auto">
            <div className="flex-1 max-h-[60vh] md:max-h-[75vh] flex items-center justify-center p-2">
              <img
                src={fullscreenReceipt}
                alt={`Payment Receipt for Order #${selected.orderNumber || selected.id}`}
                className="max-h-[60vh] md:max-h-[75vh] max-w-full object-contain rounded-xl shadow-2xl"
              />
            </div>
            <div className="w-full md:w-72 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-white text-xs space-y-3 shrink-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Order Information</p>
              <div>
                <span className="text-slate-400 text-[11px] block">Order Number:</span>
                <span className="font-mono font-bold text-sm text-white">#{selected.orderNumber || selected.id.slice(0, 8)}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Total Amount:</span>
                <span className="font-extrabold text-emerald-400 text-sm">{formatPKR(selected.totalAmount)}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Submitted TID:</span>
                <span className="font-mono font-bold text-amber-300">{selected.transactionId || "None"}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Customer:</span>
                <span className="font-medium text-slate-200">{selected.customerName}</span>
                {selected.customerPhone && <span className="block text-[11px] text-slate-400">{selected.customerPhone}</span>}
              </div>
              {selected.paymentSenderName && (
                <div>
                  <span className="text-slate-400 text-[11px] block">Sender Name:</span>
                  <span className="font-medium text-slate-200">{selected.paymentSenderName}</span>
                </div>
              )}
              {selected.paymentSenderPhone && (
                <div>
                  <span className="text-slate-400 text-[11px] block">Sender Phone:</span>
                  <span className="font-medium text-slate-200">{selected.paymentSenderPhone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Dialog */}
      {showRejectDialog && selected && (
        <RejectDialog
          order={selected}
          onClose={() => setShowRejectDialog(false)}
          onConfirm={handleReject}
          loading={actionLoading}
        />
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-black text-slate-900 leading-tight">
            Payment Verification & Settlement
          </h1>
          <p className="text-xs text-slate-500 max-w-sm sm:max-w-none mt-0.5">
            Verify customer bank transfer, EasyPaisa, and JazzCash proofs and approve orders.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-600">
            <kbd className="bg-white border border-slate-200 rounded px-1 py-0.5 text-emerald-700 font-mono">A</kbd> Approve ·
            <kbd className="bg-white border border-slate-200 rounded px-1 py-0.5 text-red-700 font-mono">R</kbd> Reject ·
            <kbd className="bg-white border border-slate-200 rounded px-1 py-0.5 text-orange-700 font-mono">F</kbd> Flag
          </div>
          <button
            onClick={handleRefresh}
            className="h-9 w-9 p-0 flex items-center justify-center shrink-0 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 cursor-pointer transition-colors"
            title="Refresh queue"
          >
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Stats & KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full my-4">
        {/* Card 1: Pending Verification */}
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Verification</span>
            <div className="text-xl font-extrabold text-slate-900">Rs. {metrics.pendingAmount.toLocaleString()}/-</div>
            <span className="text-xs text-slate-400 font-medium">{metrics.pendingCount} orders</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5"/>
          </div>
        </div>

        {/* Card 2: Approved Revenue */}
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Today&apos;s Approved</span>
            <div className="text-xl font-extrabold text-emerald-600">Rs. {metrics.approvedTodayAmount.toLocaleString()}/-</div>
            <span className="text-xs text-slate-400 font-medium">{metrics.approvedTodayCount} verified today</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5"/>
          </div>
        </div>

        {/* Card 3: Total Receipts */}
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Receipts</span>
            <div className="text-xl font-extrabold text-slate-900">{metrics.totalReceiptsCount}</div>
            <span className="text-xs text-slate-400 font-medium">With receipt proof</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5"/>
          </div>
        </div>
      </div>

      {/* Search Bar & Filter Tabs */}
      <div className="space-y-3 mb-5">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Order # (e.g. 00000002), TID, name, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 text-sm bg-white border border-neutral-200 rounded-xl shadow-xs focus:outline-none focus:border-slate-900 font-medium transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none w-full">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "text-xs font-bold px-3 py-1.5 rounded-xl border whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 shrink-0",
                activeTab === tab.id
                  ? `${tab.color} font-extrabold shadow-2xs ring-1 ring-slate-900/10`
                  : "text-slate-500 bg-white border-slate-200 hover:border-slate-300"
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-extrabold",
                  activeTab === tab.id ? "bg-white/80" : "bg-slate-100 text-slate-500"
                )}
              >
                {counts[tab.id] ?? 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* LEFT: Queue Panel */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col shadow-xs">
          <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Orders Queue ({filtered.length})
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Tap card to inspect</span>
          </div>

          {/* Order List / Cards */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[calc(100vh-320px)] sm:max-h-[calc(100vh-360px)]">
            {filtered.length === 0 ? (
              <div className="p-8 text-center">
                <Eye className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-500">No orders found in this filter</p>
                <p className="text-[11px] text-slate-400 mt-1">Try switching tabs or clearing your search term.</p>
              </div>
            ) : (
              filtered.map((order) => (
                <div
                  key={order.id}
                  onClick={() => setSelected(order)}
                  className={cn(
                    "w-full text-left p-3.5 sm:p-4 hover:bg-slate-50/80 transition-colors cursor-pointer group flex flex-col gap-2.5",
                    selected?.id === order.id ? "bg-slate-50/90 border-l-4 border-slate-900" : ""
                  )}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-mono font-bold text-xs bg-slate-900 hover:bg-black text-white px-2 py-0.5 rounded-md transition-colors inline-block"
                        title="Click to open order breakdown page"
                      >
                        #{order.orderNumber || order.id.slice(0, 8)}
                      </Link>
                      {order.paymentMethod && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {order.paymentMethod.replace(/_/g, " ")}
                        </span>
                      )}
                      <StatusBadge status={order.paymentStatus} />
                      {order.flaggedSuspicious && <ShieldAlert className="w-3.5 h-3.5 text-orange-500 shrink-0" />}
                      {order.isOcrMatched && <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium shrink-0">{timeAgo(order.createdAt)}</span>
                  </div>

                  {/* Card Body */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {order.customerName}
                      </p>
                      {order.customerPhone && (
                        <p className="text-[11px] text-slate-500 font-medium truncate flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          {order.customerPhone}
                        </p>
                      )}
                      <p className="text-xs font-extrabold text-slate-900 mt-1">
                        {formatPKR(order.totalAmount)}
                      </p>

                      {order.transactionId && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <span className="text-[10px] font-mono text-slate-700 bg-slate-100 border border-slate-200/80 px-1.5 py-0.5 rounded max-w-[170px] truncate">
                            TID: {order.transactionId}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyTid(order.transactionId!, e)}
                            className="p-1 text-slate-400 hover:text-slate-900 rounded transition-colors cursor-pointer shrink-0"
                            title="Copy TID"
                          >
                            {copiedTid === order.transactionId ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Inline Receipt Thumbnail (if present) */}
                    {order.paymentReceiptUrl && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(order);
                          setFullscreenReceipt(order.paymentReceiptUrl || null);
                        }}
                        className="w-14 h-14 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 shrink-0 hover:opacity-90 transition-opacity cursor-pointer relative group/thumb"
                        title="Click to view full receipt"
                      >
                        <img
                          src={order.paymentReceiptUrl}
                          alt="Receipt preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                          <ZoomIn className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mobile Quick Action Buttons (Stacked on mobile screen card) */}
                  <div className="flex sm:hidden items-center gap-2 pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected(order);
                        handleApproveTarget(order);
                      }}
                      disabled={actionLoading || order.paymentStatus === "PAID"}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected(order);
                        setShowRejectDialog(true);
                      }}
                      disabled={actionLoading || order.paymentStatus === "FAILED"}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT: Inspection Panel */}
        <div className="lg:col-span-8 w-full">
          {!selected ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-16 text-center shadow-xs">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-4">
                <Eye className="w-7 h-7 text-slate-300" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">Select an Order to Inspect</h3>
              <p className="text-[11px] text-slate-400">Click any order from the queue to inspect receipt proofs & settle payment.</p>
              <p className="hidden sm:block text-[10px] text-slate-400 mt-4">
                Use hotkeys: <kbd className="bg-slate-100 rounded px-1 font-mono text-emerald-700 font-bold">A</kbd> Approve ·{" "}
                <kbd className="bg-slate-100 rounded px-1 font-mono text-red-700 font-bold">R</kbd> Reject ·{" "}
                <kbd className="bg-slate-100 rounded px-1 font-mono text-orange-700 font-bold">F</kbd> Flag
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              {/* Inspection Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap min-w-0">
                  <Link
                    href={`/admin/orders/${selected.id}`}
                    className="font-mono font-bold text-xs sm:text-sm bg-slate-900 hover:bg-black text-white px-2.5 py-1.5 rounded-lg transition-colors inline-block"
                    title="Open Order Details"
                  >
                    #{selected.orderNumber || selected.id.slice(0, 8)}
                  </Link>
                  <div className="min-w-0">
                    <h2 className="font-extrabold text-slate-900 text-sm truncate">
                      {selected.customerName}
                    </h2>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {selected.paymentMethod?.replace(/_/g, " ") || "PREPAID"} · {formatPKR(selected.totalAmount)}
                    </p>
                  </div>
                  <StatusBadge status={selected.paymentStatus} />
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 cursor-pointer shrink-0"
                  title="Close Inspector"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 sm:p-5 space-y-5">
                {/* Side-by-Side on Desktop / Stacked on Mobile: Receipt Viewer + OCR Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Receipt Viewer */}
                  <div>
                    {selected.paymentReceiptUrl ? (
                      <ReceiptViewer
                        url={selected.paymentReceiptUrl}
                        onMaximize={() => setFullscreenReceipt(selected.paymentReceiptUrl || null)}
                      />
                    ) : (
                      <div className="rounded-xl border-2 border-dashed border-slate-200 h-64 flex items-center justify-center text-slate-400 bg-slate-50">
                        <div className="text-center p-4">
                          <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                          <p className="text-xs font-bold text-slate-400">No receipt image uploaded</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Customer may have only submitted a TID</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Order + Customer Info */}
                  <div className="space-y-3">
                    {/* Customer Details */}
                    <div className="rounded-xl border border-slate-200 p-4 space-y-2.5 bg-slate-50/50">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer & Proof Details</p>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-slate-700">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-bold">{selected.customerName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 min-w-0">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{selected.customerEmail}</span>
                        </div>
                        {selected.customerPhone && (
                          <div className="flex items-center gap-2 text-slate-500">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{selected.customerPhone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-slate-900 font-extrabold">
                          <Banknote className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{formatPKR(selected.totalAmount)}</span>
                        </div>
                        {selected.transactionId && (
                          <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200">
                            <div className="flex items-center gap-2 text-slate-700 min-w-0">
                              <Hash className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="font-mono font-bold text-xs truncate">{selected.transactionId}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyTid(selected.transactionId!)}
                              className="p-1 text-slate-400 hover:text-slate-900 rounded transition-colors cursor-pointer shrink-0"
                              title="Copy Transaction ID"
                            >
                              {copiedTid === selected.transactionId ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        )}
                        {selected.paymentSenderName && (
                          <div className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-100">
                            <strong>Sender Title:</strong> {selected.paymentSenderName}
                          </div>
                        )}
                        {selected.paymentSenderPhone && (
                          <div className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-100">
                            <strong>Sender Mobile:</strong> {selected.paymentSenderPhone}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Items */}
                    <div className="rounded-xl border border-slate-200 p-4 max-h-36 overflow-y-auto">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Order Items</p>
                      {selected.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                          <span className="text-slate-700 truncate flex-1 mr-2">{item.product.name} (x{item.quantity})</span>
                          <span className="font-bold text-slate-900 shrink-0">{formatPKR(item.totalAmount || item.price)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* OCR TID Comparison */}
                <TidComparison order={selected} />

                {/* Audit Log */}
                {selected.auditLogs.length > 0 && <AuditLogTimeline logs={selected.auditLogs} />}

                {/* Rejection Reason (if rejected) */}
                {selected.rejectionReason && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                    <strong>Rejection reason:</strong> {selected.rejectionReason}
                  </div>
                )}

                {/* Action Bar (Full-width stacked / responsive buttons) */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <button
                      onClick={handleApprove}
                      disabled={actionLoading || selected.paymentStatus === "PAID"}
                      className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-extrabold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      <span>Approve Payment</span>
                      <kbd className="hidden sm:inline bg-emerald-500 px-1.5 py-0.5 rounded text-[10px] font-mono">A</kbd>
                    </button>

                    <button
                      onClick={() => setShowRejectDialog(true)}
                      disabled={actionLoading || selected.paymentStatus === "FAILED"}
                      className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-extrabold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject Payment</span>
                      <kbd className="hidden sm:inline bg-rose-500 px-1.5 py-0.5 rounded text-[10px] font-mono">R</kbd>
                    </button>

                    <button
                      onClick={handleFlag}
                      disabled={actionLoading || selected.flaggedSuspicious}
                      className="py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-extrabold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>Flag</span>
                      <kbd className="hidden sm:inline bg-orange-400 px-1.5 py-0.5 rounded text-[10px] font-mono">F</kbd>
                    </button>
                  </div>

                  {selected.customerNotified && (
                    <p className="text-center text-[10px] text-emerald-600 font-semibold mt-2 flex items-center justify-center gap-1">
                      <Check className="w-3 h-3" /> Customer notified via WhatsApp
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
