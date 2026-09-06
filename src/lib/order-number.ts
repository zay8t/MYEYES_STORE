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

/**
 * Standardizes order identifier into our official 8-digit zero-padded format (e.g., "00000003").
 * Accepts an order object, order number string/number, or fallback hash ID.
 */
export function formatOrderNumber(
  orderOrId?: string | number | { orderNumber?: string | number | null; id?: string | null } | null
): string {
  if (orderOrId === null || orderOrId === undefined) {
    return "00000000";
  }

  // Direct number passed
  if (typeof orderOrId === "number") {
    return String(orderOrId).padStart(8, "0");
  }

  // Direct string passed
  if (typeof orderOrId === "string") {
    const clean = orderOrId.trim();
    if (!clean) return "00000000";
    if (/^\d+$/.test(clean)) {
      return clean.padStart(8, "0");
    }
    return clean;
  }

  // Order object with orderNumber
  if (orderOrId.orderNumber !== null && orderOrId.orderNumber !== undefined) {
    const numStr = String(orderOrId.orderNumber).trim();
    if (/^\d+$/.test(numStr)) {
      return numStr.padStart(8, "0");
    }
    if (numStr) return numStr;
  }

  // Fallback to order object id
  if (orderOrId.id) {
    const idStr = String(orderOrId.id).trim();
    if (/^\d+$/.test(idStr)) {
      return idStr.padStart(8, "0");
    }
    return idStr.slice(0, 8);
  }

  return "00000000";
}
