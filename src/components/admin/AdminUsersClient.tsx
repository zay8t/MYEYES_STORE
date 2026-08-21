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
}

export default function AdminUsersClient() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchUsers = useCallback(async (q: string = "") => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setTotalCount(data.total || data.users?.length || 0);
      }
    } catch (err) {
      console.error("Failed to fetch user data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(search), 300);
    return () => clearTimeout(timer);
  }, [search, fetchUsers]);

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // fallback
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-PK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const formatWhatsAppLink = (phoneStr: string) => {
    const digits = phoneStr.replace(/\D/g, "");
    if (digits.startsWith("92")) return `https://wa.me/${digits}`;
    if (digits.startsWith("0")) return `https://wa.me/92${digits.slice(1)}`;
    return `https://wa.me/92${digits}`;
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          User Data
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Registered customer accounts, contact details, and authentication roles.
        </p>
      </div>

      {/* Top Summary Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#ff7a00]">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Registered Users
            </p>
            <p className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              {totalCount.toLocaleString()}
            </p>
          </div>
        </div>
        <span className="bg-orange-50 text-[#ff7a00] border border-orange-200 text-xs font-bold px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#ff7a00] animate-pulse" />
          Live Accounts
        </span>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            id="admin-users-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, phone number, or email address..."
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
      </div>

      {/* Clean User Data Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 space-y-2 flex-col">
            <Loader2 className="w-7 h-7 animate-spin text-[#ff7a00]" />
            <p className="text-xs text-slate-400 font-medium">Loading user data...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-300">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">
              {search ? "No users matching your search" : "No registered users yet"}
            </p>
            <p className="text-xs text-slate-400">
              {search ? "Try searching with a different name, phone, or email." : "Customer accounts will appear here upon registration."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3.5">Customer Name</th>
                  <th className="px-5 py-3.5">Phone Number</th>
                  <th className="px-5 py-3.5">Email Address</th>
                  <th className="px-5 py-3.5">Registered Date</th>
                  <th className="px-5 py-3.5">Role</th>
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

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Customer Name */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff7a00] to-[#ea6c00] flex items-center justify-center text-white text-[11px] font-extrabold shrink-0 shadow-2xs">
                            {initials}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900 leading-snug">
                              {user.name}
                            </p>
                            {user.isVerified && (
                              <span className="text-[10px] font-bold text-emerald-600">
                                Verified
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Phone Number */}
                      <td className="px-5 py-4">
                        {user.phone ? (
                          <div className="flex items-center gap-2">
                            <a
                              href={formatWhatsAppLink(user.phone)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1.5"
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
                          <span className="text-slate-300 font-normal">—</span>
                        )}
                      </td>

                      {/* Email Address */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-600 font-medium">
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
                      </td>

                      {/* Registered Date */}
                      <td className="px-5 py-4">
                        <span className="text-xs text-slate-400 font-medium">
                          {formatDate(user.createdAt)}
                        </span>
                      </td>

                      {/* Role */}
                      <td className="px-5 py-4">
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer info */}
        {!isLoading && users.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>
              Showing {users.length} of {totalCount} registered user{totalCount !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
