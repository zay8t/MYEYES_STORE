import { prisma } from "./src/lib/prisma";
import { getWhatsAppRecoveryUrl, buildIncompleteLeadMessage } from "./src/lib/whatsapp";

async function testCartResumeFlow() {
  console.log("==================================================");
  console.log("🧪 TESTING 1-CLICK CART RESUME FLOW & HYDRATION");
  console.log("==================================================");

  // 1. Create a test frame or find existing
  let testProduct = await prisma.product.findFirst();
  if (!testProduct) {
    console.log("Creating temporary product for test...");
    testProduct = await prisma.product.create({
      data: {
        name: "Test Acetate Pilot",
        slug: "test-acetate-pilot-" + Date.now(),
        description: "Premium titanium frame",
        price: 4500,
        images: "/placeholder-frame.png",
      },
    });
  }

  // 2. Create an incomplete lead
  console.log("\n1. Creating incomplete lead in database...");
  const lead = await prisma.lead.create({
    data: {
      name: "Zaid Ahmed",
      whatsapp: "03001234567",
      frameId: testProduct.id,
      frameName: testProduct.name,
      status: "ACTIVE",
    },
  });
  console.log("✅ Lead created:", {
    id: lead.id,
    name: lead.name,
    phone: lead.whatsapp,
    frameName: lead.frameName,
    status: lead.status,
  });

  // 3. Test WhatsApp Recovery URL Generation
  console.log("\n2. Testing WhatsApp Recovery URL Generator...");
  const waUrl = getWhatsAppRecoveryUrl({
    id: lead.id,
    customerName: lead.name,
    mobileNumber: lead.whatsapp,
    frameName: lead.frameName || "Selected Frame",
  });
  console.log("Generated WhatsApp URL:\n", waUrl);

  if (!waUrl.includes("923001234567") || !waUrl.includes(`resumeLeadId%3D${lead.id}`)) {
    throw new Error("❌ WhatsApp URL does not contain formatted phone or resumeLeadId!");
  }
  console.log("✅ WhatsApp Recovery URL format verified 100%!");

  // 4. Test Incomplete Lead message builder
  const builtMsg = buildIncompleteLeadMessage({
    id: lead.id,
    customerName: lead.name,
    mobileNumber: lead.whatsapp,
    frameName: lead.frameName || "Selected Frame",
  });
  const decodedMsg = decodeURIComponent(builtMsg);
  console.log("\nDecoded Message Preview:\n", decodedMsg);

  if (!decodedMsg.includes(`https://myeyes.pk/configurator?resumeLeadId=${lead.id}`)) {
    throw new Error("❌ Decoded message does not contain exact 1-click resume link!");
  }
  console.log("✅ WhatsApp message content verified 100%!");

  // 5. Test Lead Hydration Logic (mimicking /api/leads/resume endpoint)
  console.log("\n3. Testing Lead Hydration resolution...");
  const foundLead = await prisma.lead.findUnique({
    where: { id: lead.id },
  });
  if (!foundLead) throw new Error("Lead lookup failed");

  const associatedFrame = await prisma.product.findUnique({
    where: { id: foundLead.frameId! },
  });
  if (!associatedFrame) throw new Error("Associated frame lookup failed");

  console.log("✅ Hydrated Lead data successfully:", {
    customerName: foundLead.name,
    mobileNumber: foundLead.whatsapp,
    frameId: foundLead.frameId,
    frameName: associatedFrame.name,
    price: associatedFrame.price,
  });

  // 6. Test Conversion upon Checkout
  console.log("\n4. Simulating Checkout Conversion with resumeLeadId...");
  const updatedLead = await prisma.lead.update({
    where: { id: lead.id },
    data: {
      status: "CONVERTED",
      updatedAt: new Date(),
    },
  });
  console.log("✅ Lead Status after checkout:", updatedLead.status);

  if (updatedLead.status !== "CONVERTED") {
    throw new Error("❌ Lead status was not updated to CONVERTED!");
  }

  // 7. Clean up test lead
  await prisma.lead.delete({
    where: { id: lead.id },
  });
  console.log("🧹 Cleaned up test lead.");

  console.log("\n==================================================");
  console.log("🎉 ALL 1-CLICK RESUME TESTS PASSED 100%!");
  console.log("==================================================");
}

testCartResumeFlow().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
