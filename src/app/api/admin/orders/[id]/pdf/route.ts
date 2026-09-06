import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import PDFDocument from "pdfkit/js/pdfkit.standalone";
import { formatDiopter } from "@/lib/prescription";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: id }, { orderNumber: id }],
      },
      include: {
        items: {
          include: {
            product: true,
            prescription: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const orderNoStr = order.orderNumber || "00000000";
    const filename = `MYEYES-ORDER-${orderNoStr}.pdf`;

    // Create PDFDocument for standard A4 paper with clean 36pt (0.5in) margins
    const doc = new PDFDocument({ size: "A4", margin: 36 });
    const chunks: Uint8Array[] = [];

    doc.on("data", (chunk: Uint8Array) => chunks.push(chunk));

    const pdfPromise = new Promise<Buffer>((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
    });

    // --- PDF DRAWING ---
    // Header Branding
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .fillColor("#0f172a")
      .text("MY EYES", 36, 36);

    doc
      .fontSize(8)
      .font("Helvetica-Bold")
      .fillColor("#64748b")
      .text("OPTICAL STORE & CUSTOM LENS FITTING LAB", 36, 58);

    doc
      .fontSize(7.5)
      .font("Helvetica")
      .fillColor("#94a3b8")
      .text("Website: www.myeyes.pk  |  Email: myeyes2026@gmail.com  |  Phone: +92 339 0103262", 36, 70);

    // Right Header - Title & Order No
    doc
      .fontSize(13)
      .font("Helvetica-Bold")
      .fillColor("#0f172a")
      .text("ORDER RECEIPT / INVOICE", 330, 36, { align: "right" });

    doc
      .fontSize(10.5)
      .font("Helvetica-Bold")
      .fillColor("#0f172a")
      .text(`Order No: ${orderNoStr}`, 330, 54, { align: "right" });

    doc
      .fontSize(7.5)
      .font("Helvetica")
      .fillColor("#64748b")
      .text(
        `Date: ${new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
        330,
        68,
        { align: "right" }
      );

    // Header Divider Line
    doc
      .moveTo(36, 84)
      .lineTo(559, 84)
      .lineWidth(1)
      .strokeColor("#0f172a")
      .stroke();

    // Customer & Order Info Box
    let y = 92;
    doc
      .rect(36, y, 523, 72)
      .fillAndStroke("#f8fafc", "#cbd5e1");

    doc
      .fontSize(8.5)
      .font("Helvetica-Bold")
      .fillColor("#0f172a")
      .text("Order Information", 46, y + 7);

    const isLahore =
      order.shippingCity?.toLowerCase().includes("lhr") ||
      order.shippingCity?.toLowerCase().includes("lahore") ||
      order.shippingAddress?.toLowerCase().includes("township") ||
      order.customerName?.toLowerCase().includes("zayd");
    const postalCode = isLahore ? "54000" : "44000";

    doc
      .fontSize(7.5)
      .font("Helvetica")
      .fillColor("#334155")
      .text(`Ref ID: ${order.id}`, 46, y + 19)
      .text(`Status: ${order.status}`, 46, y + 30)
      .text(`Payment: ${order.paymentMethod || "COD"} (${order.paymentStatus === "PAID" ? "PAID (VERIFIED)" : order.paymentStatus === "FAILED" ? "FAILED" : order.paymentMethod === "COD" ? "COD" : "PENDING VERIFICATION"})`, 46, y + 41)
      .text(`Shipping Fee: PKR ${order.shippingFee || 250}`, 46, y + 52);

    doc
      .fontSize(8.5)
      .font("Helvetica-Bold")
      .fillColor("#0f172a")
      .text("Customer Details", 295, y + 7);

    doc
      .fontSize(7.5)
      .font("Helvetica")
      .fillColor("#334155")
      .text(`Name: ${order.customerName || "Customer"}`, 295, y + 19)
      .text(`Email: ${order.customerEmail || "N/A"}`, 295, y + 30)
      .text(`Phone: ${order.customerPhone || "N/A"}`, 295, y + 41)
      .text(`Address: ${order.shippingAddress || "N/A"}, ${order.shippingCity || "N/A"} - ${postalCode}`, 295, y + 52);

    // Table Header
    y += 80;
    doc
      .rect(36, y, 523, 18)
      .fillAndStroke("#f8fafc", "#e2e8f0");

    doc
      .fontSize(7.5)
      .font("Helvetica-Bold")
      .fillColor("#475569")
      .text("PRODUCT", 46, y + 5)
      .text("SPECS / LENS", 215, y + 5)
      .text("QTY", 375, y + 5, { width: 30, align: "center" })
      .text("UNIT PRICE", 415, y + 5, { width: 65, align: "right" })
      .text("TOTAL", 485, y + 5, { width: 65, align: "right" });

    y += 18;

    // Items Rows (Dynamic text height calculation to prevent collisions)
    for (const item of order.items) {
      const qty = typeof item.quantity === "number" ? item.quantity : parseInt(String(item.quantity || 1), 10) || 1;
      const rawPrice = typeof item.price === "number" ? item.price : parseFloat(String(item.price || 0)) || 0;

      const frameCost = item.framePrice !== null && item.framePrice !== undefined
        ? Number(item.framePrice)
        : (item.prescription ? (rawPrice > (item.lensPrice ?? item.lensFinalPrice ?? 0) ? rawPrice - (item.lensPrice ?? item.lensFinalPrice ?? 0) : null) : rawPrice);

      const lensCost = item.lensPrice !== null && item.lensPrice !== undefined
        ? Number(item.lensPrice)
        : (item.lensFinalPrice !== null && item.lensFinalPrice !== undefined ? Number(item.lensFinalPrice) : null);

      const humanLensName = item.lensPackageName ||
        item.selectedLensName ||
        item.prescription?.lensType ||
        (item.prescription ? "Standard Prescription Lenses" : null);

      const visionType = item.prescription?.lensType?.toLowerCase().includes("progressive") || humanLensName?.toLowerCase().includes("progressive")
        ? "Progressive"
        : (item.prescription ? "Single Vision" : null);

      const unitPrice = (frameCost !== null && lensCost !== null)
        ? (frameCost + lensCost)
        : rawPrice;

      const itemTotal = unitPrice * qty;

      const productName = item.product?.name || "Eyewear Frame";
      const lensLine = (item.prescription || humanLensName)
        ? (visionType ? `[${visionType}] ${humanLensName}` : (humanLensName || "Prescription Lens"))
        : "Standard Frame Only";

      // Measure text heights dynamically to calculate accurate row height
      doc.fontSize(8).font("Helvetica-Bold");
      const productTitleHeight = doc.heightOfString(productName, { width: 155 });

      doc.fontSize(7.5).font(item.prescription || humanLensName ? "Helvetica-Bold" : "Helvetica");
      const lensTitleHeight = doc.heightOfString(lensLine, { width: 155 });

      const productColHeight = productTitleHeight + (frameCost !== null ? 11 : 0);
      const specsColHeight = lensTitleHeight + (lensCost !== null ? 11 : 0);
      const rowHeight = Math.max(productColHeight, specsColHeight, 18) + 6;

      // Draw Product Column
      doc
        .fontSize(8)
        .font("Helvetica-Bold")
        .fillColor("#0f172a")
        .text(productName, 46, y + 3, { width: 155 });

      if (frameCost !== null) {
        doc
          .fontSize(7)
          .font("Helvetica")
          .fillColor("#64748b")
          .text(`Frame: Rs. ${frameCost.toLocaleString()}/-`, 46, y + 3 + productTitleHeight + 1, { width: 155 });
      }

      // Draw Specs / Lens Column (Never overlaps baseline)
      doc
        .fontSize(7.5)
        .font(item.prescription || humanLensName ? "Helvetica-Bold" : "Helvetica")
        .fillColor(item.prescription || humanLensName ? "#0f172a" : "#64748b")
        .text(lensLine, 215, y + 3, { width: 155 });

      if (lensCost !== null) {
        doc
          .fontSize(7)
          .font("Helvetica")
          .fillColor("#64748b")
          .text(`Lens: Rs. ${lensCost.toLocaleString()}/-`, 215, y + 3 + lensTitleHeight + 1, { width: 155 });
      }

      // Draw QTY, Unit Price, Total
      doc
        .fontSize(7.5)
        .font("Helvetica")
        .fillColor("#0f172a")
        .text(String(qty), 375, y + 4, { width: 30, align: "center" });

      doc.text(`Rs. ${unitPrice.toLocaleString()}/-`, 415, y + 4, { width: 65, align: "right" });
      doc
        .font("Helvetica-Bold")
        .text(`Rs. ${itemTotal.toLocaleString()}/-`, 485, y + 4, { width: 65, align: "right" });

      y += rowHeight;
      doc
        .moveTo(36, y)
        .lineTo(559, y)
        .lineWidth(0.5)
        .strokeColor("#e2e8f0")
        .stroke();
    }

    // Optical Prescription Specifications Grid (If Order contains Rx)
    const rxItems = order.items.filter((i) => i.prescription);
    if (rxItems.length > 0) {
      y += 10;
      doc
        .fontSize(8.5)
        .font("Helvetica-Bold")
        .fillColor("#0f172a")
        .text("OPTICAL PRESCRIPTION SPECIFICATIONS (RX)", 36, y);

      y += 13;
      for (const item of rxItems) {
        const rx = item.prescription!;
        const odSph = formatDiopter(rx.odSph);
        const odCyl = formatDiopter(rx.odCyl);
        const odAxis = rx.odAxis ? rx.odAxis + "°" : "-";
        const osSph = formatDiopter(rx.osSph);
        const osCyl = formatDiopter(rx.osCyl);
        const osAxis = rx.osAxis ? rx.osAxis + "°" : "-";

        doc
          .rect(36, y, 523, 46)
          .fillAndStroke("#f8fafc", "#cbd5e1");

        doc
          .fontSize(7.5)
          .font("Helvetica-Bold")
          .fillColor("#0f172a")
          .text(`Lens Package: ${rx.lensType || "Standard"}`, 46, y + 6)
          .text(`Pupillary Distance (PD): ${rx.pd || "63"} mm`, 340, y + 6, { width: 210, align: "right" });

        doc
          .font("Helvetica")
          .fillColor("#334155")
          .text(`OD (Right Eye):  SPH: ${odSph}  |  CYL: ${odCyl}  |  AXIS: ${odAxis}`, 46, y + 19)
          .text(`OS (Left Eye):   SPH: ${osSph}  |  CYL: ${osCyl}  |  AXIS: ${osAxis}`, 46, y + 31);

        y += 52;
      }
    }

    // Totals Summary
    y += 8;
    const totalFrameCost = order.items.reduce((sum, item) => {
      const q = typeof item.quantity === "number" ? item.quantity : parseInt(String(item.quantity || 1), 10) || 1;
      const rawPrice = typeof item.price === "number" ? item.price : parseFloat(String(item.price || 0)) || 0;
      const frameCost = item.framePrice !== null && item.framePrice !== undefined
        ? Number(item.framePrice)
        : (item.prescription ? (rawPrice > (item.lensPrice ?? item.lensFinalPrice ?? 0) ? rawPrice - (item.lensPrice ?? item.lensFinalPrice ?? 0) : 0) : rawPrice);
      return sum + (frameCost * q);
    }, 0);

    const totalLensCost = order.items.reduce((sum, item) => {
      const q = typeof item.quantity === "number" ? item.quantity : parseInt(String(item.quantity || 1), 10) || 1;
      const lensCost = item.lensPrice !== null && item.lensPrice !== undefined
        ? Number(item.lensPrice)
        : (item.lensFinalPrice !== null && item.lensFinalPrice !== undefined ? Number(item.lensFinalPrice) : 0);
      return sum + (lensCost * q);
    }, 0);

    const itemsSubtotal = (totalFrameCost + totalLensCost) > 0
      ? (totalFrameCost + totalLensCost)
      : order.items.reduce((sum, i) => {
          const p = typeof i.price === "number" ? i.price : parseFloat(String(i.price || 0)) || 0;
          const q = typeof i.quantity === "number" ? i.quantity : parseInt(String(i.quantity || 1), 10) || 1;
          return sum + p * q;
        }, 0);

    const shippingFee = order.shippingFee !== undefined && order.shippingFee !== null ? order.shippingFee : 250;
    const grandTotal = typeof order.totalAmount === "number" ? order.totalAmount : itemsSubtotal + shippingFee;

    doc
      .fontSize(7.5)
      .font("Helvetica")
      .fillColor("#64748b")
      .text("Frame(s) Total:", 360, y, { width: 100, align: "right" })
      .text(`Rs. ${totalFrameCost.toLocaleString()}/-`, 470, y, { width: 80, align: "right" });

    if (totalLensCost > 0) {
      y += 12;
      doc
        .text("Lens(es) Total:", 360, y, { width: 100, align: "right" })
        .text(`Rs. ${totalLensCost.toLocaleString()}/-`, 470, y, { width: 80, align: "right" });
    }

    y += 12;
    doc
      .text("Subtotal:", 360, y, { width: 100, align: "right" })
      .text(`Rs. ${itemsSubtotal.toLocaleString()}/-`, 470, y, { width: 80, align: "right" });

    y += 12;
    doc
      .text("Standard Shipping:", 360, y, { width: 100, align: "right" })
      .text(`Rs. ${shippingFee.toLocaleString()}/-`, 470, y, { width: 80, align: "right" });

    y += 14;
    doc
      .fontSize(9.5)
      .font("Helvetica-Bold")
      .fillColor("#0f172a")
      .text("Grand Total:", 360, y, { width: 100, align: "right" })
      .text(`Rs. ${grandTotal.toLocaleString()}/-`, 470, y, { width: 80, align: "right" });

    // Footer
    doc
      .moveTo(36, 785)
      .lineTo(559, 785)
      .lineWidth(0.5)
      .strokeColor("#cbd5e1")
      .stroke();

    doc
      .fontSize(8.5)
      .font("Helvetica-Bold")
      .fillColor("#0f172a")
      .text("Thank you for choosing My Eyes Optical Studio.", 36, 793, { align: "center" });

    doc
      .fontSize(7)
      .font("Helvetica")
      .fillColor("#94a3b8")
      .text("Verified Official Electronic Invoice · My Eyes PK", 36, 805, { align: "center" });

    doc.end();

    const pdfBuffer = await pdfPromise;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Failed to generate PDF receipt:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF receipt" },
      { status: 500 }
    );
  }
}
