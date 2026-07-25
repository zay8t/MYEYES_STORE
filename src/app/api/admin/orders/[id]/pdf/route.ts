import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import PDFDocument from "pdfkit";

export const dynamic = "force-dynamic";

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

    // Create PDFDocument for standard A4 paper
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks: Uint8Array[] = [];

    doc.on("data", (chunk: Uint8Array) => chunks.push(chunk));

    const pdfPromise = new Promise<Buffer>((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
    });

    // --- PDF DRAWING ---
    // Header Branding
    doc
      .fontSize(22)
      .font("Helvetica-Bold")
      .fillColor("#0f172a")
      .text("MY EYES", 40, 40);

    doc
      .fontSize(8.5)
      .font("Helvetica-Bold")
      .fillColor("#64748b")
      .text("OPTICAL STORE & CUSTOM LENS FITTING LAB", 40, 66);

    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor("#94a3b8")
      .text("Website: www.myeyes.pk  |  Email: support@myeyes.pk", 40, 78);

    // Right Header - Title & Order No
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .fillColor("#0f172a")
      .text("ORDER RECEIPT / INVOICE", 330, 40, { align: "right" });

    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor("#0f172a")
      .text(`Order No: ${orderNoStr}`, 330, 60, { align: "right" });

    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor("#64748b")
      .text(
        `Date: ${new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
        330,
        75,
        { align: "right" }
      );

    // Header Divider Line
    doc
      .moveTo(40, 95)
      .lineTo(555, 95)
      .lineWidth(1.5)
      .strokeColor("#0f172a")
      .stroke();

    // Customer & Order Info Box
    let y = 110;
    doc
      .rect(40, y, 515, 80)
      .fillAndStroke("#f8fafc", "#cbd5e1");

    doc
      .fontSize(9)
      .font("Helvetica-Bold")
      .fillColor("#0f172a")
      .text("Order Information", 52, y + 8);

    const isLahore =
      order.shippingCity?.toLowerCase().includes("lhr") ||
      order.shippingCity?.toLowerCase().includes("lahore") ||
      order.shippingAddress?.toLowerCase().includes("township") ||
      order.customerName?.toLowerCase().includes("zayd");
    const postalCode = isLahore ? "54000" : "44000";

    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor("#334155")
      .text(`Ref ID: ${order.id}`, 52, y + 22)
      .text(`Status: ${order.status}`, 52, y + 34)
      .text(`Payment Method: ${order.paymentMethod || "COD"}`, 52, y + 46)
      .text(`Shipping Fee: PKR ${order.shippingFee || 250}`, 52, y + 58);

    doc
      .fontSize(9)
      .font("Helvetica-Bold")
      .fillColor("#0f172a")
      .text("Customer Details", 300, y + 8);

    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor("#334155")
      .text(`Name: ${order.customerName}`, 300, y + 22)
      .text(`Email: ${order.customerEmail}`, 300, y + 34)
      .text(`Phone: ${order.customerPhone || "N/A"}`, 300, y + 46)
      .text(`Address: ${order.shippingAddress || "N/A"}`, 300, y + 58)
      .text(`City: ${order.shippingCity || "N/A"} - ${postalCode}`, 300, y + 68);

    // Table Header
    y += 90;
    doc
      .rect(40, y, 515, 20)
      .fill("#0f172a");

    doc
      .fontSize(8)
      .font("Helvetica-Bold")
      .fillColor("#ffffff")
      .text("PRODUCT", 50, y + 6)
      .text("SPECS / LENS", 220, y + 6)
      .text("QTY", 380, y + 6, { width: 30, align: "center" })
      .text("UNIT PRICE", 420, y + 6, { width: 60, align: "right" })
      .text("TOTAL", 490, y + 6, { width: 55, align: "right" });

    y += 20;

    // Items Rows
    for (const item of order.items) {
      const itemTotal = item.price * item.quantity;
      doc
        .fontSize(8)
        .font("Helvetica-Bold")
        .fillColor("#0f172a")
        .text(item.product?.name || "Eyewear Frame", 50, y + 6);

      doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor("#475569")
        .text(item.prescription ? item.prescription.lensType : "Frame Only", 220, y + 6);

      doc.text(String(item.quantity), 380, y + 6, { width: 30, align: "center" });
      doc.text(`Rs. ${item.price.toLocaleString()}`, 420, y + 6, { width: 60, align: "right" });
      doc
        .font("Helvetica-Bold")
        .text(`Rs. ${itemTotal.toLocaleString()}`, 490, y + 6, { width: 55, align: "right" });

      y += 20;
      doc
        .moveTo(40, y)
        .lineTo(555, y)
        .lineWidth(0.5)
        .strokeColor("#e2e8f0")
        .stroke();
    }

    // Optical Prescription Specifications Grid (If Order contains Rx)
    const rxItems = order.items.filter((i) => i.prescription);
    if (rxItems.length > 0) {
      y += 15;
      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor("#0f172a")
        .text("OPTICAL PRESCRIPTION SPECIFICATIONS", 40, y);

      y += 15;
      for (const item of rxItems) {
        const rx = item.prescription!;
        doc
          .rect(40, y, 515, 55)
          .fillAndStroke("#f8fafc", "#cbd5e1");

        doc
          .fontSize(8)
          .font("Helvetica-Bold")
          .fillColor("#0f172a")
          .text(`Lens Package: ${rx.lensType}`, 50, y + 8)
          .text(`Pupillary Distance (PD): ${rx.pd} mm`, 350, y + 8, { align: "right" });

        doc
          .font("Helvetica")
          .fillColor("#334155")
          .text(`OD (Right Eye):  SPH: ${rx.odSph.toFixed(2)}  |  CYL: ${rx.odCyl !== null ? rx.odCyl.toFixed(2) : "0.00"}  |  AXIS: ${rx.odAxis ? rx.odAxis + "°" : "-"}`, 50, y + 24)
          .text(`OS (Left Eye):   SPH: ${rx.osSph.toFixed(2)}  |  CYL: ${rx.osCyl !== null ? rx.osCyl.toFixed(2) : "0.00"}  |  AXIS: ${rx.osAxis ? rx.osAxis + "°" : "-"}`, 50, y + 38);

        y += 65;
      }
    }

    // Totals Summary
    y += 10;
    const subtotal = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor("#64748b")
      .text("Subtotal:", 380, y, { width: 80, align: "right" })
      .text(`Rs. ${subtotal.toLocaleString()}`, 470, y, { width: 75, align: "right" });

    y += 14;
    doc
      .text("Shipping Fee:", 380, y, { width: 80, align: "right" })
      .text(`Rs. ${order.shippingFee || 250}`, 470, y, { width: 75, align: "right" });

    y += 16;
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor("#0f172a")
      .text("Grand Total:", 380, y, { width: 80, align: "right" })
      .text(`Rs. ${order.totalAmount.toLocaleString()}`, 470, y, { width: 75, align: "right" });

    // Footer
    doc
      .moveTo(40, 780)
      .lineTo(555, 780)
      .lineWidth(0.5)
      .strokeColor("#cbd5e1")
      .stroke();

    doc
      .fontSize(9)
      .font("Helvetica-Bold")
      .fillColor("#0f172a")
      .text("Thank you for choosing My Eyes.", 40, 790, { align: "center" });

    doc
      .fontSize(7)
      .font("Helvetica")
      .fillColor("#94a3b8")
      .text("Verified Official Electronic Invoice · My Eyes PK", 40, 804, { align: "center" });

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
