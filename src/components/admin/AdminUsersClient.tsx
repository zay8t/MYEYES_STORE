"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  X,
  ChevronRight,
  Copy,
  CheckCheck,
  Eye,
  Shield,
  ShieldOff,
  Loader2,
  Glasses,
  ClipboardList,
  Heart,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  UserPlus,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface UserRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  avatarUrl: string | null;
  isVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  totalSpent: number;
  orderCount: number;
  prescriptionCount: number;
}

interface Metrics {
  totalCustomers: number;
  activePrescriptions: number;
  newThisMonth: number;
  avgCLV: number;
}

interface UserDetail {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  totalSpent: number;
  orderCount: number;
  prescriptionCount: number;
  wishlistCount: number;
  prescriptions: Array<{
    id: string;
    title: string;
    isDefault: boolean;
    odSph: string | null;
    odCyl: string | null;
    odAxis: number | null;
    osSph: string | null;
    osCyl: string | null;
    osAxis: number | null;
    pd: string | null;
    addPower: string | null;
    prescriptionType: string;
    slipImageUrl: string | null;
    createdAt: string;
  }>;
  orders: Array<{
    id: string;
    orderNumber: string | null;
    totalAmount: number;
    status: string;
    paymentStatus: string;
    createdAt: string;
  }>;
}

// ─── Metric Card ──────────────────────────────────────────────────────────────

function MetricCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.FC<{ className?: string }>;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center", color)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      <p className="text-xs font-semibold text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}

// ─── User Inspection Drawer ───────────────────────────────────────────────────

function InspectionDrawer({
  userId,
  onClose,
  onRoleChange,
}: {
  userId: string;
  onClose: () => void;
  onRoleChange: (userId: string, newRole: string) => void;
}) {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/users/${userId}`)
      .then((r) => r.json())
      .then((d) => setUser(d.user || null))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [userId]);

  const toggleRole = async () => {
    if (!user) return;
    setIsUpdatingRole(true);
    const newRole = user.role === "CUSTOMER" ? "ADMIN" : "CUSTOMER";
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, role: newRole }),
      });
      if (res.ok) {
        setUser((u) => u ? { ...u, role: newRole } : u);
        onRoleChange(user.id, newRole);
      }
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-PK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const rxVal = (v: string | null) =>
    v !== null ? `${parseFloat(v) > 0 ? "+" : ""}${parseFloat(v).toFixed(2)}` : "—";

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="flex-1 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl border-l border-slate-200 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between z-10">
          <h2 className="text-sm font-extrabold text-slate-900">Customer Inspection</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[#ff7a00]" />
          </div>
        ) : !user ? (
          <div className="p-6 text-center text-sm text-slate-400">User not found</div>
        ) : (
          <div className="p-5 space-y-5">
            {/* Identity */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ff7a00] to-[#ea6c00] flex items-center justify-center text-white font-extrabold text-sm shrink-0">
                  {user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <p className="font-extrabold text-slate-900">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
                <div className="ml-auto">
                  <span
                    className={cn(
                      "text-[10px] font-bold px-2.5 py-1 rounded-full border",
                      user.role === "ADMIN" || user.role === "SUPER_ADMIN"
                        ? "bg-orange-50 text-[#ff7a00] border-orange-200"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    )}
                  >
                    {user.role}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                {user.phone && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <a
                      href={`https://wa.me/92${user.phone.replace(/^0|\+92/, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-green-600 font-semibold hover:underline"
                    >
                      {user.phone}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Joined {formatDate(user.createdAt)}
                </div>
                {user.lastLoginAt && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    Last login {formatDate(user.lastLoginAt)}
                  </div>
                )}
              </div>
            </div>

            {/* Lifetime Value */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Total Spent", value: `PKR ${user.totalSpent.toLocaleString()}`, color: "text-[#ff7a00]" },
                { label: "Orders", value: user.orderCount, color: "text-blue-600" },
                { label: "Prescriptions", value: user.prescriptionCount, color: "text-emerald-600" },
              ].map((s) => (
                <div key={s.label} className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className={cn("text-sm font-extrabold", s.color)}>{s.value}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Prescriptions */}
            {user.prescriptions.length > 0 && (
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">
                  Optical Prescriptions
                </p>
                <div className="space-y-3">
                  {user.prescriptions.map((rx) => (
                    <div
                      key={rx.id}
                      className="bg-white border border-slate-200 rounded-2xl p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-extrabold text-slate-800">{rx.title}</p>
                        {rx.isDefault && (
                          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {[
                          { eye: "OD", sph: rx.odSph, cyl: rx.odCyl, axis: rx.odAxis },
                          { eye: "OS", sph: rx.osSph, cyl: rx.osCyl, axis: rx.osAxis },
                        ].map((e) => (
                          <div key={e.eye} className="bg-slate-50 rounded-xl p-2.5">
                            <p className="font-extrabold text-slate-500 mb-1.5">{e.eye}</p>
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-slate-400">SPH</span>
                                <span className="font-extrabold font-mono text-slate-900">{rxVal(e.sph)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">CYL</span>
                                <span className="font-extrabold font-mono text-slate-900">{rxVal(e.cyl)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Axis</span>
                                <span className="font-extrabold font-mono text-slate-900">
                                  {e.axis !== null ? `${e.axis}°` : "—"}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <div className="flex-1 flex justify-between bg-orange-50 border border-orange-100 rounded-xl px-3 py-1.5 text-xs">
                          <span className="font-bold text-slate-400">PD</span>
                          <span className="font-extrabold text-[#ff7a00]">
                            {rx.pd !== null ? `${parseFloat(rx.pd)}mm` : "—"}
                          </span>
                        </div>
                        {rx.slipImageUrl && (
                          <a
                            href={rx.slipImageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100 transition-colors"
                          >
                            <FileText className="w-3 h-3" />
                            Slip
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Orders */}
            {user.orders.length > 0 && (
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">
                  Order History
                </p>
                <div className="space-y-2">
                  {user.orders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900">
                          #{order.orderNumber || order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-slate-400">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-extrabold text-slate-900">
                          PKR {order.totalAmount.toLocaleString()}
                        </p>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Role Management */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <p className="text-xs font-extrabold text-slate-700 mb-3">Role Management</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-600">
                    Current role:{" "}
                    <span className="font-extrabold text-slate-900">{user.role}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {user.role === "CUSTOMER"
                      ? "Elevate to admin to grant dashboard access"
                      : "Demote to remove admin access"}
                  </p>
                </div>
                <button
                  onClick={toggleRole}
                  disabled={isUpdatingRole || user.role === "SUPER_ADMIN"}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-40",
                    user.role === "CUSTOMER"
                      ? "bg-orange-50 text-[#ff7a00] border border-orange-200 hover:bg-orange-100"
                      : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                  )}
                >
                  {isUpdatingRole ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : user.role === "CUSTOMER" ? (
                    <Shield className="w-3.5 h-3.5" />
                  ) : (
                    <ShieldOff className="w-3.5 h-3.5" />
                  )}
                  {user.role === "CUSTOMER" ? "Make Admin" : "Remove Admin"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────

export default function AdminUsersClient() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const fetchUsers = useCallback(async (q: string = "") => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setMetrics(data.metrics || null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(search), 350);
    return () => clearTimeout(timer);
  }, [search, fetchUsers]);

  const handleCopyEmail = async (email: string) => {
    await navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-PK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <>
      {/* Inspection Drawer */}
      {selectedUserId && (
        <InspectionDrawer
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onRoleChange={handleRoleChange}
        />
      )}

      {/* Page Content */}
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Users & Customers
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage registered accounts, inspect prescriptions, and control roles.
          </p>
        </div>

        {/* Metrics Grid */}
        {metrics && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              icon={Users}
              label="Total Registered Accounts"
              value={metrics.totalCustomers}
              color="bg-blue-50 text-blue-600"
            />
            <MetricCard
              icon={Glasses}
              label="Active Prescription Profiles"
              value={metrics.activePrescriptions}
              color="bg-orange-50 text-[#ff7a00]"
            />
            <MetricCard
              icon={TrendingUp}
              label="Avg Customer Lifetime Value"
              value={`PKR ${metrics.avgCLV.toLocaleString()}`}
              color="bg-emerald-50 text-emerald-600"
            />
            <MetricCard
              icon={UserPlus}
              label="New Signups This Month"
              value={metrics.newThisMonth}
              color="bg-purple-50 text-purple-600"
            />
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.04)]">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              id="admin-users-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, phone, or customer ID..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/20 focus:border-[#ff7a00] transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200/90 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-[#ff7a00]" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-400">
                {search ? "No customers match your search" : "No registered customers yet"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    {["Customer", "Email", "Phone / WhatsApp", "Joined", "Orders", "Role", ""].map(
                      (col) => (
                        <th
                          key={col}
                          className="text-left px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400"
                        >
                          {col}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/60 transition-colors group"
                    >
                      {/* Customer Details */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#ff7a00] to-[#ea6c00] flex items-center justify-center text-white text-[10px] font-extrabold shrink-0">
                            {user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-xs font-extrabold text-slate-900">{user.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{user.id.slice(0, 12)}...</p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-slate-600 font-medium">{user.email}</span>
                          <button
                            onClick={() => handleCopyEmail(user.email)}
                            className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                          >
                            {copiedEmail === user.email ? (
                              <CheckCheck className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3">
                        {user.phone ? (
                          <a
                            href={`https://wa.me/92${user.phone.replace(/^0|\+92/, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-semibold text-green-600 hover:underline flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            {user.phone}
                          </a>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>

                      {/* Joined */}
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-500">{formatDate(user.createdAt)}</span>
                      </td>

                      {/* Orders */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-extrabold border border-blue-100">
                          {user.orderCount}
                        </span>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "text-[10px] font-extrabold px-2.5 py-1 rounded-full border",
                            user.role === "ADMIN" || user.role === "SUPER_ADMIN"
                              ? "bg-orange-50 text-[#ff7a00] border-orange-200"
                              : "bg-slate-50 text-slate-600 border-slate-200"
                          )}
                        >
                          {user.role}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <button
                          id={`inspect-user-${user.id}`}
                          onClick={() => setSelectedUserId(user.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-600 hover:bg-orange-50 hover:text-[#ff7a00] hover:border-orange-200 transition-all cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          Inspect
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          {!isLoading && users.length > 0 && (
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/40">
              <p className="text-[11px] text-slate-400 font-semibold">
                Showing {users.length} customer{users.length !== 1 ? "s" : ""}
                {search && ` matching "${search}"`}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
