import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting backfill for Order orderNumbers...");

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "asc" },
  });

  console.log(`Found ${orders.length} total orders in database.`);

  let assignedCount = 0;
  let maxSeq = 0;

  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    let orderNumber = order.orderNumber;

    if (!orderNumber) {
      const seq = i + 1;
      orderNumber = String(seq).padStart(8, "0");
      await prisma.order.update({
        where: { id: order.id },
        data: { orderNumber },
      });
      console.log(`Assigned order #${order.id} -> orderNumber: "${orderNumber}"`);
      assignedCount++;
    }

    const num = parseInt(orderNumber, 10);
    if (!isNaN(num) && num > maxSeq) {
      maxSeq = num;
    }
  }

  // Update or create OrderSequence with highest assigned sequence
  await prisma.orderSequence.upsert({
    where: { id: 1 },
    update: { seq: maxSeq },
    create: { id: 1, seq: maxSeq },
  });

  console.log(`Backfill complete! Assigned ${assignedCount} order numbers. High water mark: ${maxSeq}`);
}

main()
  .catch((e) => {
    console.error("Backfill failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
