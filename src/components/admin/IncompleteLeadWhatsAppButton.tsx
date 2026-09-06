"use client";

import React from "react";
import { MessageCircle } from "lucide-react";
import { formatWhatsAppNumber, buildIncompleteLeadMessage } from "@/lib/whatsapp";

export interface IncompleteLeadButtonProps {
  customerName: string;
  mobileNumber: string;
  frameName: string;
  resumeUrl?: string;
  className?: string;
}

export const IncompleteLeadWhatsAppButton: React.FC<IncompleteLeadButtonProps> = ({
  customerName,
  mobileNumber,
  frameName,
  resumeUrl,
  className = "",
}) => {
  const handleFollowUp = (e: React.MouseEvent) => {
    e.stopPropagation();

    const targetPhone = formatWhatsAppNumber(mobileNumber);
    const encodedPayload = buildIncompleteLeadMessage({
      customerName,
      mobileNumber,
      frameName,
      resumeUrl,
    });

    const waUrl = `https://wa.me/${targetPhone}?text=${encodedPayload}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      onClick={handleFollowUp}
      type="button"
      title="Send WhatsApp follow-up to lead"
      className={`inline-flex items-center gap-1.5 rounded-lg border border-emerald-500 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-50 active:scale-95 cursor-pointer ${className}`}
    >
      <MessageCircle className="h-3.5 w-3.5 fill-emerald-600/10 text-emerald-600" />
      <span>WhatsApp</span>
    </button>
  );
};

export default IncompleteLeadWhatsAppButton;
