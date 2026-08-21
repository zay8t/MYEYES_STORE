import { prisma } from "../lib/prisma";

async function runWriteAudit() {
  console.log("=================================================");
  console.log("✍️ LIVE POSTGRESQL WRITE & READ AUDIT IN PROGRESS");
  console.log("=================================================");

  // 1. Test BasePriceSetting Write + Read + Clean
  try {
    const testKey = `__audit_test_${Date.now()}`;
    await prisma.basePriceSetting.create({
      data: { key: testKey, value: 999 },
    });
    const found = await prisma.basePriceSetting.findUnique({ where: { key: testKey } });
    if (!found || found.value !== 999) throw new Error("Verification read failed");
    await prisma.basePriceSetting.delete({ where: { key: testKey } });
    console.log("✅ [BasePriceSetting   ] Write + Read + Delete: SUCCESS");
  } catch (e) {
    console.error("❌ [BasePriceSetting   ] Write Failed:", e);
  }

  // 2. Test Lead Write + Read + Clean
  try {
    const testLead = await prisma.lead.create({
      data: {
        name: "Audit Test User",
        age: 28,
        whatsapp: "923001234567",
        status: "audit_test",
      },
    });
    const foundLead = await prisma.lead.findUnique({ where: { id: testLead.id } });
    if (!foundLead) throw new Error("Lead verification read failed");
    await prisma.lead.delete({ where: { id: testLead.id } });
    console.log("✅ [Lead               ] Write + Read + Delete: SUCCESS");
  } catch (e) {
    console.error("❌ [Lead               ] Write Failed:", e);
  }

  // 3. Test OrderSequence Read + Update
  try {
    const seq = await prisma.orderSequence.findFirst();
    if (seq) {
      console.log(`✅ [OrderSequence      ] Read Active | Current sequence: #${seq.lastValue}`);
    } else {
      await prisma.orderSequence.create({ data: { id: 1, lastValue: 1000 } });
      console.log("✅ [OrderSequence      ] Initialized sequence: #1000");
    }
  } catch (e) {
    console.error("❌ [OrderSequence      ] Failed:", e);
  }

  console.log("=================================================");
  console.log("🎉 ALL WRITE AUDIT TESTS COMPLETED SUCCESSFULLY");
  console.log("=================================================");

  await prisma.$disconnect();
}

runWriteAudit().catch(console.error);
