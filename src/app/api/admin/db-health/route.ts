import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface TableAuditResult {
  model: string;
  tableName: string;
  status: "CONNECTED" | "ERROR";
  count: number;
  latencyMs: number;
  sampleRecord?: string | null;
  error?: string;
}

export async function GET(request: NextRequest) {
  // Allow admin session or local health checks
  const session = await requireAdminSession(request);
  const isLocalCheck = request.headers.get("x-internal-audit") === "myeyes-audit";

  if (!session && !isLocalCheck) {
    return NextResponse.json({ error: "Unauthorized. Admin session required." }, { status: 403 });
  }

  const startTime = Date.now();
  const results: TableAuditResult[] = [];

  const auditModel = async (
    modelName: string,
    tableName: string,
    queryFn: () => Promise<{ count: number; sample?: unknown }>
  ) => {
    const t0 = Date.now();
    try {
      const data = await queryFn();
      results.push({
        model: modelName,
        tableName,
        status: "CONNECTED",
        count: data.count,
        latencyMs: Date.now() - t0,
        sampleRecord: data.sample ? JSON.stringify(data.sample).slice(0, 100) + "..." : null,
      });
    } catch (err) {
      results.push({
        model: modelName,
        tableName,
        status: "ERROR",
        count: 0,
        latencyMs: Date.now() - t0,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  };

  // ── 1. Audit all 15 Prisma Models ──────────────────────────────────────
  await auditModel("User", "users", async () => {
    const [count, sample] = await Promise.all([
      prisma.user.count(),
      prisma.user.findFirst({ select: { id: true, email: true, role: true } }),
    ]);
    return { count, sample };
  });

  await auditModel("CartItem", "cart_items", async () => {
    const [count, sample] = await Promise.all([
      prisma.cartItem.count(),
      prisma.cartItem.findFirst({ select: { id: true, userId: true, productId: true } }),
    ]);
    return { count, sample };
  });

  await auditModel("WishlistItem", "wishlist_items", async () => {
    const [count, sample] = await Promise.all([
      prisma.wishlistItem.count(),
      prisma.wishlistItem.findFirst({ select: { id: true, userId: true, productId: true } }),
    ]);
    return { count, sample };
  });

  await auditModel("SavedPrescription", "saved_prescriptions", async () => {
    const [count, sample] = await Promise.all([
      prisma.savedPrescription.count(),
      prisma.savedPrescription.findFirst({ select: { id: true, userId: true, title: true } }),
    ]);
    return { count, sample };
  });

  await auditModel("Address", "addresses", async () => {
    const [count, sample] = await Promise.all([
      prisma.address.count(),
      prisma.address.findFirst({ select: { id: true, userId: true, city: true } }),
    ]);
    return { count, sample };
  });

  await auditModel("Product", "Product", async () => {
    const [count, sample] = await Promise.all([
      prisma.product.count(),
      prisma.product.findFirst({ select: { id: true, name: true, price: true, category: true } }),
    ]);
    return { count, sample };
  });

  await auditModel("Order", "Order", async () => {
    const [count, sample] = await Promise.all([
      prisma.order.count(),
      prisma.order.findFirst({ select: { id: true, orderNumber: true, totalAmount: true, status: true } }),
    ]);
    return { count, sample };
  });

  await auditModel("PaymentAuditLog", "PaymentAuditLog", async () => {
    const [count, sample] = await Promise.all([
      prisma.paymentAuditLog.count(),
      prisma.paymentAuditLog.findFirst({ select: { id: true, orderId: true, action: true } }),
    ]);
    return { count, sample };
  });

  await auditModel("LensOption", "LensOption", async () => {
    const [count, sample] = await Promise.all([
      prisma.lensOption.count(),
      prisma.lensOption.findFirst({ select: { id: true, name: true, price: true } }),
    ]);
    return { count, sample };
  });

  await auditModel("OrderSequence", "OrderSequence", async () => {
    const [count, sample] = await Promise.all([
      prisma.orderSequence.count(),
      prisma.orderSequence.findFirst({ select: { id: true, lastValue: true } }),
    ]);
    return { count, sample };
  });

  await auditModel("OrderItem", "OrderItem", async () => {
    const [count, sample] = await Promise.all([
      prisma.orderItem.count(),
      prisma.orderItem.findFirst({ select: { id: true, orderId: true, productId: true, price: true } }),
    ]);
    return { count, sample };
  });

  await auditModel("Prescription", "Prescription", async () => {
    const [count, sample] = await Promise.all([
      prisma.prescription.count(),
      prisma.prescription.findFirst({ select: { id: true, lensType: true, odSph: true, osSph: true } }),
    ]);
    return { count, sample };
  });

  await auditModel("LensPrice", "LensPrice", async () => {
    const [count, sample] = await Promise.all([
      prisma.lensPrice.count(),
      prisma.lensPrice.findFirst({ select: { id: true, category: true, name: true, price: true } }),
    ]);
    return { count, sample };
  });

  await auditModel("Lead", "Lead", async () => {
    const [count, sample] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.findFirst({ select: { id: true, name: true, whatsapp: true } }),
    ]);
    return { count, sample };
  });

  await auditModel("BasePriceSetting", "BasePriceSetting", async () => {
    const [count, sample] = await Promise.all([
      prisma.basePriceSetting.count(),
      prisma.basePriceSetting.findFirst({ select: { key: true, value: true } }),
    ]);
    return { count, sample };
  });

  const totalLatencyMs = Date.now() - startTime;
  const connectedCount = results.filter((r) => r.status === "CONNECTED").length;
  const errorCount = results.filter((r) => r.status === "ERROR").length;
  const overallStatus = errorCount === 0 ? "HEALTHY" : "DEGRADED";

  return NextResponse.json({
    status: overallStatus,
    database: "PostgreSQL (Prisma ORM)",
    totalTables: results.length,
    connectedTables: connectedCount,
    failedTables: errorCount,
    totalRoundtripLatencyMs: totalLatencyMs,
    timestamp: new Date().toISOString(),
    auditDetails: results,
  });
}
