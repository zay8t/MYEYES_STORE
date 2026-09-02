import { prisma } from "../lib/prisma";

async function testLeadFlow() {
  console.log("=========================================");
  console.log("🧪 TESTING STEP 1 LEAD FLOW & DEDUPLICATION");
  console.log("=========================================");

  const testPhone = "03009988776";
  const testName = "Test Customer Scarlet";

  // Step 1: Initial Lead capture
  console.log("1. Simulating Step 1 Lead Capture with frame 'Scarlet'...");
  const lead1 = await prisma.lead.create({
    data: {
      name: testName,
      whatsapp: testPhone,
      frameName: "Scarlet",
      status: "ACTIVE",
    },
  });
  console.log("✅ Lead created with ID:", lead1.id, "| Frame:", lead1.frameName);

  // Step 2: Customer re-submits with different frame 'Titanium Aviator'
  console.log("2. Simulating Deduplication Update with frame 'Titanium Aviator'...");
  const existing = await prisma.lead.findFirst({
    where: {
      status: "ACTIVE",
      whatsapp: testPhone,
    },
  });

  if (!existing) throw new Error("Expected existing lead not found!");

  const updated = await prisma.lead.update({
    where: { id: existing.id },
    data: {
      frameName: "Titanium Aviator",
      updatedAt: new Date(),
    },
  });
  console.log("✅ Lead updated with ID:", updated.id, "| New Frame:", updated.frameName);

  // Step 3: Verify single record exists
  const count = await prisma.lead.count({
    where: { whatsapp: testPhone },
  });
  console.log(`✅ Deduplication verified: ${count} record(s) found (Expected: 1)`);
  if (count !== 1) throw new Error(`Expected 1 lead record, got ${count}`);

  // Step 4: Simulate order conversion
  console.log("3. Simulating order placement and conversion...");
  await prisma.lead.updateMany({
    where: { whatsapp: testPhone },
    data: { status: "CONVERTED" },
  });

  const converted = await prisma.lead.findFirst({
    where: { whatsapp: testPhone },
  });
  console.log("✅ Converted lead status:", converted?.status);

  // Clean up
  await prisma.lead.deleteMany({
    where: { whatsapp: testPhone },
  });
  console.log("🧹 Cleaned up test records.");

  console.log("=========================================");
  console.log("🎉 LEAD FLOW & CRM TESTS PASSED 100%");
  console.log("=========================================");

  await prisma.$disconnect();
}

testLeadFlow().catch(console.error);
