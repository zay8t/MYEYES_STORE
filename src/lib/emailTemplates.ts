import { formatDiopter, formatAxis, formatPupillaryDistance } from "@/lib/prescription";
import { formatPrice } from "@/lib/utils";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://myeyes.pk";

export interface OrderEmailItem {
  frameName?: string;
  name?: string;
  product?: { name?: string; price?: number };
  framePrice?: number;
  price?: number;
  lensPackageName?: string;
  selectedLensName?: string;
  lensFinalPrice?: number;
  lensPrice?: number;
  quantity?: number;
  prescription?: {
    odSph?: number | string | null;
    odCyl?: number | string | null;
    odAxis?: number | string | null;
    osSph?: number | string | null;
    osCyl?: number | string | null;
    osAxis?: number | string | null;
    pd?: number | string | null;
    pupillaryDistance?: number | string | null;
    lensPackageName?: string | null;
    selectedLensName?: string | null;
    lensType?: string | null;
    rightEye?: { sph?: number | string | null; cyl?: number | string | null; axis?: number | string | null };
    leftEye?: { sph?: number | string | null; cyl?: number | string | null; axis?: number | string | null };
  } | null;
  prescriptionData?: Record<string, unknown> | null;
  [key: string]: unknown;
}

export interface OrderEmailPayload {
  id?: string;
  orderNumber?: string | null;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string | null;
  shippingAddress?: string | null;
  shippingCity?: string | null;
  city?: string | null;
  paymentMethod?: string;
  paymentStatus?: string;
  totalAmount?: number;
  shippingFee?: number | null;
  createdAt?: string | Date;
  items?: OrderEmailItem[];
  [key: string]: unknown;
}

export interface LeadEmailPayload {
  customerName?: string;
  name?: string;
  email?: string;
  mobileNumber?: string;
  whatsapp?: string;
  frameName?: string;
  resumeUrl?: string;
  [key: string]: unknown;
}

/**
 * Defensive item extraction helper for emails.
 */
function extractOrderItems(order: OrderEmailPayload | Record<string, unknown>) {
  const items = Array.isArray(order.items) ? (order.items as OrderEmailItem[]) : [];
  return items.map((item: OrderEmailItem) => {
    const frameName =
      item.frameName ||
      item.name ||
      item.product?.name ||
      "Premium Optical Frame";

    const framePrice =
      typeof item.framePrice === "number"
        ? item.framePrice
        : typeof item.product?.price === "number"
        ? item.product.price
        : typeof item.price === "number"
        ? item.price
        : 0;

    const lensPackageName =
      item.lensPackageName ||
      item.selectedLensName ||
      item.prescription?.lensPackageName ||
      item.prescription?.selectedLensName ||
      item.prescription?.lensType ||
      "Standard Optical Lenses";

    const lensPrice =
      typeof item.lensFinalPrice === "number"
        ? item.lensFinalPrice
        : typeof item.lensPrice === "number"
        ? item.lensPrice
        : 0;

    const quantity = typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : 1;

    // Prescription Data Extraction
    let rx = null;
    const rawRx = (item.prescription || item.prescriptionData) as Record<string, unknown> | undefined;

    if (rawRx) {
      const rightEye = rawRx.rightEye as Record<string, unknown> | undefined;
      const leftEye = rawRx.leftEye as Record<string, unknown> | undefined;
      const odSph = (rawRx.odSph !== undefined ? rawRx.odSph : rightEye?.sph) as number | string | null | undefined;
      const odCyl = (rawRx.odCyl !== undefined ? rawRx.odCyl : rightEye?.cyl) as number | string | null | undefined;
      const odAxis = (rawRx.odAxis !== undefined ? rawRx.odAxis : rightEye?.axis) as number | string | null | undefined;
      const osSph = (rawRx.osSph !== undefined ? rawRx.osSph : leftEye?.sph) as number | string | null | undefined;
      const osCyl = (rawRx.osCyl !== undefined ? rawRx.osCyl : leftEye?.cyl) as number | string | null | undefined;
      const osAxis = (rawRx.osAxis !== undefined ? rawRx.osAxis : leftEye?.axis) as number | string | null | undefined;
      const pd = (rawRx.pd !== undefined ? rawRx.pd : rawRx.pupillaryDistance) as number | string | null | undefined;

      if (odSph !== undefined || osSph !== undefined || odCyl !== undefined || osCyl !== undefined) {
        rx = {
          od: {
            sph: formatDiopter(odSph),
            cyl: formatDiopter(odCyl),
            axis: formatAxis(odAxis),
          },
          os: {
            sph: formatDiopter(osSph),
            cyl: formatDiopter(osCyl),
            axis: formatAxis(osAxis),
          },
          pd: formatPupillaryDistance(pd),
          lensType: rawRx.lensType || lensPackageName,
        };
      }
    }

    return {
      frameName,
      framePrice,
      lensPackageName,
      lensPrice,
      quantity,
      rx,
    };
  });
}

/**
 * Base layout wrapper for responsive, zero-emoji, client-safe HTML email tables.
 */
function wrapEmailHtml(contentHtml: string, previewText: string = ""): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MY EYES Optical Studio</title>
  <!--[if mso]>
  <style type="text/css">
    table {border-collapse:collapse;border-spacing:0;margin:0;}
    div, td {padding:0;}
    div {margin:0 !important;}
  </style>
  <![endif]-->
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    td {
      padding: 0;
    }
    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
    a {
      color: #0f172a;
      text-decoration: none;
    }
    .btn-primary {
      background-color: #0f172a;
      color: #ffffff !important;
      padding: 14px 28px;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-radius: 8px;
      display: inline-block;
    }
    .btn-primary:hover {
      background-color: #1e293b;
    }
    @media only screen and (max-width: 600px) {
      .container-table {
        width: 100% !important;
        border-radius: 0 !important;
      }
      .content-cell {
        padding: 24px 16px !important;
      }
      .col-stack {
        display: block !important;
        width: 100% !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 24px 0; background-color: #f1f5f9;">
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">
    ${previewText}
  </div>

  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9;">
    <tr>
      <td align="center" style="padding: 12px 16px;">
        <table role="presentation" class="container-table" width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Brand Header -->
          <tr>
            <td style="background-color: #0f172a; padding: 28px 32px; text-align: center;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <p style="margin: 0; font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: 0.15em; text-transform: uppercase;">
                      MY EYES
                    </p>
                    <p style="margin: 4px 0 0 0; font-size: 11px; font-weight: 600; color: #94a3b8; letter-spacing: 0.25em; text-transform: uppercase;">
                      Optical Studio &bull; Precision Eyewear
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body Content -->
          <tr>
            <td class="content-cell" style="padding: 32px 32px 24px 32px; color: #334155;">
              ${contentHtml}
            </td>
          </tr>

          <!-- Studio Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 32px; text-align: center;">
              <p style="margin: 0; font-size: 12px; font-weight: 700; color: #0f172a;">
                MY EYES OPTICAL STUDIO
              </p>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b;">
                Precision Rx Lab &bull; Premium Frames &bull; Nationwide Verification
              </p>
              <p style="margin: 12px 0 0 0; font-size: 11px; color: #94a3b8;">
                Support: <a href="mailto:myeyes2026@gmail.com" style="color: #64748b; font-weight: 600; text-decoration: underline;">myeyes2026@gmail.com</a> &bull; WhatsApp: +92 300 0000000
              </p>
              <p style="margin: 8px 0 0 0; font-size: 10px; color: #cbd5e1;">
                &copy; ${new Date().getFullYear()} MY EYES Optical. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * 1. Build Order Confirmation Email (Zero Emojis, Client-Safe Table Layout)
 */
export function buildOrderConfirmationEmail(order: OrderEmailPayload | Record<string, unknown>): string {
  const orderNumber = (order.orderNumber as string) || (order.id as string) || "N/A";
  const customerName = (order.customerName as string) || "Valued Customer";
  const dateStr = order.createdAt
    ? new Date(order.createdAt as string | Date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  const address = (order.shippingAddress as string) || "Delivery Address on Record";
  const city = (order.shippingCity as string) || (order.city as string) || "";
  const fullAddress = city ? `${address}, ${city}` : address;

  const items = extractOrderItems(order);
  const totalAmount = Number(order.totalAmount || 0);
  const shippingFee = typeof order.shippingFee === "number" ? order.shippingFee : 250;
  const subtotal = Math.max(0, totalAmount - shippingFee);

  const isCOD = String(order.paymentMethod || "").toUpperCase().includes("COD");
  const advanceRequired = Math.round(totalAmount * 0.25);
  const remainingBalance = Math.max(0, totalAmount - advanceRequired);

  const trackingUrl = `${APP_URL}/orders/${order.orderNumber || order.id}`;

  // Items HTML
  const itemsRowsHtml = items
    .map((item) => {
      const rxSection = item.rx
        ? `
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 10px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; font-size: 11px; font-family: monospace;">
          <tr>
            <td style="padding: 2px 4px; font-weight: 700; color: #0f172a;" colspan="3">OPTICAL PRESCRIPTION (Rx)</td>
          </tr>
          <tr>
            <td style="padding: 2px 4px; color: #334155;"><strong>OD (Right):</strong> SPH ${item.rx.od.sph} | CYL ${item.rx.od.cyl} | AXIS ${item.rx.od.axis}</td>
          </tr>
          <tr>
            <td style="padding: 2px 4px; color: #334155;"><strong>OS (Left):</strong> SPH ${item.rx.os.sph} | CYL ${item.rx.os.cyl} | AXIS ${item.rx.os.axis}</td>
          </tr>
          <tr>
            <td style="padding: 2px 4px; color: #64748b;"><strong>PD:</strong> ${item.rx.pd} &bull; <strong>Lens Package:</strong> ${item.lensPackageName}</td>
          </tr>
        </table>
      `
        : "";

      return `
      <tr>
        <td style="padding: 16px 0; border-bottom: 1px solid #f1f5f9;">
          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="vertical-align: top;">
                <p style="margin: 0; font-size: 14px; font-weight: 700; color: #0f172a;">
                  ${item.frameName} <span style="font-size: 12px; font-weight: 500; color: #64748b;">(Qty: ${item.quantity})</span>
                </p>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">
                  Frame Retail: ${formatPrice(item.framePrice)} &bull; Lens Package: ${item.lensPackageName} (${formatPrice(item.lensPrice)})
                </p>
                ${rxSection}
              </td>
              <td align="right" style="vertical-align: top; width: 100px;">
                <p style="margin: 0; font-size: 14px; font-weight: 700; color: #0f172a; font-family: monospace;">
                  ${formatPrice((item.framePrice + item.lensPrice) * item.quantity)}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
    })
    .join("");

  const advanceNoticeHtml = isCOD
    ? `
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0; background-color: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px; padding: 14px 16px;">
      <tr>
        <td>
          <p style="margin: 0; font-size: 12px; font-weight: 700; color: #92400e; text-transform: uppercase; letter-spacing: 0.05em;">
            Custom Lens Manufacturing Policy &bull; 25% Advance Required
          </p>
          <p style="margin: 6px 0 0 0; font-size: 12px; color: #78350f; line-height: 1.5;">
            Because prescription lenses are custom-crafted specifically for your vision parameters, a <strong>25% advance deposit of ${formatPrice(advanceRequired)}</strong> is required to queue workshop edging.
          </p>
          <p style="margin: 6px 0 0 0; font-size: 12px; color: #78350f;">
            <strong>Remaining Doorstep COD Balance:</strong> ${formatPrice(remainingBalance)}
          </p>
        </td>
      </tr>
    </table>
  `
    : "";

  const content = `
    <!-- Header Title -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px;">
      <tr>
        <td>
          <span style="font-size: 11px; font-weight: 800; color: #64748b; letter-spacing: 0.1em; text-transform: uppercase;">ORDER CONFIRMATION</span>
          <h1 style="margin: 4px 0 0 0; font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">
            Thank you for your order, ${customerName}
          </h1>
        </td>
        <td align="right" style="vertical-align: bottom;">
          <span style="font-size: 13px; font-weight: 700; font-family: monospace; color: #0f172a; background-color: #f1f5f9; padding: 4px 8px; border-radius: 4px;">
            #${orderNumber}
          </span>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 20px 0; font-size: 13px; color: #475569; line-height: 1.6;">
      We have received your optical order and registered it in our precision dispensing system. Below is your complete order specification and optical record.
    </p>

    <!-- Order Metadata Card -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <tr>
        <td style="width: 50%; vertical-align: top; padding-right: 12px;">
          <p style="margin: 0; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Order Date</p>
          <p style="margin: 2px 0 10px 0; font-size: 12px; font-weight: 600; color: #0f172a;">${dateStr}</p>

          <p style="margin: 0; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Payment Method</p>
          <p style="margin: 2px 0 0 0; font-size: 12px; font-weight: 600; color: #0f172a;">${order.paymentMethod || "Bank Transfer / Online"}</p>
        </td>
        <td style="width: 50%; vertical-align: top; padding-left: 12px;">
          <p style="margin: 0; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Delivery Destination</p>
          <p style="margin: 2px 0 0 0; font-size: 12px; font-weight: 600; color: #0f172a; line-height: 1.4;">${fullAddress}</p>
        </td>
      </tr>
    </table>

    <!-- Items Header -->
    <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 800; color: #0f172a; letter-spacing: 0.05em; text-transform: uppercase;">
      ORDERED ITEMS &bull; OPTICAL SPECIFICATIONS
    </p>

    <!-- Items Table -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
      ${itemsRowsHtml}
    </table>

    <!-- Financial Summary Table -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
      <tr>
        <td style="padding: 4px 0; font-size: 12px; color: #64748b;">Subtotal</td>
        <td align="right" style="padding: 4px 0; font-size: 12px; font-weight: 600; color: #0f172a; font-family: monospace;">${formatPrice(subtotal)}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; font-size: 12px; color: #64748b;">Express Insured Delivery</td>
        <td align="right" style="padding: 4px 0; font-size: 12px; font-weight: 600; color: #0f172a; font-family: monospace;">${formatPrice(shippingFee)}</td>
      </tr>
      <tr style="border-top: 1px solid #e2e8f0;">
        <td style="padding: 10px 0 4px 0; font-size: 14px; font-weight: 800; color: #0f172a;">Total Amount</td>
        <td align="right" style="padding: 10px 0 4px 0; font-size: 16px; font-weight: 800; color: #0f172a; font-family: monospace;">${formatPrice(totalAmount)}</td>
      </tr>
    </table>

    ${advanceNoticeHtml}

    <!-- Call to Action -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 28px; text-align: center;">
      <tr>
        <td align="center">
          <a href="${trackingUrl}" class="btn-primary" target="_blank">
            View Order &amp; Track Live &rarr;
          </a>
        </td>
      </tr>
    </table>
  `;

  return wrapEmailHtml(content, `Order Confirmation #${orderNumber} - MY EYES Optical Studio`);
}

/**
 * 2. Build Payment Approved / Deposit Verified Email
 */
export function buildPaymentApprovedEmail(order: OrderEmailPayload | Record<string, unknown>): string {
  const orderNumber = (order.orderNumber as string) || (order.id as string) || "N/A";
  const customerName = (order.customerName as string) || "Valued Customer";
  const totalAmount = Number(order.totalAmount || 0);
  const isCOD = String(order.paymentMethod || "").toUpperCase().includes("COD");
  const advancePaid = Math.round(totalAmount * 0.25);
  const remainingDoorstepBalance = Math.max(0, totalAmount - advancePaid);
  const trackingUrl = `${APP_URL}/orders/${order.orderNumber || order.id}`;

  const content = `
    <!-- Header Title -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-bottom: 2px solid #10b981; padding-bottom: 12px; margin-bottom: 20px;">
      <tr>
        <td>
          <span style="font-size: 11px; font-weight: 800; color: #059669; letter-spacing: 0.1em; text-transform: uppercase;">PAYMENT VERIFIED</span>
          <h1 style="margin: 4px 0 0 0; font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">
            Advance Deposit Verified &bull; Order in Production
          </h1>
        </td>
        <td align="right" style="vertical-align: bottom;">
          <span style="font-size: 13px; font-weight: 700; font-family: monospace; color: #0f172a; background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 4px 8px; border-radius: 4px;">
            #${orderNumber}
          </span>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 16px 0; font-size: 13px; color: #334155; line-height: 1.6;">
      Dear ${customerName},
    </p>

    <p style="margin: 0 0 20px 0; font-size: 13px; color: #334155; line-height: 1.6;">
      Your advance payment deposit for <strong>Order #${orderNumber}</strong> has been successfully verified and confirmed by our accounts team.
    </p>

    <!-- Lab Schedule Box -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
      <tr>
        <td>
          <p style="margin: 0; font-size: 12px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 0.05em;">
            Optical Workshop Status: Scheduled for Lab Cutting
          </p>
          <p style="margin: 6px 0 0 0; font-size: 12px; color: #15803d; line-height: 1.5;">
            Your custom prescription lenses have now entered precision surfacing and optical fitting. Once fitting and multi-point QA inspection are complete, your package will be dispatched via express insured courier.
          </p>
        </td>
      </tr>
    </table>

    <!-- Balance Summary Card -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 4px 0; font-size: 12px; color: #64748b;">Total Order Value</td>
        <td align="right" style="padding: 4px 0; font-size: 12px; font-weight: 600; color: #0f172a; font-family: monospace;">${formatPrice(totalAmount)}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; font-size: 12px; color: #059669; font-weight: 600;">Verified Advance Deposit</td>
        <td align="right" style="padding: 4px 0; font-size: 12px; font-weight: 700; color: #059669; font-family: monospace;">${formatPrice(advancePaid)}</td>
      </tr>
      ${
        isCOD
          ? `
      <tr style="border-top: 1px solid #e2e8f0;">
        <td style="padding: 8px 0 0 0; font-size: 13px; font-weight: 800; color: #0f172a;">Remaining COD Doorstep Balance</td>
        <td align="right" style="padding: 8px 0 0 0; font-size: 14px; font-weight: 800; color: #0f172a; font-family: monospace;">${formatPrice(remainingDoorstepBalance)}</td>
      </tr>
      `
          : `
      <tr style="border-top: 1px solid #e2e8f0;">
        <td style="padding: 8px 0 0 0; font-size: 13px; font-weight: 800; color: #059669;">Balance Remaining</td>
        <td align="right" style="padding: 8px 0 0 0; font-size: 14px; font-weight: 800; color: #059669; font-family: monospace;">Rs. 0/- (Fully Paid)</td>
      </tr>
      `
      }
    </table>

    <!-- Call to Action -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 24px; text-align: center;">
      <tr>
        <td align="center">
          <a href="${trackingUrl}" class="btn-primary" target="_blank">
            Track Optical Production Live &rarr;
          </a>
        </td>
      </tr>
    </table>
  `;

  return wrapEmailHtml(content, `Advance Deposit Verified for Order #${orderNumber} - MY EYES Optical Studio`);
}

/**
 * 3. Build Payment Rejection / Verification Issue Email
 */
export function buildPaymentRejectionEmail(
  order: OrderEmailPayload | Record<string, unknown>,
  reason: string,
  customReason?: string
): string {
  const orderNumber = (order.orderNumber as string) || (order.id as string) || "N/A";
  const customerName = (order.customerName as string) || "Valued Customer";
  const uploadUrl = `${APP_URL}/orders/${order.orderNumber || order.id}`;

  const finalReasonText =
    customReason && customReason.trim() !== ""
      ? `${reason}: ${customReason.trim()}`
      : reason || "Transaction ID / Receipt image could not be verified on our official bank statement.";

  const content = `
    <!-- Header Title -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-bottom: 2px solid #e11d48; padding-bottom: 12px; margin-bottom: 20px;">
      <tr>
        <td>
          <span style="font-size: 11px; font-weight: 800; color: #e11d48; letter-spacing: 0.1em; text-transform: uppercase;">ACTION REQUIRED</span>
          <h1 style="margin: 4px 0 0 0; font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">
            Payment Verification Issue &bull; Order #${orderNumber}
          </h1>
        </td>
        <td align="right" style="vertical-align: bottom;">
          <span style="font-size: 13px; font-weight: 700; font-family: monospace; color: #e11d48; background-color: #fff1f2; border: 1px solid #fecdd3; padding: 4px 8px; border-radius: 4px;">
            RE-UPLOAD REQUIRED
          </span>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 16px 0; font-size: 13px; color: #334155; line-height: 1.6;">
      Dear ${customerName},
    </p>

    <p style="margin: 0 0 20px 0; font-size: 13px; color: #334155; line-height: 1.6;">
      We reviewed the payment confirmation for <strong>Order #${orderNumber}</strong>, but our accounts team was unable to confirm your deposit.
    </p>

    <!-- Reason Box -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fff1f2; border: 1px solid #fecdd3; border-left: 4px solid #e11d48; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
      <tr>
        <td>
          <p style="margin: 0; font-size: 11px; font-weight: 800; color: #9f1239; text-transform: uppercase; letter-spacing: 0.05em;">
            Reason for Verification Rejection:
          </p>
          <p style="margin: 6px 0 0 0; font-size: 13px; font-weight: 600; color: #881337; line-height: 1.5;">
            ${finalReasonText}
          </p>
        </td>
      </tr>
    </table>

    <!-- Action Instructions -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <tr>
        <td>
          <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; color: #0f172a; text-transform: uppercase;">
            How to resolve and proceed:
          </p>
          <ol style="margin: 0; padding-left: 18px; font-size: 12px; color: #475569; line-height: 1.6;">
            <li>Click the button below to access your live order dashboard.</li>
            <li>Re-upload a clear, readable screenshot of your bank transfer or mobile wallet receipt showing the Transaction ID (TID), timestamp, and amount.</li>
            <li>Alternatively, contact our billing desk directly via WhatsApp at +92 300 0000000 with your Order Number.</li>
          </ol>
        </td>
      </tr>
    </table>

    <!-- Call to Action -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 24px; text-align: center;">
      <tr>
        <td align="center">
          <a href="${uploadUrl}" class="btn-primary" target="_blank" style="background-color: #e11d48;">
            Re-Upload Payment Proof &rarr;
          </a>
        </td>
      </tr>
    </table>
  `;

  return wrapEmailHtml(content, `Payment Verification Issue for Order #${orderNumber} - MY EYES Optical Studio`);
}

/**
 * 4. Build Order Dispatched / En Route Email (Zero Emojis, Client-Safe Table Layout)
 */
export function buildOrderDispatchedEmail(
  order: OrderEmailPayload | Record<string, unknown>,
  courierName?: string,
  trackingNumber?: string
): string {
  const orderNumber = (order.orderNumber as string) || (order.id as string) || "N/A";
  const customerName = (order.customerName as string) || "Valued Customer";
  const address = (order.shippingAddress as string) || "Delivery Address on Record";
  const city = (order.shippingCity as string) || (order.city as string) || "";
  const fullAddress = city ? `${address}, ${city}` : address;
  const items = extractOrderItems(order);
  const totalAmount = Number(order.totalAmount || 0);
  const isCOD = String(order.paymentMethod || "").toUpperCase().includes("COD");
  const advancePaid = Math.round(totalAmount * 0.25);
  const remainingDoorstepBalance = isCOD ? Math.max(0, totalAmount - advancePaid) : 0;
  const trackingUrl = `${APP_URL}/orders/${order.orderNumber || order.id}`;

  const resolvedCourier = courierName && courierName.trim() !== "" ? courierName.trim() : "Express Insured Courier";
  const resolvedTrackingNumber = trackingNumber && trackingNumber.trim() !== "" ? trackingNumber.trim() : "Assigned (En Route)";

  const itemsRowsHtml = items
    .map((item) => {
      const rxSection = item.rx
        ? `
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 8px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px; font-size: 11px; font-family: monospace;">
          <tr>
            <td style="padding: 2px 4px; color: #334155;"><strong>OD (Right):</strong> SPH ${item.rx.od.sph} | CYL ${item.rx.od.cyl} | AXIS ${item.rx.od.axis}</td>
          </tr>
          <tr>
            <td style="padding: 2px 4px; color: #334155;"><strong>OS (Left):</strong> SPH ${item.rx.os.sph} | CYL ${item.rx.os.cyl} | AXIS ${item.rx.os.axis}</td>
          </tr>
          <tr>
            <td style="padding: 2px 4px; color: #64748b;"><strong>PD:</strong> ${item.rx.pd} &bull; <strong>Lens Package:</strong> ${item.lensPackageName}</td>
          </tr>
        </table>
      `
        : "";

      return `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="vertical-align: top;">
                <p style="margin: 0; font-size: 13px; font-weight: 700; color: #0f172a;">
                  ${item.frameName} <span style="font-size: 11px; font-weight: 500; color: #64748b;">(Qty: ${item.quantity})</span>
                </p>
                <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">
                  Lens: ${item.lensPackageName}
                </p>
                ${rxSection}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
    })
    .join("");

  const paymentNoticeHtml = isCOD
    ? `
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 16px; background-color: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px; padding: 12px 16px;">
      <tr>
        <td>
          <p style="margin: 0; font-size: 11px; font-weight: 800; color: #92400e; text-transform: uppercase; letter-spacing: 0.05em;">
            Payment Due at Doorstep (COD)
          </p>
          <p style="margin: 4px 0 0 0; font-size: 13px; font-weight: 700; color: #78350f;">
            Remaining Payable Balance: ${formatPrice(remainingDoorstepBalance)}
          </p>
          <p style="margin: 4px 0 0 0; font-size: 11px; color: #92400e; line-height: 1.4;">
            Please keep the exact cash amount ready for the delivery rider upon arrival.
          </p>
        </td>
      </tr>
    </table>
  `
    : `
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 16px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #10b981; border-radius: 6px; padding: 12px 16px;">
      <tr>
        <td>
          <p style="margin: 0; font-size: 11px; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.05em;">
            Payment Status: Fully Paid &amp; Verified
          </p>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #15803d;">
            Zero balance is due at doorstep. Simply inspect and receive your parcel.
          </p>
        </td>
      </tr>
    </table>
  `;

  const content = `
    <!-- Header Title -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px;">
      <tr>
        <td>
          <span style="font-size: 11px; font-weight: 800; color: #0284c7; letter-spacing: 0.1em; text-transform: uppercase;">DISPATCH NOTIFICATION</span>
          <h1 style="margin: 4px 0 0 0; font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">
            Order Dispatched &bull; En Route
          </h1>
        </td>
        <td align="right" style="vertical-align: bottom;">
          <span style="font-size: 13px; font-weight: 700; font-family: monospace; color: #0369a1; background-color: #f0f9ff; border: 1px solid #bae6fd; padding: 4px 8px; border-radius: 4px;">
            #${orderNumber}
          </span>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 16px 0; font-size: 13px; color: #334155; line-height: 1.6;">
      Dear ${customerName},
    </p>

    <p style="margin: 0 0 20px 0; font-size: 13px; color: #334155; line-height: 1.6;">
      Great news! Your custom prescription eyewear for <strong>Order #${orderNumber}</strong> has completed laboratory edging, optical alignment, and multi-point QA inspection. It has now been securely handed over to our logistics partner for express delivery.
    </p>

    <!-- Shipment & Tracking Card -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
      <tr>
        <td style="width: 50%; vertical-align: top; padding-right: 12px;">
          <p style="margin: 0; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Courier Partner</p>
          <p style="margin: 2px 0 10px 0; font-size: 13px; font-weight: 700; color: #0f172a;">${resolvedCourier}</p>

          <p style="margin: 0; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Tracking / Consignment Number</p>
          <p style="margin: 2px 0 0 0; font-size: 13px; font-weight: 700; font-family: monospace; color: #0284c7;">${resolvedTrackingNumber}</p>
        </td>
        <td style="width: 50%; vertical-align: top; padding-left: 12px;">
          <p style="margin: 0; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Estimated Delivery Window</p>
          <p style="margin: 2px 0 10px 0; font-size: 13px; font-weight: 700; color: #0f172a;">2 to 4 Business Days</p>

          <p style="margin: 0; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Destination Address</p>
          <p style="margin: 2px 0 0 0; font-size: 12px; font-weight: 600; color: #0f172a; line-height: 1.4;">${fullAddress}</p>
        </td>
      </tr>
    </table>

    <!-- Items in Transit -->
    <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 800; color: #0f172a; letter-spacing: 0.05em; text-transform: uppercase;">
      Items in Shipment
    </p>
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
      ${itemsRowsHtml}
    </table>

    ${paymentNoticeHtml}

    <!-- Call to Action -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 24px; text-align: center;">
      <tr>
        <td align="center">
          <a href="${trackingUrl}" class="btn-primary" target="_blank">
            Track Shipment Status &rarr;
          </a>
        </td>
      </tr>
    </table>
  `;

  return wrapEmailHtml(content, `Order Dispatched #${orderNumber} - Tracking Details - MY EYES Optical Studio`);
}

/**
 * 5. Build Order Delivered Email (Receipt & Care Guide)
 */
export function buildOrderDeliveredEmail(order: OrderEmailPayload | Record<string, unknown>): string {
  const orderNumber = (order.orderNumber as string) || (order.id as string) || "N/A";
  const customerName = (order.customerName as string) || "Valued Customer";
  const items = extractOrderItems(order);
  const totalAmount = Number(order.totalAmount || 0);
  const trackingUrl = `${APP_URL}/orders/${order.orderNumber || order.id}`;

  const itemsSummaryHtml = items
    .map((item) => {
      return `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
          <p style="margin: 0; font-size: 12px; font-weight: 700; color: #0f172a;">
            ${item.frameName} <span style="font-size: 11px; font-weight: 500; color: #64748b;">(Qty: ${item.quantity})</span>
          </p>
          <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">
            Lens: ${item.lensPackageName}
          </p>
        </td>
        <td align="right" style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; vertical-align: top;">
          <p style="margin: 0; font-size: 12px; font-weight: 700; color: #0f172a; font-family: monospace;">
            ${formatPrice((item.framePrice + item.lensPrice) * item.quantity)}
          </p>
        </td>
      </tr>
    `;
    })
    .join("");

  const content = `
    <!-- Header Title -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-bottom: 2px solid #10b981; padding-bottom: 12px; margin-bottom: 20px;">
      <tr>
        <td>
          <span style="font-size: 11px; font-weight: 800; color: #059669; letter-spacing: 0.1em; text-transform: uppercase;">DELIVERY CONFIRMATION</span>
          <h1 style="margin: 4px 0 0 0; font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">
            Order Delivered &bull; Receipt &amp; Care Guide
          </h1>
        </td>
        <td align="right" style="vertical-align: bottom;">
          <span style="font-size: 13px; font-weight: 700; font-family: monospace; color: #0f172a; background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 4px 8px; border-radius: 4px;">
            #${orderNumber}
          </span>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 16px 0; font-size: 13px; color: #334155; line-height: 1.6;">
      Dear ${customerName},
    </p>

    <p style="margin: 0 0 20px 0; font-size: 13px; color: #334155; line-height: 1.6;">
      Your package for <strong>Order #${orderNumber}</strong> has been marked as successfully delivered. Thank you for choosing MY EYES Optical Studio for your vision care.
    </p>

    <!-- Optical Care & Adaptation Guide -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 24px;">
      <tr>
        <td>
          <p style="margin: 0 0 10px 0; font-size: 12px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em;">
            Precision Eyewear &bull; Optical Care Guide
          </p>
          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 12px; color: #475569; line-height: 1.6;">
            <tr>
              <td style="padding: 4px 0; vertical-align: top; width: 16px;">&bull;</td>
              <td style="padding: 4px 0;"><strong>Prescription Adaptation:</strong> Please allow 2 to 3 days for your visual cortex and eyes to fully adapt to your new prescription power and lens curvature.</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; vertical-align: top; width: 16px;">&bull;</td>
              <td style="padding: 4px 0;"><strong>Lens Cleaning:</strong> Clean exclusively with lukewarm water and the provided microfiber optical cloth. Avoid paper towels, shirts, and household cleaners that can damage anti-glare coatings.</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; vertical-align: top; width: 16px;">&bull;</td>
              <td style="padding: 4px 0;"><strong>Protective Storage:</strong> When not being worn, always store your eyewear in its rigid hard case to prevent hinge pressure and temple misalignment.</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; vertical-align: top; width: 16px;">&bull;</td>
              <td style="padding: 4px 0;"><strong>Adjustment Support:</strong> If you experience loose temples or pressure at the bridge, reply directly to this email for optical support.</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Delivered Items Summary -->
    <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 800; color: #0f172a; letter-spacing: 0.05em; text-transform: uppercase;">
      Delivered Items
    </p>
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 16px;">
      ${itemsSummaryHtml}
      <tr style="border-top: 1px solid #e2e8f0;">
        <td style="padding: 10px 0; font-size: 13px; font-weight: 800; color: #0f172a;">Total Paid</td>
        <td align="right" style="padding: 10px 0; font-size: 14px; font-weight: 800; color: #0f172a; font-family: monospace;">${formatPrice(totalAmount)}</td>
      </tr>
    </table>

    <!-- Call to Action -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 24px; text-align: center;">
      <tr>
        <td align="center">
          <a href="${trackingUrl}" class="btn-primary" target="_blank">
            View Official Order Receipt &rarr;
          </a>
        </td>
      </tr>
    </table>
  `;

  return wrapEmailHtml(content, `Delivered: Order #${orderNumber} Receipt & Care Guide - MY EYES Optical Studio`);
}

/**
 * 6. Build Incomplete Lead Email (Assistance with Prescription & Checkout)
 */
export function buildIncompleteLeadEmail(lead: LeadEmailPayload): string {
  const customerName = lead.customerName || lead.name || "Valued Customer";
  const frameName = lead.frameName || "Premium Optical Frame";
  const resumeUrl = lead.resumeUrl || `${APP_URL}/catalog`;

  const content = `
    <!-- Header Title -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-bottom: 2px solid #f59e0b; padding-bottom: 12px; margin-bottom: 20px;">
      <tr>
        <td>
          <span style="font-size: 11px; font-weight: 800; color: #d97706; letter-spacing: 0.1em; text-transform: uppercase;">PRESCRIPTION ASSISTANCE</span>
          <h1 style="margin: 4px 0 0 0; font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">
            Need Help Completing Your Eyewear Order?
          </h1>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 16px 0; font-size: 13px; color: #334155; line-height: 1.6;">
      Dear ${customerName},
    </p>

    <p style="margin: 0 0 20px 0; font-size: 13px; color: #334155; line-height: 1.6;">
      We noticed you started configuring custom prescription lenses for <strong>${frameName}</strong> on MY EYES Optical Studio, but were unable to complete your checkout.
    </p>

    <!-- Help Box -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
      <tr>
        <td>
          <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 800; color: #92400e; text-transform: uppercase; letter-spacing: 0.05em;">
            Our Optical Specialists Are Standing By:
          </p>
          <p style="margin: 0 0 8px 0; font-size: 12px; color: #78350f; line-height: 1.6;">
            Entering sphere (SPH), cylinder (CYL), axis, and pupillary distance (PD) parameters can be complex. We make it completely effortless:
          </p>
          <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #78350f; line-height: 1.6;">
            <li><strong>Prescription Slip Upload:</strong> Simply reply directly to this email or send a clear WhatsApp photo of your doctor's slip. Our certified lab team will configure your exact lens parameters.</li>
            <li><strong>Lens Coating Recommendations:</strong> Need advice on Blue Defense, Photochromic Sun-Adaptive, or Ultra-Thin 1.67 High Index lenses? We will match the perfect package for your optical power.</li>
          </ul>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 20px 0; font-size: 13px; color: #334155; line-height: 1.6;">
      Your frame selection and configuration are saved. Click below whenever you are ready to continue:
    </p>

    <!-- Call to Action -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 24px; text-align: center;">
      <tr>
        <td align="center">
          <a href="${resumeUrl}" class="btn-primary" target="_blank">
            Resume Your Order &rarr;
          </a>
        </td>
      </tr>
    </table>
  `;

  return wrapEmailHtml(content, `Need Help Completing Your Eyewear Order? - MY EYES Optical Studio`);
}
