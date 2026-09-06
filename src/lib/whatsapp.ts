import { OrderReceiptData } from "@/components/A4ReceiptModal";

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
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0092")) {
    digits = digits.slice(2);
  } else if (digits.startsWith("03")) {
    digits = "923" + digits.slice(2);
  } else if (digits.length === 10 && digits.startsWith("3")) {
    digits = "92" + digits;
  }
  return digits;
}

/**
 * Constructs raw, unencoded message string with strict business copy and clean ASCII separators.
 */
export function buildRawOrderMessage(order: OrderReceiptData): string {
  const customerName = order.customerName || "Customer";
  const orderIdentifier = order.orderNumber || order.id;
  const paymentMethod = order.paymentMethod || "Cash on Delivery (COD)";
  const address = order.shippingAddress || "Standard Delivery Address";
  const city = order.shippingCity || order.city || "Pakistan";
  const fullAddress = `${address}, ${city}`;

  const shippingFee = order.shippingFee !== undefined ? Number(order.shippingFee) : 250;
  const subtotal =
    order.items && order.items.length > 0
      ? order.items.reduce((sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 1), 0)
      : (Number(order.totalAmount) - shippingFee);
  const totalAmount = Number(order.totalAmount) || (subtotal + shippingFee);

  const lines: string[] = [
    "*MY EYES OPTICAL - ORDER CONFIRMATION*",
    "----------------------------------------",
    `Dear ${customerName},`,
    "",
    "Thank you for choosing My Eyes Optical.",
    "",
    `Order ID: ${orderIdentifier}`,
    `Payment Method: ${paymentMethod}`,
    `Delivery Address: ${fullAddress}`,
    "",
    "----------------------------------------",
    "ITEMIZED BREAKDOWN:",
    "----------------------------------------",
  ];

  if (order.items && order.items.length > 0) {
    order.items.forEach((item, index) => {
      const itemRecord = item as unknown as WhatsAppOrderItem;
      const frameName = itemRecord.frameName || itemRecord.product?.name || "Optical Frame";
      const color = itemRecord.color || itemRecord.selectedColor || itemRecord.frameColor;
      const lensPackage =
        itemRecord.lensPackageName ||
        itemRecord.selectedLensName ||
        itemRecord.prescription?.lensType ||
        (itemRecord.prescription ? "Standard Prescription Lenses" : "Frame Only");
      const unitPrice = Number(itemRecord.price) || 0;
      const qty = itemRecord.quantity || 1;

      lines.push(`${index + 1}. Frame: ${frameName}${color ? ` (${color})` : ""}`);
      lines.push(`   Lens Package: ${lensPackage}`);
      lines.push(`   Unit Price: Rs. ${unitPrice.toLocaleString()}`);
      lines.push(`   Quantity: ${qty}`);

      if (itemRecord.prescription) {
        const rx = itemRecord.prescription;
        const formatSph = (sph?: number | null) =>
          sph != null ? (sph > 0 ? `+${sph.toFixed(2)}` : sph.toFixed(2)) : "0.00";
        const formatCyl = (cyl?: number | null) =>
          cyl != null && cyl !== 0 ? (cyl > 0 ? `+${cyl.toFixed(2)}` : cyl.toFixed(2)) : "0.00";
        const formatAxis = (axis?: number | null) => (axis ? `${axis} deg` : "-");

        const odSph = formatSph(rx.odSph);
        const odCyl = formatCyl(rx.odCyl);
        const odAxis = formatAxis(rx.odAxis);

        const osSph = formatSph(rx.osSph);
        const osCyl = formatCyl(rx.osCyl);
        const osAxis = formatAxis(rx.osAxis);

        const pd = rx.pd ? `${rx.pd} mm` : "63 mm";

        lines.push("   Prescription Details:");
        lines.push(`   - Right Eye (OD): SPH ${odSph} | CYL ${odCyl} | AXIS ${odAxis}`);
        lines.push(`   - Left Eye (OS): SPH ${osSph} | CYL ${osCyl} | AXIS ${osAxis}`);
        lines.push(`   - Pupillary Distance (PD): ${pd}`);
      }

      lines.push("");
    });
  } else {
    lines.push("No items listed.");
    lines.push("");
  }

  lines.push("----------------------------------------");
  lines.push("FINANCIAL SUMMARY:");
  lines.push("----------------------------------------");
  lines.push(`Subtotal: Rs. ${subtotal.toLocaleString()}`);
  lines.push(`Shipping Fee: Rs. ${shippingFee.toLocaleString()}`);
  lines.push(`Final Total: Rs. ${totalAmount.toLocaleString()}`);
  lines.push("");
  lines.push("----------------------------------------");
  lines.push("Online Receipt:");
  lines.push(`https://myeyes.pk/receipts/${order.id}`);
  lines.push("");
  lines.push(
    'Please reply with *"CONFIRM"* to verify this order and your prescription details so we can begin processing your lenses.'
  );

  return lines.join("\n");
}

/**
 * Constructs URL-encoded WhatsApp order confirmation payload.
 */
export function buildDetailedOrderMessage(order: OrderReceiptData): string {
  const rawMessage = buildRawOrderMessage(order);
  return encodeURIComponent(rawMessage);
}
