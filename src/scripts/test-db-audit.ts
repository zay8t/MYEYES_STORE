import { prisma } from "../lib/prisma";

async function runAudit() {
  console.log("=================================================");
  console.log("🔍 FULL-STACK POSTGRESQL DATABASE AUDIT IN PROGRESS");
  console.log("=================================================");
  const startTime = Date.now();

  const audit = async (name: string, fn: () => Promise<number>) => {
    const t0 = Date.now();
    try {
      const count = await fn();
      const ms = Date.now() - t0;
      console.log(`✅ [${name.padEnd(20)}] Connected | ${count} records | ${ms}ms`);
      return { name, status: "OK", count, ms };
    } catch (err: unknown) {
      const ms = Date.now() - t0;
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`❌ [${name.padEnd(20)}] FAILED    | Error: ${errorMsg} | ${ms}ms`);
      return { name, status: "FAIL", count: 0, ms, error: errorMsg };
    }
  };

  const tasks: Array<{ name: string; fn: () => Promise<number> }> = [
    { name: "User", fn: () => prisma.user.count() },
    { name: "Product", fn: () => prisma.product.count() },
    { name: "Order", fn: () => prisma.order.count() },
    { name: "OrderItem", fn: () => prisma.orderItem.count() },
    { name: "Prescription", fn: () => prisma.prescription.count() },
    { name: "CartItem", fn: () => prisma.cartItem.count() },
    { name: "WishlistItem", fn: () => prisma.wishlistItem.count() },
    { name: "SavedPrescription", fn: () => prisma.savedPrescription.count() },
    { name: "Address", fn: () => prisma.address.count() },
    { name: "PaymentAuditLog", fn: () => prisma.paymentAuditLog.count() },
    { name: "LensOption", fn: () => prisma.lensOption.count() },
    { name: "OrderSequence", fn: () => prisma.orderSequence.count() },
    { name: "LensPrice", fn: () => prisma.lensPrice.count() },
    { name: "Lead", fn: () => prisma.lead.count() },
    { name: "BasePriceSetting", fn: () => prisma.basePriceSetting.count() },
  ];

  const results = [];
  for (const task of tasks) {
    const res = await audit(task.name, task.fn);
    results.push(res);
  }

  const totalTime = Date.now() - startTime;
  const passed = results.filter((r) => r.status === "OK").length;
  const failed = results.filter((r) => r.status === "FAIL").length;

  console.log("=================================================");
  console.log(`📊 SUMMARY: ${passed}/${results.length} Tables Connected (${failed} Failed)`);
  console.log(`⏱️ Total Audit Execution Time: ${totalTime}ms`);
  console.log("=================================================");

  await prisma.$disconnect();
}

runAudit().catch(console.error);
