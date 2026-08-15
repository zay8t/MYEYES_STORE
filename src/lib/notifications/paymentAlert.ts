/**
 * Payment Alert Notification Utility
 * Sends WhatsApp / SMS notifications to customers on payment approval or rejection.
 * Falls back to console logging when WHATSAPP_API_TOKEN is not configured.
 */

export interface NotificationOrder {
  id: string;
  orderNumber?: string | null;
  customerName: string;
  customerPhone?: string | null;
  customerEmail: string;
  totalAmount: number;
  paymentMethod?: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
//  WhatsApp Business API sender
// ─────────────────────────────────────────────────────────────────────────────
async function sendWhatsAppMessage(phone: string, message: string): Promise<boolean> {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.log(
      `[WhatsApp Notification — Not Configured]\nTo: ${phone}\nMessage: ${message}`
    );
    return false;
  }

  // Normalize Pakistani phone number to E.164 format
  let normalized = phone.replace(/\D/g, "");
  if (normalized.startsWith("03")) normalized = "92" + normalized.slice(1);
  else if (normalized.startsWith("3")) normalized = "92" + normalized;

  try {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: normalized,
          type: "text",
          text: { body: message },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("WhatsApp API error:", err);
      return false;
    }
    return true;
  } catch (err) {
    console.error("WhatsApp send failed:", err);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Public notification functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Send approval notification when payment is verified & order enters production.
 */
export async function sendApprovalNotification(order: NotificationOrder): Promise<void> {
  const orderNum = order.orderNumber || order.id.slice(0, 8).toUpperCase();
  const amount = `PKR ${order.totalAmount.toLocaleString("en-PK")}`;

  const message = `✅ *My Eyes — Payment Verified!*\n\nDear ${order.customerName},\n\nYour payment of *${amount}* for Order *#${orderNum}* has been successfully verified! ✨\n\nYour custom eyewear is now in lab production. We'll notify you once it's dispatched.\n\nThank you for choosing My Eyes! 🕶️\n\nFor queries: wa.me/923006694928`;

  if (order.customerPhone) {
    await sendWhatsAppMessage(order.customerPhone, message);
  } else {
    console.log(`[Payment Approved — No phone on file]\nOrder: ${orderNum}\nEmail: ${order.customerEmail}`);
  }
}

/**
 * Send rejection notification with re-upload link when payment verification fails.
 */
export async function sendRejectionNotification(
  order: NotificationOrder,
  reason: string
): Promise<void> {
  const orderNum = order.orderNumber || order.id.slice(0, 8).toUpperCase();
  const reuploadLink = `${process.env.NEXT_PUBLIC_APP_URL || "https://myeyes.pk"}/orders/${orderNum}/verify`;

  const message = `⚠️ *My Eyes — Action Required*\n\nDear ${order.customerName},\n\nPayment verification for Order *#${orderNum}* could not be completed.\n\n*Reason:* ${reason}\n\nPlease re-upload your valid payment receipt here:\n${reuploadLink}\n\nNeed help? Contact us on WhatsApp: wa.me/923006694928`;

  if (order.customerPhone) {
    await sendWhatsAppMessage(order.customerPhone, message);
  } else {
    console.log(`[Payment Rejected — No phone on file]\nOrder: ${orderNum}\nReason: ${reason}`);
  }
}

/**
 * Send flagged notification to internal team (logs to console, no customer message).
 */
export async function sendFlaggedAlert(order: NotificationOrder, notes: string): Promise<void> {
  const orderNum = order.orderNumber || order.id.slice(0, 8).toUpperCase();
  console.warn(
    `[PAYMENT FLAGGED — MANAGER REVIEW REQUIRED]\nOrder: #${orderNum}\nCustomer: ${order.customerName} (${order.customerEmail})\nPhone: ${order.customerPhone || "N/A"}\nAmount: PKR ${order.totalAmount}\nNotes: ${notes}`
  );
}

