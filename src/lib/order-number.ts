import { Prisma } from "@prisma/client";

/**
 * Generates a permanent, sequential 8-digit order number string (e.g. "00000001", "00000002").
 * Must be called inside a Prisma transaction (tx) to guarantee concurrency safety and atomic increment.
 */
export async function generateNextOrderNumber(
  tx: Prisma.TransactionClient
): Promise<string> {
  const existingSeq = await tx.orderSequence.findUnique({
    where: { id: 1 },
  });

  if (!existingSeq) {
    // Find maximum numeric value among existing assigned order numbers
    const existingOrders = await tx.order.findMany({
      where: { orderNumber: { not: null } },
      select: { orderNumber: true },
    });

    let maxVal = 0;
    for (const ord of existingOrders) {
      if (ord.orderNumber) {
        const num = parseInt(ord.orderNumber, 10);
        if (!isNaN(num) && num > maxVal) {
          maxVal = num;
        }
      }
    }

    const created = await tx.orderSequence.create({
      data: { id: 1, lastValue: maxVal + 1 },
    });
    return String(created.lastValue).padStart(8, "0");
  }

  // Atomic increment within Prisma transaction
  const updated = await tx.orderSequence.update({
    where: { id: 1 },
    data: {
      lastValue: {
        increment: 1,
      },
    },
  });

  // Format as strictly 8 digits padded with zeros (e.g., "00000001")
  return String(updated.lastValue).padStart(8, "0");
}
