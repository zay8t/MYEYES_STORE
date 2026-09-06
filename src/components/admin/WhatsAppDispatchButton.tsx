"use client";

import React from "react";
import { MessageSquare } from "lucide-react";
import { OrderReceiptData } from "@/components/A4ReceiptModal";
import { formatWhatsAppNumber, buildDetailedOrderMessage } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

export interface WhatsAppDispatchButtonProps {
  order: OrderReceiptData;
  variant?: "icon" | "button" | "compact";
  className?: string;
}

export default function WhatsAppDispatchButton({
  order,
  variant = "button",
  className,
}: WhatsAppDispatchButtonProps) {
  const handleDispatch = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rawPhone = order.customerPhone || order.phone || "";
    const formattedPhone = formatWhatsAppNumber(rawPhone);

    if (!formattedPhone || formattedPhone.length < 10) {
      alert(
        `Customer phone number is missing or invalid (${rawPhone || "empty"}). Please verify customer contact information.`
      );
      return;
    }

    const payload = buildDetailedOrderMessage(order);
    const url = `https://wa.me/${formattedPhone}?text=${payload}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleDispatch}
        title="Dispatch WhatsApp Order Confirmation"
        className={cn(
          "p-1.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] active:scale-95 text-slate-950 transition-all duration-150 cursor-pointer shadow-2xs inline-flex items-center justify-center font-bold",
          className
        )}
      >
        <MessageSquare className="w-4 h-4" />
      </button>
    );
  }

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={handleDispatch}
        title="Dispatch WhatsApp Order Confirmation"
        className={cn(
          "px-2.5 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] active:scale-95 text-slate-950 text-xs font-bold transition-all duration-150 cursor-pointer shadow-2xs inline-flex items-center gap-1.5",
          className
        )}
      >
        <MessageSquare className="w-3.5 h-3.5" />
        <span>WhatsApp</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleDispatch}
      className={cn(
        "px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] active:scale-95 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 transition-all duration-150 cursor-pointer shadow-2xs",
        className
      )}
    >
      <MessageSquare className="w-4 h-4" />
      <span>WhatsApp</span>
    </button>
  );
}
