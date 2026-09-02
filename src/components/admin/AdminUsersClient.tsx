"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  X,
  Copy,
  Check,
  Phone,
  Mail,
  Loader2,
  ExternalLink,
  Plus,
  Edit,
  KeyRound,
  Trash2,
  RefreshCw,
  Shield,
  ShieldCheck,
  ShieldAlert,
  User,
  ShoppingBag,
  FileText,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";
import AdminUserModal, { UserFormData } from "./AdminUserModal";
import AdminResetPasswordModal from "./AdminResetPasswordModal";
import AdminDeleteUserDialog from "./AdminDeleteUserDialog";
import Toast, { ToastProps } from "./Toast";

// ─── Types ───────────────────────────────────────────────────────────────────

interface UserRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "CUSTOMER" | "OPTICIAN" | "ADMIN" | "SUPER_ADMIN";
  avatarUrl: string | null;
  isVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  totalSpent: number;
  orderCount: number;
  prescriptionCount: number;
  addressCount: number;
  wishlistCount: number;
}

interface Metrics {
  totalUsers: number;
  totalCustomers: number;
  totalAdmins: number;
  totalOpticians: number;
  activePrescriptions: number;
  newThisMonth: number;
  avgCLV: number;
}

type RoleFilterType = "ALL" | "CUSTOMER" | "ADMINS" | "OPTICIAN";

export default function AdminUsersClient() {
  const { user: currentAdmin } = useAuth();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [limit] = useState<number>(20);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilterType>("ALL");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [metrics, setMetrics] = useState<Metrics>({
    totalUsers: 0,
    totalCustomers: 0,
    totalAdmins: 0,
    totalOpticians: 0,
    activePrescriptions: 0,
    newThisMonth: 0,
    avgCLV: 0,
  });

  // Modal States
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserFormData | null>(null);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
  } | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
    orderCount?: number;
    prescriptionCount?: number;
  } | null>(null);

  // Toast Notification State
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
  };

  const fetchUsers = useCallback(
    async (q: string = "", role: RoleFilterType = "ALL", targetPage: number = 1) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (q.trim()) params.set("search", q.trim());
        if (role && role !== "ALL") params.set("role", role);
        params.set("page", targetPage.toString());
        params.set("limit", limit.toString());

        const res = await fetch(`/api/admin/users?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setUsers(data.users || []);
          setTotalCount(data.total || 0);
          setTotalPages(data.totalPages || 1);
          setPage(data.page || 1);
          if (data.metrics) {
            setMetrics(data.metrics);
          }
        } else {
          showToast("Failed to fetch user list", "error");
        }
      } catch (err) {
        console.error("Failed to fetch user data:", err);
        showToast("Error connecting to server", "error");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [limit]
  );

  useEffect(() => {
    fetchUsers(search, roleFilter, page);
  }, [fetchUsers, roleFilter, page]);

  // Debounced search reset to page 1
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchUsers(search, roleFilter, 1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchUsers(search, roleFilter, page);
  };

  const handleRoleFilterChange = (newRole: RoleFilterType) => {
    setRoleFilter(newRole);
    setPage(1);
  };

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // fallback
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return "Never";
    return new Date(d).toLocaleDateString("en-PK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatWhatsAppLink = (phoneStr: string) => {
    const digits = phoneStr.replace(/\D/g, "");
    if (digits.startsWith("92")) return `https://wa.me/${digits}`;
    if (digits.startsWith("0")) return `https://wa.me/92${digits.slice(1)}`;
    return `https://wa.me/92${digits}`;
  };

  // Open Edit User Modal
  const openEditModal = (user: UserRow) => {
    setSelectedUserForEdit({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      role: user.role,
      isVerified: user.isVerified,
    });
    setIsUserModalOpen(true);
  };

  // Open Create User Modal
  const openCreateModal = () => {
    setSelectedUserForEdit(null);
    setIsUserModalOpen(true);
  };

  // Open Reset Password Modal
  const openResetPasswordModal = (user: UserRow) => {
    setSelectedUserForPassword({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
    setIsPasswordModalOpen(true);
  };

  // Open Delete Confirmation Dialog
  const openDeleteDialog = (user: UserRow) => {
    setSelectedUserForDelete({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      orderCount: user.orderCount,
      prescriptionCount: user.prescriptionCount,
    });
    setIsDeleteDialogOpen(true);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full border bg-purple-50 text-purple-700 border-purple-200">
            <ShieldAlert className="w-3 h-3" />
            SUPER ADMIN
          </span>
        );
      case "ADMIN":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full border bg-orange-50 text-[#ff7a00] border-orange-200">
            <Shield className="w-3 h-3" />
            ADMIN
          </span>
        );
      case "OPTICIAN":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full border bg-blue-50 text-blue-700 border-blue-200">
            <ShieldCheck className="w-3 h-3" />
            OPTICIAN
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full border bg-slate-50 text-slate-700 border-slate-200">
            <User className="w-3 h-3 text-slate-400" />
            CUSTOMER
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Toast Alert */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Customer Directory</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              Accounts &amp; Orders
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage customer accounts, contact details, order history, role assignments, and authentication.
          </p>
        </div>

        {/* Action Button: Add User */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
            title="Refresh list"
          >
            <RefreshCw
              className={cn("w-4 h-4", isRefreshing && "animate-spin text-[#ff7a00]")}
            />
          </button>

          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#ff7a00] to-[#ea6c00] hover:from-[#ea6c00] hover:to-[#d56100] text-white text-xs font-bold shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/30 transition-all flex items-center gap-2 cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New User</span>
          </button>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1: Total Users */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#ff7a00] shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
              Total Accounts
            </p>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">
              {metrics.totalUsers.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Metric 2: Customers */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
              Customers
            </p>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">
              {metrics.totalCustomers.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Metric 3: Staff & Admins */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
              Admins & Staff
            </p>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">
              {(metrics.totalAdmins + metrics.totalOpticians).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Metric 4: Active Rx Vault */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
              Active Prescriptions
            </p>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">
              {metrics.activePrescriptions.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            id="admin-users-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone, or account ID..."
            className="w-full pl-10 pr-10 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/20 focus:border-[#ff7a00] transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Role Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden lg:inline mr-1">
            <Filter className="w-3 h-3 inline mr-1" />
            Role:
          </span>

          <button
            onClick={() => handleRoleFilterChange("ALL")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer",
              roleFilter === "ALL"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60"
            )}
          >
            All Accounts ({totalCount})
          </button>

          <button
            onClick={() => handleRoleFilterChange("CUSTOMER")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer",
              roleFilter === "CUSTOMER"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60"
            )}
          >
            Customers
          </button>

          <button
            onClick={() => handleRoleFilterChange("ADMINS")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer",
              roleFilter === "ADMINS"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60"
            )}
          >
            Admins
          </button>

          <button
            onClick={() => handleRoleFilterChange("OPTICIAN")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer",
              roleFilter === "OPTICIAN"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60"
            )}
          >
            Opticians
          </button>
        </div>
      </div>

      {/* User Data Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-24 space-y-2 flex-col">
            <Loader2 className="w-8 h-8 animate-spin text-[#ff7a00]" />
            <p className="text-xs text-slate-400 font-semibold tracking-wide">
              Loading users directory...
            </p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-300">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">
              {search ? "No accounts found matching your query" : "No users in this category yet"}
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {search
                ? "Try searching for a different keyword or reset filters."
                : "Create a new user or wait for customers to register."}
            </p>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
              >
                Clear Search Filter
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3.5">User Account</th>
                  <th className="px-5 py-3.5">Contact Details</th>
                  <th className="px-5 py-3.5">Security Role</th>
                  <th className="px-5 py-3.5">Orders & Activity</th>
                  <th className="px-5 py-3.5">Joined Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {users.map((user) => {
                  const initials = user.name
                    ? user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    : "U";

                  const phoneKey = `phone-${user.id}`;
                  const emailKey = `email-${user.id}`;
                  const isCurrentAdmin = currentAdmin?.id === user.id;

                  return (
                    <tr
                      key={user.id}
                      className={cn(
                        "hover:bg-slate-50/80 transition-colors group",
                        isCurrentAdmin && "bg-amber-50/20"
                      )}
                    >
                      {/* User Account / Name */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ff7a00] to-[#ea6c00] flex items-center justify-center text-white text-xs font-extrabold shrink-0 shadow-2xs">
                            {initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-sm font-bold text-slate-900 leading-snug">
                                {user.name}
                              </p>
                              {isCurrentAdmin && (
                                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300">
                                  YOU
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {user.isVerified ? (
                                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Verified
                                </span>
                              ) : (
                                <span className="text-[10px] font-medium text-slate-400">
                                  Unverified
                                </span>
                              )}
                              <span className="text-slate-300">•</span>
                              <span className="text-[10px] font-mono text-slate-400">
                                {user.id.slice(-6)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Details */}
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          {/* Email */}
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="text-xs text-slate-700 font-medium truncate max-w-[180px]">
                              {user.email}
                            </span>
                            <button
                              onClick={() => handleCopy(user.email, emailKey)}
                              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Copy Email"
                            >
                              {copiedKey === emailKey ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>

                          {/* Phone */}
                          {user.phone ? (
                            <div className="flex items-center gap-1.5">
                              <a
                                href={formatWhatsAppLink(user.phone)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1"
                                title="Chat on WhatsApp"
                              >
                                <Phone className="w-3.5 h-3.5 text-emerald-500" />
                                <span>{user.phone}</span>
                                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                              </a>
                              <button
                                onClick={() => handleCopy(user.phone || "", phoneKey)}
                                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Copy Phone"
                              >
                                {copiedKey === phoneKey ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">No phone attached</span>
                          )}
                        </div>
                      </td>

                      {/* Security Role */}
                      <td className="px-5 py-4">{getRoleBadge(user.role)}</td>

                      {/* Orders & Activity */}
                      <td className="px-5 py-4">
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                            <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                            <span>{user.orderCount || 0} order(s)</span>
                            {user.totalSpent > 0 && (
                              <span className="text-[11px] font-bold text-emerald-600">
                                (PKR {user.totalSpent.toLocaleString()})
                              </span>
                            )}
                          </div>
                          {user.prescriptionCount > 0 && (
                            <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                              <FileText className="w-3 h-3 text-blue-500" />
                              <span>{user.prescriptionCount} Rx card(s)</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Joined Date */}
                      <td className="px-5 py-4">
                        <p className="text-xs text-slate-600 font-medium">
                          {formatDate(user.createdAt)}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Active: {formatDate(user.lastLoginAt)}
                        </p>
                      </td>

                      {/* Actions Column */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit Button */}
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                            title="Edit User"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Reset Password Button */}
                          <button
                            onClick={() => openResetPasswordModal(user)}
                            className="p-2 rounded-xl text-amber-600 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer border border-transparent hover:border-amber-200"
                            title="Reset Password"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => openDeleteDialog(user)}
                            disabled={isCurrentAdmin}
                            className={cn(
                              "p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer border border-transparent hover:border-rose-200",
                              isCurrentAdmin && "opacity-30 cursor-not-allowed"
                            )}
                            title={
                              isCurrentAdmin
                                ? "Cannot delete own account"
                                : "Delete User"
                            }
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Footer with Pagination */}
        {!isLoading && users.length > 0 && (
          <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
            <div>
              Showing <span className="font-bold text-slate-800">{users.length}</span> of{" "}
              <span className="font-bold text-slate-800">{totalCount}</span> registered account{totalCount !== 1 ? "s" : ""}
            </div>

            {/* Page navigation */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="text-xs font-bold text-slate-700">
                  Page {page} of {totalPages}
                </span>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals & Dialogs */}
      {isUserModalOpen && (
        <AdminUserModal
          isOpen={isUserModalOpen}
          user={selectedUserForEdit}
          currentAdminRole={currentAdmin?.role}
          onClose={() => {
            setIsUserModalOpen(false);
            setSelectedUserForEdit(null);
          }}
          onSuccess={(msg) => {
            showToast(msg, "success");
            fetchUsers(search, roleFilter, page);
          }}
          onError={(msg) => {
            showToast(msg, "error");
          }}
        />
      )}

      {isPasswordModalOpen && selectedUserForPassword && (
        <AdminResetPasswordModal
          isOpen={isPasswordModalOpen}
          user={selectedUserForPassword}
          onClose={() => {
            setIsPasswordModalOpen(false);
            setSelectedUserForPassword(null);
          }}
          onSuccess={(msg) => {
            showToast(msg, "success");
            fetchUsers(search, roleFilter, page);
          }}
          onError={(msg) => {
            showToast(msg, "error");
          }}
        />
      )}

      {isDeleteDialogOpen && selectedUserForDelete && (
        <AdminDeleteUserDialog
          isOpen={isDeleteDialogOpen}
          user={selectedUserForDelete}
          currentAdminId={currentAdmin?.id}
          onClose={() => {
            setIsDeleteDialogOpen(false);
            setSelectedUserForDelete(null);
          }}
          onSuccess={(msg) => {
            showToast(msg, "success");
            fetchUsers(search, roleFilter, page);
          }}
          onError={(msg) => {
            showToast(msg, "error");
          }}
        />
      )}
    </div>
  );
}
