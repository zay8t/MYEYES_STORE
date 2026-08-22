"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Trash2,
  X,
  Loader2,
  ShieldAlert,
  Info,
} from "lucide-react";

interface AdminDeleteUserDialogProps {
  isOpen: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    orderCount?: number;
    prescriptionCount?: number;
  } | null;
  currentAdminId?: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export default function AdminDeleteUserDialog({
  isOpen,
  user,
  currentAdminId,
  onClose,
  onSuccess,
  onError,
}: AdminDeleteUserDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !user) return null;

  const isSelf = currentAdminId === user.id;

  const handleDelete = async () => {
    if (isSelf) {
      onError("You cannot delete your own logged-in admin account.");
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete user account");
      }

      onSuccess(data.message || `Account for "${user.name}" has been deleted.`);
      onClose();
    } catch (err: any) {
      onError(err.message || "An error occurred while deleting the user.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center border border-rose-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Confirm Account Deletion
              </h2>
              <p className="text-xs text-slate-500">
                This action is permanent and cannot be undone.
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

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {isSelf ? (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-900">
                  Cannot delete your own account
                </p>
                <p className="text-[11px] text-amber-700 mt-1">
                  You are currently logged in as this administrator. To delete or modify this account, please sign in using another Super Admin account.
                </p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to permanently delete the account for{" "}
                <span className="font-bold text-slate-900">{user.name}</span> (
                <span className="font-mono text-slate-700">{user.email}</span>)?
              </p>

              {/* User Data Summary */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Assigned Role:</span>
                  <span className="font-bold text-slate-800">{user.role}</span>
                </div>
                {user.orderCount !== undefined && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Associated Orders:</span>
                    <span className="font-bold text-slate-800">{user.orderCount} order(s)</span>
                  </div>
                )}
                {user.prescriptionCount !== undefined && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Saved Prescriptions:</span>
                    <span className="font-bold text-slate-800">{user.prescriptionCount} Rx card(s)</span>
                  </div>
                )}
              </div>

              {/* Info about orders preservation */}
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-800 leading-relaxed font-medium">
                  Past store orders will remain intact for financial reporting and receipt auditing, but the customer profile, cart, and authentication credentials will be removed.
                </p>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            {!isSelf && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting Account...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete User Account</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
