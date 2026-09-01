"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  TicketPercent,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  Loader2,
  Megaphone,
  Copy,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Calendar,
  BadgePercent,
  Coins,
  Users2,
  Tag,
  Sparkles,
} from "lucide-react";
import type { DiscountCode, BannerTheme, DiscountType, DiscountBadgeType } from "@/types/discounts";
import { formatPrice } from "@/lib/utils";
import { invalidatePromotionCache } from "@/hooks/useActivePromotion";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const THEMES: { value: BannerTheme; label: string; cls: string }[] = [
  { value: "dark", label: "Dark Slate", cls: "bg-slate-900 text-white" },
  { value: "amber", label: "Amber Gold", cls: "bg-amber-500 text-white" },
  { value: "emerald", label: "Emerald Green", cls: "bg-emerald-600 text-white" },
  { value: "crimson", label: "Crimson Red", cls: "bg-rose-600 text-white" },
];

const THEME_CLASSES: Record<BannerTheme, string> = {
  dark: "bg-slate-900 text-white",
  amber: "bg-amber-500 text-white",
  emerald: "bg-emerald-600 text-white",
  crimson: "bg-rose-600 text-white",
};

const emptyForm = {
  code: "",
  title: "",
  type: "percentage" as DiscountType,
  amount: "" as string | number,
  minCartTotal: "" as string | number,
  maxDiscountLimit: "" as string | number,
  usageLimitTotal: "" as string | number,
  startsAt: new Date().toISOString().slice(0, 10),
  endsAt: "" as string,
  isActive: true,
  showAnnouncementBanner: false,
  bannerText: "",
  bannerTheme: "dark" as BannerTheme,
  showProductBadge: true,
  badgeLabel: "",
  badgeType: "percentage" as DiscountBadgeType,
};

type FormState = typeof emptyForm;

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isExpired(code: DiscountCode) {
  if (!code.endsAt) return false;
  return new Date(code.endsAt) < new Date();
}

function isScheduled(code: DiscountCode) {
  return new Date(code.startsAt) > new Date();
}

// ─── Discount Form Modal ───────────────────────────────────────────────────────

function DiscountFormModal({
  initial,
  onSave,
  onClose,
  saving,
}: {
  initial: FormState;
  onSave: (form: FormState) => Promise<void>;
  onClose: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<FormState>(initial);

  const set = (key: keyof FormState, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));

  const computedDefaultBadge =
    form.amount !== ""
      ? form.type === "percentage"
        ? `${form.amount}% OFF`
        : `RS. ${form.amount} OFF`
      : "20% OFF";

  const effectiveBadgeLabel = form.badgeLabel.trim() || computedDefaultBadge;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(form);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <TicketPercent className="w-4.5 h-4.5 text-amber-500" />
            <h2 className="text-sm font-extrabold text-slate-900">
              {initial.code ? `Edit: ${initial.code}` : "New Promo Code"}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Code & Title */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Promo Code *
              </label>
              <input
                required
                type="text"
                value={form.code}
                onChange={(e) => set("code", e.target.value.toUpperCase().replace(/\s/g, ""))}
                placeholder="HOLIDAY20"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono uppercase"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Title / Campaign Name *
              </label>
              <input
                required
                type="text"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Holiday Sale"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* Type & Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Discount Type *
              </label>
              <select
                value={form.type}
                onChange={(e) => set("type", e.target.value as DiscountType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed_cart">Fixed Amount (PKR)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                {form.type === "percentage" ? "Percentage (%)" : "Amount (PKR)"} *
              </label>
              <input
                required
                type="number"
                min={0}
                max={form.type === "percentage" ? 100 : undefined}
                step={form.type === "percentage" ? 0.01 : 1}
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
                placeholder={form.type === "percentage" ? "20" : "500"}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* Limits */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Min Cart (PKR)
              </label>
              <input
                type="number"
                min={0}
                step={1}
                value={form.minCartTotal}
                onChange={(e) => set("minCartTotal", e.target.value)}
                placeholder="0"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            {form.type === "percentage" && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Max Discount (PKR)
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.maxDiscountLimit}
                  onChange={(e) => set("maxDiscountLimit", e.target.value)}
                  placeholder="No cap"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            )}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Usage Limit
              </label>
              <input
                type="number"
                min={0}
                step={1}
                value={form.usageLimitTotal}
                onChange={(e) => set("usageLimitTotal", e.target.value)}
                placeholder="Unlimited"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Valid From *
              </label>
              <input
                required
                type="date"
                value={form.startsAt}
                onChange={(e) => set("startsAt", e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Expires On (optional)
              </label>
              <input
                type="date"
                value={form.endsAt}
                onChange={(e) => set("endsAt", e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-bold text-slate-800">Active Status</p>
              <p className="text-[11px] text-slate-500">Enable this code for customer checkout</p>
            </div>
            <button
              type="button"
              onClick={() => set("isActive", !form.isActive)}
              className="cursor-pointer"
            >
              {form.isActive
                ? <ToggleRight className="w-8 h-8 text-emerald-500" />
                : <ToggleLeft className="w-8 h-8 text-slate-300" />
              }
            </button>
          </div>

          {/* ── 1. Promotional Catalog Badge Section ─────────────────────── */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-4 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-slate-900" />
                <div>
                  <p className="text-sm font-bold text-slate-800">Catalog Promotional Badge</p>
                  <p className="text-[11px] text-slate-500">Show dynamic "OFF" badge &amp; strikethrough price on product cards</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => set("showProductBadge", !form.showProductBadge)}
                className="cursor-pointer"
              >
                {form.showProductBadge
                  ? <ToggleRight className="w-8 h-8 text-slate-900" />
                  : <ToggleLeft className="w-8 h-8 text-slate-300" />
                }
              </button>
            </div>

            {form.showProductBadge && (
              <div className="space-y-3 pt-2 border-t border-slate-200/80">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      Badge Type
                    </label>
                    <select
                      value={form.badgeType}
                      onChange={(e) => set("badgeType", e.target.value as DiscountBadgeType)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                    >
                      <option value="percentage">Percentage (e.g. 20% OFF)</option>
                      <option value="fixed_cart">Fixed Amount (e.g. Rs. 500 OFF)</option>
                      <option value="custom">Custom Label</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      Badge Label Override (optional)
                    </label>
                    <input
                      type="text"
                      value={form.badgeLabel}
                      onChange={(e) => set("badgeLabel", e.target.value)}
                      placeholder={`Default: ${computedDefaultBadge}`}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white font-mono uppercase"
                    />
                  </div>
                </div>

                {/* Badge Preview */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-medium text-[11px]">Card Preview:</span>
                    <span className="bg-neutral-900 text-white text-[10px] font-semibold px-2 py-0.5 rounded tracking-wider uppercase shadow-xs">
                      {effectiveBadgeLabel}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5 font-mono text-xs">
                    <span className="text-neutral-900 font-bold">Rs. 2,800</span>
                    <span className="line-through text-neutral-400 text-[10px]">Rs. 3,500</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── 2. Announcement Banner Section ──────────────────────────── */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-amber-500" />
                <div>
                  <p className="text-sm font-bold text-slate-800">Announcement Banner</p>
                  <p className="text-[11px] text-slate-500">Broadcast sticky top ribbon across customer store</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => set("showAnnouncementBanner", !form.showAnnouncementBanner)}
                className="cursor-pointer"
              >
                {form.showAnnouncementBanner
                  ? <ToggleRight className="w-8 h-8 text-amber-500" />
                  : <ToggleLeft className="w-8 h-8 text-slate-300" />
                }
              </button>
            </div>

            {form.showAnnouncementBanner && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Banner Message
                  </label>
                  <input
                    type="text"
                    value={form.bannerText}
                    onChange={(e) => set("bannerText", e.target.value)}
                    placeholder="🎉 Flash Sale! Use code HOLIDAY20 for 20% OFF!"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Banner Theme
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {THEMES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => set("bannerTheme", t.value)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border-2 cursor-pointer ${t.cls} ${form.bannerTheme === t.value ? "border-slate-900 scale-105" : "border-transparent opacity-70"}`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Banner Preview */}
                {form.bannerText && (
                  <div className={`py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${THEME_CLASSES[form.bannerTheme]}`}>
                    <Megaphone className="w-3.5 h-3.5 opacity-80 flex-shrink-0" />
                    <span>{form.bannerText}</span>
                    <span className="ml-auto px-2.5 py-1 rounded-full bg-white/20 font-bold text-[10px]">
                      {form.code || "CODE"}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                : <><Check className="w-4 h-4" /> Save Code</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DiscountsClient() {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<DiscountCode | null>(null);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useCallback((text: string, ok = true) => {
    setToastMsg({ text, ok });
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToastMsg(null), 3500);
  }, []);

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/discounts");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCodes(data);
      setError(null);
    } catch {
      setError("Failed to load discount codes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCodes(); }, [fetchCodes]);

  const handleSave = useCallback(async (form: FormState) => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
        minCartTotal: Number(form.minCartTotal) || 0,
        maxDiscountLimit: form.maxDiscountLimit !== "" ? Number(form.maxDiscountLimit) : null,
        usageLimitTotal: form.usageLimitTotal !== "" ? Number(form.usageLimitTotal) : null,
        endsAt: form.endsAt || null,
        badgeLabel: form.badgeLabel.trim(),
      };

      let res: Response;
      if (editTarget) {
        res = await fetch(`/api/admin/discounts?id=${editTarget.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/admin/discounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Save failed");
      }

      invalidatePromotionCache();
      toast(editTarget ? "Code updated successfully!" : "Code created successfully!");
      setShowModal(false);
      setEditTarget(null);
      fetchCodes();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Save failed.", false);
    } finally {
      setSaving(false);
    }
  }, [editTarget, fetchCodes, toast]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/admin/discounts?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      invalidatePromotionCache();
      toast("Code deleted.");
      setDeleteConfirm(null);
      fetchCodes();
    } catch {
      toast("Failed to delete code.", false);
    }
  }, [fetchCodes, toast]);

  const handleToggleActive = useCallback(async (code: DiscountCode) => {
    try {
      await fetch(`/api/admin/discounts?id=${code.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !code.isActive }),
      });
      invalidatePromotionCache();
      fetchCodes();
    } catch {
      toast("Failed to update status.", false);
    }
  }, [fetchCodes, toast]);

  const handleCopy = useCallback(async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
    } catch {}
  }, []);

  const openNew = () => {
    setEditTarget(null);
    setShowModal(true);
  };

  const openEdit = (dc: DiscountCode) => {
    setEditTarget(dc);
    setShowModal(true);
  };

  const formInitial: FormState = editTarget
    ? {
        code: editTarget.code,
        title: editTarget.title,
        type: editTarget.type,
        amount: editTarget.amount,
        minCartTotal: editTarget.minCartTotal,
        maxDiscountLimit: editTarget.maxDiscountLimit ?? "",
        usageLimitTotal: editTarget.usageLimitTotal ?? "",
        startsAt: editTarget.startsAt.slice(0, 10),
        endsAt: editTarget.endsAt ? editTarget.endsAt.slice(0, 10) : "",
        isActive: editTarget.isActive,
        showAnnouncementBanner: editTarget.showAnnouncementBanner,
        bannerText: editTarget.bannerText,
        bannerTheme: editTarget.bannerTheme,
        showProductBadge: editTarget.showProductBadge ?? true,
        badgeLabel: editTarget.badgeLabel ?? "",
        badgeType: editTarget.badgeType ?? "percentage",
      }
    : emptyForm;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <TicketPercent className="w-5 h-5 text-amber-500" />
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Discounts &amp; Offers</h1>
          </div>
          <p className="text-xs text-slate-500">Manage promo codes, discount rules, catalog badges, and site-wide announcement banners.</p>
        </div>
        <button
          id="btn-new-discount"
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Code
        </button>
      </div>

      {/* Stats row */}
      {!loading && codes.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              icon: <TicketPercent className="w-4 h-4 text-amber-500" />,
              label: "Total Codes",
              val: codes.length,
            },
            {
              icon: <Check className="w-4 h-4 text-emerald-500" />,
              label: "Active",
              val: codes.filter((c) => c.isActive && !isExpired(c) && !isScheduled(c)).length,
            },
            {
              icon: <Tag className="w-4 h-4 text-slate-900" />,
              label: "Catalog Badges",
              val: codes.filter((c) => (c.showProductBadge ?? true) && c.isActive).length,
            },
            {
              icon: <Megaphone className="w-4 h-4 text-violet-500" />,
              label: "Banners On",
              val: codes.filter((c) => c.showAnnouncementBanner && c.isActive).length,
            },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-4 border border-slate-200/70 shadow-xs">
              <div className="flex items-center gap-2 mb-1">
                {s.icon}
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{s.label}</span>
              </div>
              <p className="text-2xl font-extrabold text-slate-900">{s.val}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Code Table ──────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-sm text-red-600 py-8 justify-center">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      ) : codes.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <TicketPercent className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-600">No promo codes yet</p>
          <p className="text-xs text-slate-400">Click "New Code" to create your first discount.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {codes.map((dc) => {
            const expired = isExpired(dc);
            const scheduled = isScheduled(dc);
            const statusLabel = !dc.isActive ? "Inactive" : expired ? "Expired" : scheduled ? "Scheduled" : "Active";
            const statusCls = !dc.isActive
              ? "bg-slate-100 text-slate-500"
              : expired
              ? "bg-rose-50 text-rose-600"
              : scheduled
              ? "bg-sky-50 text-sky-600"
              : "bg-emerald-50 text-emerald-700";

            const badgeText = dc.badgeLabel?.trim()
              ? dc.badgeLabel.trim()
              : dc.type === "percentage"
              ? `${dc.amount}% OFF`
              : `Rs. ${dc.amount} OFF`;

            return (
              <div
                key={dc.id}
                className="bg-white rounded-xl border border-slate-200/70 shadow-xs overflow-hidden"
              >
                <div className="p-4 flex flex-wrap items-center gap-3">
                  {/* Code pill */}
                  <div className="flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1.5 rounded-lg font-mono text-sm font-bold cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => handleCopy(dc.code)}>
                    {copied === dc.code ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3 h-3 opacity-60" />}
                    {dc.code}
                  </div>

                  {/* Title & meta */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{dc.title}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        {dc.type === "percentage" ? <BadgePercent className="w-3 h-3" /> : <Coins className="w-3 h-3" />}
                        {dc.type === "percentage" ? `${dc.amount}% off` : `${formatPrice(dc.amount)} off`}
                      </span>
                      {dc.minCartTotal > 0 && (
                        <span>Min: {formatPrice(dc.minCartTotal)}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users2 className="w-3 h-3" />
                        {dc.timesUsed}{dc.usageLimitTotal ? `/${dc.usageLimitTotal}` : ""} uses
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(dc.startsAt)} → {dc.endsAt ? formatDate(dc.endsAt) : "No expiry"}
                      </span>
                    </div>
                  </div>

                  {/* Status badge */}
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${statusCls}`}>
                    {statusLabel}
                  </span>

                  {/* Catalog Badge indicator */}
                  {(dc.showProductBadge ?? true) && dc.isActive && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-neutral-900 text-white flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {badgeText}
                    </span>
                  )}

                  {/* Banner indicator */}
                  {dc.showAnnouncementBanner && dc.isActive && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-violet-50 text-violet-600 flex items-center gap-1">
                      <Megaphone className="w-3 h-3" />
                      Banner
                    </span>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">
                    {/* Toggle active */}
                    <button
                      onClick={() => handleToggleActive(dc)}
                      title={dc.isActive ? "Deactivate" : "Activate"}
                      className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      {dc.isActive
                        ? <ToggleRight className="w-5 h-5 text-emerald-500" />
                        : <ToggleLeft className="w-5 h-5 text-slate-300" />
                      }
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => openEdit(dc)}
                      className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    {deleteConfirm === dc.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(dc.id)}
                          className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(dc.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Banner preview strip */}
                {dc.showAnnouncementBanner && dc.bannerText && (
                  <div className={`px-4 py-1.5 text-[10px] font-semibold flex items-center gap-2 ${THEME_CLASSES[dc.bannerTheme]}`}>
                    <Megaphone className="w-3 h-3 opacity-70 flex-shrink-0" />
                    <span className="truncate">{dc.bannerText}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      {showModal && (
        <DiscountFormModal
          initial={formInitial}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
          saving={saving}
        />
      )}

      {/* Toast notification */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-[300] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-sm font-bold text-white transition-all animate-fade-in-up ${toastMsg.ok ? "bg-emerald-600" : "bg-red-600"}`}
        >
          {toastMsg.ok ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toastMsg.text}
        </div>
      )}
    </div>
  );
}
