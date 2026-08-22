"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface UserFormData {
  id?: string;
  name: string;
  email: string;
  phone: string;
  role: "CUSTOMER" | "OPTICIAN" | "ADMIN" | "SUPER_ADMIN";
  password?: string;
  isVerified?: boolean;
}

interface AdminUserModalProps {
  isOpen: boolean;
  user?: UserFormData | null;
  currentAdminRole?: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const ROLE_OPTIONS = [
  {
    value: "CUSTOMER",
    label: "Customer",
    description: "Regular customer with store shopping, prescriptions, and order history.",
    icon: User,
    color: "border-slate-200 hover:border-slate-300 text-slate-800",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
  },
  {
    value: "OPTICIAN",
    label: "Optician",
    description: "Lab & clinical staff: verify optical prescriptions and lab surfacing.",
    icon: ShieldCheck,
    color: "border-blue-200 hover:border-blue-300 text-blue-900",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    value: "ADMIN",
    label: "Store Admin",
    description: "Store manager: full access to products, orders, verification & user management.",
    icon: Shield,
    color: "border-orange-200 hover:border-orange-300 text-orange-950",
    badge: "bg-orange-50 text-[#ff7a00] border-orange-200",
  },
  {
    value: "SUPER_ADMIN",
    label: "Super Admin",
    description: "Complete unrestricted governance, security configuration, and team control.",
    icon: ShieldAlert,
    color: "border-purple-200 hover:border-purple-300 text-purple-950",
    badge: "bg-purple-50 text-purple-700 border-purple-200",
  },
];

export default function AdminUserModal({
  isOpen,
  user,
  currentAdminRole,
  onClose,
  onSuccess,
  onError,
}: AdminUserModalProps) {
  const isEditing = Boolean(user?.id);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"CUSTOMER" | "OPTICIAN" | "ADMIN" | "SUPER_ADMIN">("CUSTOMER");
  const [password, setPassword] = useState("");
  const [isVerified, setIsVerified] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setRole(user.role || "CUSTOMER");
      setIsVerified(user.isVerified ?? true);
      setPassword("");
    } else {
      setName("");
      setEmail("");
      setPhone("");
      setRole("CUSTOMER");
      setIsVerified(true);
      setPassword("");
    }
    setFormErrors({});
    setShowPassword(false);
  }, [user, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errors: Record<string, string> = {};

    if (!name.trim() || name.trim().length < 2) {
      errors.name = "Full name must be at least 2 characters.";
    }

    if (!email.trim()) {
      errors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Please enter a valid email address.";
    }

    if (!isEditing) {
      if (!password) {
        errors.password = "Password is required for new accounts.";
      } else if (password.length < 6) {
        errors.password = "Password must be at least 6 characters.";
      }
    } else if (password && password.length < 6) {
      errors.password = "New password must be at least 6 characters.";
    }

    if (phone.trim()) {
      const cleaned = phone.replace(/[\s-()]/g, "");
      if (cleaned.length < 7 || cleaned.length > 15) {
        errors.phone = "Please enter a valid phone number (7-15 digits).";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (isEditing && user?.id) {
        // PATCH existing user
        const payload: Record<string, any> = {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || null,
          role,
          isVerified,
        };
        if (password.trim()) {
          payload.password = password.trim();
        }

        const res = await fetch(`/api/admin/users/${user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to update user");
        }

        onSuccess(data.message || `User ${name} updated successfully`);
        onClose();
      } else {
        // POST create user
        const payload = {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || null,
          role,
          password: password.trim(),
          isVerified,
        };

        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to create user");
        }

        onSuccess(data.message || `User ${name} created successfully`);
        onClose();
      }
    } catch (err: any) {
      onError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#ff7a00] to-[#ea6c00] text-white flex items-center justify-center shadow-md shadow-orange-500/20">
              {isEditing ? <User className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                {isEditing ? "Edit User Account" : "Add New User / Admin"}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? `Update personal details, assign security roles, or set credentials.`
                  : `Create a new customer account or staff member with custom credentials.`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section: Basic Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Personal Information
            </h3>

            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Zaid Khan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={cn(
                    "w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all",
                    formErrors.name
                      ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20"
                      : "border-slate-200 focus:border-[#ff7a00] focus:ring-[#ff7a00]/20"
                  )}
                />
              </div>
              {formErrors.name && (
                <p className="text-[11px] text-rose-500 font-semibold mt-1">{formErrors.name}</p>
              )}
            </div>

            {/* Email & Phone Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="email"
                    required
                    placeholder="zaid@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={cn(
                      "w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all",
                      formErrors.email
                        ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20"
                        : "border-slate-200 focus:border-[#ff7a00] focus:ring-[#ff7a00]/20"
                    )}
                  />
                </div>
                {formErrors.email && (
                  <p className="text-[11px] text-rose-500 font-semibold mt-1">
                    {formErrors.email}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Phone Number (WhatsApp)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="tel"
                    placeholder="03001234567 or +92..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={cn(
                      "w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all",
                      formErrors.phone
                        ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20"
                        : "border-slate-200 focus:border-[#ff7a00] focus:ring-[#ff7a00]/20"
                    )}
                  />
                </div>
                {formErrors.phone && (
                  <p className="text-[11px] text-rose-500 font-semibold mt-1">
                    {formErrors.phone}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section: Role Selection */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Account Role & Permissions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ROLE_OPTIONS.map((item) => {
                const isSelected = role === item.value;
                const IconComponent = item.icon;
                const isSuperAdminOptionDisabled =
                  item.value === "SUPER_ADMIN" && currentAdminRole !== "SUPER_ADMIN";

                return (
                  <button
                    type="button"
                    key={item.value}
                    disabled={isSuperAdminOptionDisabled}
                    onClick={() => setRole(item.value as any)}
                    className={cn(
                      "p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer relative",
                      isSelected
                        ? "border-[#ff7a00] bg-orange-50/40 ring-2 ring-[#ff7a00]/20 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50",
                      isSuperAdminOptionDisabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center",
                            isSelected
                              ? "bg-[#ff7a00] text-white"
                              : "bg-slate-100 text-slate-600"
                          )}
                        >
                          <IconComponent className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-slate-900">{item.label}</span>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-[#ff7a00]" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
                      {item.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Security / Password */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Security & Authentication
              </h3>
              {isEditing && (
                <span className="text-[11px] text-slate-400 font-medium italic">
                  Leave blank to retain current password
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isEditing ? "Set New Password (Optional)" : "Account Password"}{" "}
                {!isEditing && <span className="text-rose-500">*</span>}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={
                    isEditing
                      ? "Enter new password if resetting..."
                      : "Minimum 6 characters password"
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(
                    "w-full pl-10 pr-11 py-2.5 rounded-xl bg-slate-50 border text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all",
                    formErrors.password
                      ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20"
                      : "border-slate-200 focus:border-[#ff7a00] focus:ring-[#ff7a00]/20"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {formErrors.password && (
                <p className="text-[11px] text-rose-500 font-semibold mt-1">
                  {formErrors.password}
                </p>
              )}
            </div>

            {/* Email Verified Checkbox */}
            <div className="pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isVerified}
                  onChange={(e) => setIsVerified(e.target.checked)}
                  className="w-4 h-4 rounded text-[#ff7a00] border-slate-300 focus:ring-[#ff7a00] cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-700">
                  Mark account as Verified
                </span>
              </label>
              <p className="text-[11px] text-slate-400 pl-6.5 font-medium mt-0.5">
                Enables immediate checkout without requiring email code verification.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#ff7a00] to-[#ea6c00] text-white text-xs font-bold shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/30 hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isEditing ? "Update Account" : "Create Account"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
