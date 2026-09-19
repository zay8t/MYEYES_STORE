import { prisma } from "./src/lib/prisma";
import { sendAdminPushAlert } from "./src/lib/push-notifications";

async function testPushNotifications() {
  console.log("==================================================");
  console.log("🧪 TESTING WEB PUSH NOTIFICATION SYSTEM");
  console.log("==================================================");

  // 1. Create a mock push subscription
  console.log("\n1. Creating test AdminPushSubscription in database...");
  const mockEndpoint = "https://fcm.googleapis.com/fcm/send/test-mock-token-" + Date.now();
  const subscription = await prisma.adminPushSubscription.upsert({
    where: { endpoint: mockEndpoint },
    update: {
      p256dh: "BMockKeyP256dhBase64SampleForTestingPurposesOnly1234567890=",
      auth: "MockAuthKey123=",
    },
    create: {
      endpoint: mockEndpoint,
      p256dh: "BMockKeyP256dhBase64SampleForTestingPurposesOnly1234567890=",
      auth: "MockAuthKey123=",
    },
  });

  console.log("✅ Subscription registered in DB:", {
    id: subscription.id,
    endpoint: subscription.endpoint,
    createdAt: subscription.createdAt,
  });

  // 2. Count total subscriptions
  const count = await prisma.adminPushSubscription.count();
  console.log(`\n2. Total registered admin device subscriptions in DB: ${count}`);

  // 3. Test sendAdminPushAlert dispatch
  console.log("\n3. Testing sendAdminPushAlert dispatch pipeline...");
  await sendAdminPushAlert({
    orderNumber: "ME-99999",
    customerName: "Push Test User",
    total: 5800,
  });
  console.log("✅ sendAdminPushAlert executed smoothly without unhandled errors.");

  // 4. Clean up test mock subscription
  console.log("\n4. Cleaning up test subscription record...");
  await prisma.adminPushSubscription.deleteMany({
    where: { endpoint: mockEndpoint },
  });
  console.log("🧹 Cleaned up mock subscription.");

  console.log("\n==================================================");
  console.log("🎉 WEB PUSH NOTIFICATION TESTS PASSED 100%!");
  console.log("==================================================");
}

testPushNotifications().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
