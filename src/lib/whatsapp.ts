import { OrderReceiptData, OrderItem } from "@/components/A4ReceiptModal";
import { formatOrderNumber } from "@/lib/order-number";

export interface OrderPrescriptionPayload {
  rightEye?: { sph?: string | null; cyl?: string | null; axis?: string | null };
  leftEye?: { sph?: string | null; cyl?: string | null; axis?: string | null };
  pd?: string | null;
  [key: string]: unknown;
}

export interface OrderItemPayload {
  frameName?: string | null;
  name?: string | null;
  color?: string | null;
  framePrice?: number | null;
  lensPackageName?: string | null;
  lensPrice?: number | null;
  prescription?: OrderPrescriptionPayload | Record<string, unknown> | null;
  [key: string]: unknown;
}

export interface FullOrderPayload {
  id: string;
  orderNumber?: string | null;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  city: string;
  paymentMethod: string;
  paymentStatus?: "PENDING_VERIFICATION" | "PAID" | "FAILED" | "REJECTED" | "UNPAID" | "REFUNDED" | string | null;
  status?: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | string | null;
  subtotal?: number | null;
  shippingFee?: number | null;
  totalAmount: number;
  items: OrderItemPayload[] | OrderItem[] | Array<Record<string, unknown>>;
  receiptUrl?: string | null;
  rejectionReason?: string;
  rejectionCustomReason?: string;
  advanceRequired?: number;
  [key: string]: unknown;
}

export interface WhatsAppOrderItem {
  id?: string;
  productId?: string;
  price?: number | string | null;
  quantity?: number;
  product?: { name?: string } | null;
  prescription?: {
    odSph?: number | null;
    odCyl?: number | null;
    odAxis?: number | null;
    osSph?: number | null;
    osCyl?: number | null;
    osAxis?: number | null;
    pd?: number | null;
    lensType?: string | null;
  } | null;
  frameName?: string | null;
  selectedLensName?: string | null;
  lensPackageName?: string | null;
  color?: string | null;
  selectedColor?: string | null;
  frameColor?: string | null;
}

/**
 * Sanitizes phone numbers by stripping non-numeric characters and converting
 * local Pakistani prefixes (e.g. "03...") to standard MSISDN format ("923...").
 */
export function formatWhatsAppNumber(phone: string): string {
  if (!phone) return "";
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0092")) {
    cleaned = "92" + cleaned.slice(4);
  } else if (cleaned.startsWith("0")) {
    cleaned = "92" + cleaned.slice(1);
  }
  if (!cleaned.startsWith("92") && cleaned.length === 10) {
    cleaned = "92" + cleaned;
  }
  return cleaned;
}

/**
 * Dedicated launcher for WhatsApp Business dispatches.
 * On mobile (Android/iOS), strictly targets WhatsApp Business via direct intents/schemes.
 * On desktop, triggers installed WhatsApp Desktop or maintains a single persistent session window.
 */
export function launchWhatsAppBusinessChat(phone: string, textPayload: string): void {
  if (typeof window === "undefined") return;

  const cleanedPhone = formatWhatsAppNumber(phone);
  const win = window as unknown as Record<string, unknown>;
  const userAgent = navigator.userAgent || navigator.vendor || (typeof win.opera === "string" ? win.opera : "") || "";
  const isAndroid = /android/i.test(userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !win.MSStream;

  // 1. Android: Force explicit WhatsApp Business package intent
  if (isAndroid) {
    const businessIntent = `intent://send?phone=${cleanedPhone}&text=${textPayload}#Intent;package=com.whatsapp.w4b;scheme=whatsapp;end`;
    window.location.href = businessIntent;

    // Fallback to standard app protocol if direct business intent is blocked
    setTimeout(() => {
      window.location.href = `whatsapp://send?phone=${cleanedPhone}&text=${textPayload}`;
    }, 500);
    return;
  }

  // 2. iOS: Delegate via app protocol (prioritizes installed WhatsApp Business)
  if (isIOS) {
    window.location.href = `whatsapp://send?phone=${cleanedPhone}&text=${textPayload}`;
    setTimeout(() => {
      window.location.href = `https://api.whatsapp.com/send?phone=${cleanedPhone}&text=${textPayload}`;
    }, 600);
    return;
  }

  // 3. Desktop: Trigger installed WhatsApp Desktop application or maintain single session window
  const desktopAppUri = `whatsapp://send?phone=${cleanedPhone}&text=${textPayload}`;
  try {
    window.location.assign(desktopAppUri);
  } catch {
    // Target named window to preserve active WhatsApp Web session across dispatches
    window.open(
      `https://web.whatsapp.com/send?phone=${cleanedPhone}&text=${textPayload}`,
      "myeyes_whatsapp_session"
    );
  }
}

/**
 * Normalizes an OrderReceiptData or partial order into FullOrderPayload.
 */
export function normalizeToFullOrderPayload(
  order: FullOrderPayload | OrderReceiptData | Record<string, unknown>
): FullOrderPayload {
  const displayId = formatOrderNumber(order);
  const raw = order as Record<string, unknown>;
  const shippingFee = raw.shippingFee !== undefined ? Number(raw.shippingFee) : 250;
  const rawItems = Array.isArray(raw.items) ? (raw.items as Array<Record<string, unknown>>) : [];
  const subtotal = raw.subtotal !== undefined
    ? Number(raw.subtotal)
    : (rawItems.length > 0
        ? rawItems.reduce((sum: number, item: Record<string, unknown>) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0)
        : Number(raw.totalAmount || 0) - shippingFee);
  const totalAmount = raw.totalAmount !== undefined ? Number(raw.totalAmount) : subtotal + shippingFee;

  const rawPhone = (raw.customerPhone as string) || (raw.phone as string) || "";

  const items: OrderItemPayload[] = rawItems.map((item: Record<string, unknown>) => {
    let prescription: OrderItemPayload["prescription"] = undefined;
    if (item.prescription) {
      const rx = item.prescription as Record<string, unknown>;
      if (rx.rightEye || rx.leftEye) {
        prescription = rx as OrderItemPayload["prescription"];
      } else {
        const odSph = rx.odSph as number | undefined;
        const odCyl = rx.odCyl as number | undefined;
        const osSph = rx.osSph as number | undefined;
        const osCyl = rx.osCyl as number | undefined;
        prescription = {
          rightEye: {
            sph: odSph != null ? (odSph > 0 ? `+${odSph.toFixed(2)}` : odSph.toFixed(2)) : "0.00",
            cyl: odCyl != null && odCyl !== 0 ? (odCyl > 0 ? `+${odCyl.toFixed(2)}` : odCyl.toFixed(2)) : "0.00",
            axis: rx.odAxis ? `${rx.odAxis}` : "0",
          },
          leftEye: {
            sph: osSph != null ? (osSph > 0 ? `+${osSph.toFixed(2)}` : osSph.toFixed(2)) : "0.00",
            cyl: osCyl != null && osCyl !== 0 ? (osCyl > 0 ? `+${osCyl.toFixed(2)}` : osCyl.toFixed(2)) : "0.00",
            axis: rx.osAxis ? `${rx.osAxis}` : "0",
          },
          pd: rx.pd ? (typeof rx.pd === "number" ? `${rx.pd}` : String(rx.pd).replace(" mm", "")) : undefined,
        };
      }
    }

    const prod = item.product as { name?: string } | undefined;
    const rxObj = item.prescription as { lensType?: string } | undefined;

    return {
      frameName: (item.frameName as string) || prod?.name || (item.name as string) || "Optical Frame",
      name: (item.name as string) || (item.frameName as string) || prod?.name,
      color: (item.color as string) || (item.selectedColor as string) || (item.frameColor as string),
      framePrice: item.framePrice !== undefined && item.framePrice !== null
        ? Number(item.framePrice)
        : (item.price ? Number(item.price) : undefined),
      lensPackageName: (item.lensPackageName as string) || (item.selectedLensName as string) || rxObj?.lensType,
      lensPrice: item.lensPrice !== undefined && item.lensPrice !== null
        ? Number(item.lensPrice)
        : (item.lensFinalPrice !== undefined && item.lensFinalPrice !== null ? Number(item.lensFinalPrice) : undefined),
      prescription,
    };
  });

  return {
    id: (raw.id as string) || "",
    orderNumber: displayId,
    customerName: (raw.customerName as string) || "Customer",
    customerPhone: rawPhone,
    shippingAddress: (raw.shippingAddress as string) || (raw.address as string) || "Standard Delivery Address",
    city: (raw.city as string) || (raw.shippingCity as string) || "Pakistan",
    paymentMethod: (raw.paymentMethod as string) || "COD",
    paymentStatus: (raw.paymentStatus as string) || "PENDING_VERIFICATION",
    status: (raw.status as string) || "PENDING",
    subtotal: subtotal > 0 ? subtotal : 0,
    shippingFee,
    totalAmount,
    items,
    receiptUrl: (raw.receiptUrl as string) || `https://myeyes.pk/receipts/${raw.id}`,
    rejectionReason: raw.rejectionReason as string | undefined,
    rejectionCustomReason: raw.rejectionCustomReason as string | undefined,
    advanceRequired: raw.advanceRequired !== undefined ? Number(raw.advanceRequired) : undefined,
  };
}

/**
 * Builds dynamic status-aware WhatsApp message payload based on paymentStatus and fulfillment status.
 */
export function buildDetailedOrderMessage(orderInput: FullOrderPayload | OrderReceiptData | Record<string, unknown>): string {
  const order = normalizeToFullOrderPayload(orderInput);
  const displayId = order.orderNumber || order.id;
  const paymentStatus = (order.paymentStatus || "").toUpperCase();
  const fulfillmentStatus = (order.status || "").toUpperCase();

  // 1. Payment-specific triggers (priority over fulfillment if flagged)
  if (paymentStatus === "REJECTED") {
    const selectedReason =
      order.rejectionCustomReason?.trim() ||
      order.rejectionReason ||
      "Payment proof could not be verified";
    const orderLink = order.receiptUrl || `https://myeyes.pk/orders/${displayId}`;

    const lines = [
      `*MY EYES OPTICAL - PAYMENT VERIFICATION ISSUE*`,
      `----------------------------------------`,
      `Dear ${order.customerName},`,
      ``,
      `Your deposit verification for Order #${displayId} could not be confirmed.`,
      ``,
      `*Reason:*`,
      selectedReason,
      ``,
      `*Action Required:*`,
      `Please resubmit clear proof of transfer or transaction ID (TID) using your order link:`,
      orderLink,
      ``,
      `Alternatively, you may reply directly to this message with a clear transfer receipt or screenshot.`,
      `----------------------------------------`,
      `MY EYES Optical Verification Team`,
    ];
    return encodeURIComponent(lines.join("\n"));
  }

  if (paymentStatus === "PAID" && fulfillmentStatus !== "DELIVERED") {
    const lines = [
      `*MY EYES OPTICAL - PAYMENT RECEIVED*`,
      `----------------------------------------`,
      `Dear ${order.customerName},`,
      `We have confirmed receipt of your payment of Rs. ${order.totalAmount.toLocaleString()} for Order #${displayId}.`,
      ``,
      `Your custom prescription order is being handled by our laboratory.`,
      ``,
      `*Order Receipt:*`,
      order.receiptUrl,
      ``,
      `----------------------------------------`,
      `Thank you for choosing MY EYES Optical.`,
    ];
    return encodeURIComponent(lines.join("\n"));
  }

  if (paymentStatus === "FAILED") {
    const lines = [
      `*MY EYES OPTICAL - PAYMENT FAILED*`,
      `----------------------------------------`,
      `Dear ${order.customerName},`,
      `We were unable to verify payment for your Order #${displayId} (Rs. ${order.totalAmount.toLocaleString()}).`,
      ``,
      `Please contact us here to retry your transaction or switch your payment method to Cash on Delivery (COD).`,
      ``,
      `*Order Receipt:*`,
      order.receiptUrl,
      ``,
      `----------------------------------------`,
      `Reply directly to this chat for assistance.`,
    ];
    return encodeURIComponent(lines.join("\n"));
  }

  if (paymentStatus === "REFUNDED") {
    const lines = [
      `*MY EYES OPTICAL - REFUND ISSUED*`,
      `----------------------------------------`,
      `Dear ${order.customerName},`,
      `A refund of Rs. ${order.totalAmount.toLocaleString()} has been processed for Order #${displayId}.`,
      ``,
      `Depending on your bank, funds should reflect in your account within 3 to 5 business days.`,
      ``,
      `*Order Receipt:*`,
      order.receiptUrl,
      ``,
      `----------------------------------------`,
      `Reply to this chat if you have any questions regarding your refund.`,
    ];
    return encodeURIComponent(lines.join("\n"));
  }

  // 2. Fulfillment-specific triggers
  if (fulfillmentStatus === "SHIPPED") {
    const lines = [
      `*MY EYES OPTICAL - DISPATCH NOTIFICATION*`,
      `----------------------------------------`,
      `Dear ${order.customerName},`,
      `Your Order #${displayId} has completed laboratory inspection and is now dispatched via courier.`,
      ``,
      `*Destination:* ${order.shippingAddress}, ${order.city}`,
      `*Total Payable:* Rs. ${order.totalAmount.toLocaleString()} (${order.paymentMethod.toUpperCase()})`,
      ...(order.paymentMethod.toUpperCase() === "COD"
        ? [`Please keep the exact amount ready for the delivery rider.`]
        : []),
      ``,
      `*Order Receipt:*`,
      order.receiptUrl,
      ``,
      `----------------------------------------`,
      `We will share your consignment tracking number once active.`,
    ];
    return encodeURIComponent(lines.join("\n"));
  }

  if (fulfillmentStatus === "DELIVERED") {
    const lines = [
      `*MY EYES OPTICAL - DELIVERY CONFIRMATION*`,
      `----------------------------------------`,
      `Dear ${order.customerName},`,
      `Your Order #${displayId} has been marked as delivered.`,
      ``,
      `Thank you for trusting MY EYES Optical with your vision. Please allow 2 to 3 days to fully adapt to your new prescription.`,
      ``,
      `*Order Receipt:*`,
      order.receiptUrl,
      ``,
      `----------------------------------------`,
      `If you experience any issues with lens fit or clarity, reply directly to this message.`,
    ];
    return encodeURIComponent(lines.join("\n"));
  }

  if (fulfillmentStatus === "PROCESSING" && paymentStatus !== "PENDING_VERIFICATION") {
    const lines = [
      `*MY EYES OPTICAL - ORDER UPDATE*`,
      `----------------------------------------`,
      `Dear ${order.customerName},`,
      `Your Order #${displayId} is verified and currently in laboratory production. Our optical lab is preparing and mounting your custom lenses.`,
      ``,
      `*Order Receipt:*`,
      order.receiptUrl,
      ``,
      `----------------------------------------`,
      `We will notify you once your glasses pass quality inspection and are dispatched.`,
    ];
    return encodeURIComponent(lines.join("\n"));
  }

  // 3. Initial Default State (PENDING / PENDING_VERIFICATION / Initial Confirmation)
  const itemsList = (order.items as OrderItemPayload[])
    .map((item, index) => {
      const frameTitle = item.frameName || item.name || "Optical Frame";
      const color = item.color ? ` (${item.color})` : "";
      const frameCost = item.framePrice ? `Rs. ${item.framePrice.toLocaleString()}` : "Included";
      const lensTitle = item.lensPackageName || "Standard Lenses";
      const lensCost = item.lensPrice ? `Rs. ${item.lensPrice.toLocaleString()}` : "Included";

      let block = `${index + 1}. ${frameTitle}${color} - ${frameCost}\n   - Lens: ${lensTitle} (${lensCost})`;

      if (item.prescription) {
        const rx = item.prescription as OrderPrescriptionPayload;
        const r = rx.rightEye;
        const l = rx.leftEye;
        const pd = rx.pd;

        block += `\n   - OD (Right Eye): SPH ${r?.sph || "0.00"}, CYL ${r?.cyl || "0.00"}, AXIS ${r?.axis || "0"}`;
        block += `\n   - OS (Left Eye): SPH ${l?.sph || "0.00"}, CYL ${l?.cyl || "0.00"}, AXIS ${l?.axis || "0"}`;
        if (pd) block += ` | PD: ${pd} mm`;
      }

      return block;
    })
    .join("\n\n");

  const lines = [
    `*MY EYES OPTICAL - ORDER CONFIRMATION*`,
    `----------------------------------------`,
    `Dear ${order.customerName},`,
    `Thank you for your order. Please review your details below:`,
    ``,
    `*Order Details:*`,
    `- Order ID: #${displayId}`,
    `- Payment Method: ${order.paymentMethod.toUpperCase()}`,
    `- Delivery Address: ${order.shippingAddress}, ${order.city}`,
    ``,
    `*Items & Prescription:*`,
    itemsList || "No items listed.",
    ``,
    `----------------------------------------`,
    `*Payment Summary:*`,
    `- Subtotal: Rs. ${(order.subtotal ?? order.totalAmount).toLocaleString()}`,
    `- Shipping: ${(order.shippingFee ?? 0) === 0 ? "Free" : `Rs. ${(order.shippingFee ?? 0).toLocaleString()}`}`,
    `- Total Amount: Rs. ${order.totalAmount.toLocaleString()}`,
    ``,
    `*Order Receipt:*`,
    order.receiptUrl,
    ``,
    `----------------------------------------`,
    `*Action Required:*`,
    `Please reply with *"CONFIRM"* to verify this order and your prescription details so we can begin processing your lenses.`,
  ];

  return encodeURIComponent(lines.join("\n"));
}

export interface IncompleteLeadPayload {
  customerName: string;
  mobileNumber: string;
  frameName: string;
  resumeUrl?: string; // Optional direct link back to configurator/cart
}

export function buildIncompleteLeadMessage(lead: IncompleteLeadPayload): string {
  const frame = lead.frameName || "your selected frame";
  const resumeLink = lead.resumeUrl || "https://myeyes.pk";

  const lines = [
    `*MY EYES OPTICAL - INCOMPLETE ORDER ASSISTANCE*`,
    `----------------------------------------`,
    `Dear ${lead.customerName},`,
    ``,
    `We noticed you were configuring your prescription lenses for the *${frame}* on our website but could not complete your order.`,
    ``,
    `If you experienced any difficulty entering your prescription (OD/OS/PD values) or choosing the right lens coating, we are here to assist you.`,
    ``,
    `You can simply reply here with a clear photo or copy of your prescription slip, and our optical team will configure your lenses for you.`,
    ``,
    `If you would like to complete your order online, visit:`,
    `${resumeLink}`,
    ``,
    `----------------------------------------`,
    `MY EYES Customer Care`,
  ];

  return encodeURIComponent(lines.join("\n"));
}
