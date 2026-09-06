import { OrderReceiptData } from "@/components/A4ReceiptModal";
import { formatOrderNumber } from "@/lib/order-number";

export interface OrderItemPayload {
  frameName?: string | null;
  name?: string | null;
  color?: string | null;
  framePrice?: number | null;
  lensPackageName?: string | null;
  lensPrice?: number | null;
  prescription?: {
    rightEye?: { sph?: string | null; cyl?: string | null; axis?: string | null };
    leftEye?: { sph?: string | null; cyl?: string | null; axis?: string | null };
    pd?: string | null;
  } | any;
  [key: string]: any;
}

export interface FullOrderPayload {
  id: string;
  orderNumber?: string | null;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  city: string;
  paymentMethod: string;
  paymentStatus?: "PENDING_VERIFICATION" | "PAID" | "FAILED" | "UNPAID" | "REFUNDED" | string | null;
  status?: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | string | null;
  subtotal?: number | null;
  shippingFee?: number | null;
  totalAmount: number;
  items: OrderItemPayload[] | any[];
  receiptUrl?: string | null;
  [key: string]: any;
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
 * Normalizes an OrderReceiptData or partial order into FullOrderPayload.
 */
export function normalizeToFullOrderPayload(
  order: FullOrderPayload | OrderReceiptData | any
): FullOrderPayload {
  const displayId = formatOrderNumber(order);
  const shippingFee = order.shippingFee !== undefined ? Number(order.shippingFee) : 250;
  const subtotal = order.subtotal !== undefined
    ? Number(order.subtotal)
    : (order.items && order.items.length > 0
        ? order.items.reduce((sum: number, item: any) => sum + (Number(item.price) || 0) * (item.quantity || 1), 0)
        : Number(order.totalAmount || 0) - shippingFee);
  const totalAmount = order.totalAmount !== undefined ? Number(order.totalAmount) : subtotal + shippingFee;

  const rawPhone = order.customerPhone || order.phone || "";

  const items: OrderItemPayload[] = (order.items || []).map((item: any) => {
    let prescription: OrderItemPayload["prescription"] = undefined;
    if (item.prescription) {
      const rx = item.prescription;
      if (rx.rightEye || rx.leftEye) {
        prescription = rx;
      } else {
        prescription = {
          rightEye: {
            sph: rx.odSph != null ? (rx.odSph > 0 ? `+${rx.odSph.toFixed(2)}` : rx.odSph.toFixed(2)) : "0.00",
            cyl: rx.odCyl != null && rx.odCyl !== 0 ? (rx.odCyl > 0 ? `+${rx.odCyl.toFixed(2)}` : rx.odCyl.toFixed(2)) : "0.00",
            axis: rx.odAxis ? `${rx.odAxis}` : "0",
          },
          leftEye: {
            sph: rx.osSph != null ? (rx.osSph > 0 ? `+${rx.osSph.toFixed(2)}` : rx.osSph.toFixed(2)) : "0.00",
            cyl: rx.osCyl != null && rx.osCyl !== 0 ? (rx.osCyl > 0 ? `+${rx.osCyl.toFixed(2)}` : rx.osCyl.toFixed(2)) : "0.00",
            axis: rx.osAxis ? `${rx.osAxis}` : "0",
          },
          pd: rx.pd ? (typeof rx.pd === "number" ? `${rx.pd}` : String(rx.pd).replace(" mm", "")) : undefined,
        };
      }
    }

    return {
      frameName: item.frameName || item.product?.name || item.name || "Optical Frame",
      name: item.name || item.frameName || item.product?.name,
      color: item.color || item.selectedColor || item.frameColor,
      framePrice: item.framePrice !== undefined && item.framePrice !== null
        ? Number(item.framePrice)
        : (item.price ? Number(item.price) : undefined),
      lensPackageName: item.lensPackageName || item.selectedLensName || item.prescription?.lensType,
      lensPrice: item.lensPrice !== undefined && item.lensPrice !== null
        ? Number(item.lensPrice)
        : (item.lensFinalPrice !== undefined && item.lensFinalPrice !== null ? Number(item.lensFinalPrice) : undefined),
      prescription,
    };
  });

  return {
    id: order.id,
    orderNumber: displayId,
    customerName: order.customerName || "Customer",
    customerPhone: rawPhone,
    shippingAddress: order.shippingAddress || order.address || "Standard Delivery Address",
    city: order.city || order.shippingCity || "Pakistan",
    paymentMethod: order.paymentMethod || "COD",
    paymentStatus: order.paymentStatus || "PENDING_VERIFICATION",
    status: order.status || "PENDING",
    subtotal: subtotal > 0 ? subtotal : 0,
    shippingFee,
    totalAmount,
    items,
    receiptUrl: order.receiptUrl || `https://myeyes.pk/receipts/${order.id}`,
  };
}

/**
 * Builds dynamic status-aware WhatsApp message payload based on paymentStatus and fulfillment status.
 */
export function buildDetailedOrderMessage(orderInput: FullOrderPayload | OrderReceiptData | any): string {
  const order = normalizeToFullOrderPayload(orderInput);
  const displayId = order.orderNumber || order.id;
  const paymentStatus = (order.paymentStatus || "").toUpperCase();
  const fulfillmentStatus = (order.status || "").toUpperCase();

  // 1. Payment-specific triggers (priority over fulfillment if flagged)
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
  const itemsList = order.items
    .map((item, index) => {
      const frameTitle = item.frameName || item.name || "Optical Frame";
      const color = item.color ? ` (${item.color})` : "";
      const frameCost = item.framePrice ? `Rs. ${item.framePrice.toLocaleString()}` : "Included";
      const lensTitle = item.lensPackageName || "Standard Lenses";
      const lensCost = item.lensPrice ? `Rs. ${item.lensPrice.toLocaleString()}` : "Included";

      let block = `${index + 1}. ${frameTitle}${color} - ${frameCost}\n   - Lens: ${lensTitle} (${lensCost})`;

      if (item.prescription) {
        const r = item.prescription.rightEye;
        const l = item.prescription.leftEye;
        const pd = item.prescription.pd;

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
