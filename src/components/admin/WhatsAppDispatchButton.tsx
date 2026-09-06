"use client";

import React from "react";
import { MessageSquare } from "lucide-react";
import {
  formatWhatsAppNumber,
  buildDetailedOrderMessage,
  FullOrderPayload,
} from "@/lib/whatsapp";
import { OrderReceiptData } from "@/components/A4ReceiptModal";
import { cn } from "@/lib/utils";

export interface WhatsAppDispatchButtonProps {
  order: FullOrderPayload | OrderReceiptData;
  variant?: "icon" | "button" | "compact";
  className?: string;
}

export const WhatsAppDispatchButton: React.FC<WhatsAppDispatchButtonProps> = ({
  order,
  variant = "button",
  className = "",
}) => {
  const handleDispatch = (e: React.MouseEvent) => {
    e.stopPropagation();

    const rawPhone =
      ("customerPhone" in order ? order.customerPhone : (order as OrderReceiptData).phone) ||
      (order as any).phone ||
      "";
    const targetPhone = formatWhatsAppNumber(rawPhone);

    if (!targetPhone || targetPhone.length < 10) {
      alert(
        `Customer phone number is missing or invalid (${rawPhone || "empty"}). Please verify customer contact information.`
      );
      return;
    }

    const encodedPayload = buildDetailedOrderMessage(order);
    const waUrl = `https://wa.me/${targetPhone}?text=${encodedPayload}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleDispatch}
        title="Send WhatsApp update to customer"
        className={cn(
          "inline-flex items-center justify-center rounded-lg bg-[#25D366] p-2 text-white shadow-xs transition hover:bg-[#20bd5a] active:scale-95 cursor-pointer",
          className
        )}
      >
        <MessageSquare className="h-4 w-4 fill-current" />
      </button>
    );
  }

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={handleDispatch}
        title="Send WhatsApp update to customer"
        className={cn(
          "px-2.5 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] active:scale-95 text-slate-950 text-xs font-bold transition-all duration-150 cursor-pointer shadow-2xs inline-flex items-center gap-1.5",
          className
        )}
      >
        <MessageSquare className="w-3.5 h-3.5 fill-current" />
        <span>WhatsApp</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleDispatch}
      title="Send WhatsApp update to customer"
      className={cn(
        "px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] active:scale-95 text-slate-950 text-xs font-extrabold inline-flex items-center gap-1.5 transition-all duration-150 cursor-pointer shadow-2xs",
        className
      )}
    >
      <MessageSquare className="w-4 h-4 fill-current" />
      <span>WhatsApp</span>
    </button>
  );
};

export default WhatsAppDispatchButton;
