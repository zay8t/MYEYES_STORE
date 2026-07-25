import { Prisma } from "@prisma/client";

/**
 * Generates a permanent, sequential 8-digit order number string (e.g. "00000001", "00000002").
 * Must be called inside a Prisma transaction (tx) to guarantee concurrency safety and atomic increment.
 */
export async function generateNextOrderNumber(
  tx: Prisma.TransactionClient
): Promise<string> {
  // 1. Find or create the sequence record
  let seqRecord = await tx.orderSequence.findUnique({
    where: { id: 1 },
  });

  if (!seqRecord) {
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

    seqRecord = await tx.orderSequence.create({
      data: { id: 1, seq: maxVal },
    });
  }

  const nextSeq = seqRecord.seq + 1;

  // 2. Update sequence record
  await tx.orderSequence.update({
    where: { id: 1 },
    data: { seq: nextSeq },
  });

  // 3. Format as strictly 8 digits padded with zeros (e.g., "00000001")
  return String(nextSeq).padStart(8, "0");
}
