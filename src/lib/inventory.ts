import { revalidatePath, revalidateTag } from "next/cache";
import { Prisma } from "@prisma/client";

/**
 * Revalidate all inventory, catalog, and dashboard cache paths & tags.
 */
export function revalidateInventory(slug?: string | null) {
  try {
    revalidatePath("/admin");
    revalidatePath("/admin/overview");
    revalidatePath("/admin/inventory");
    revalidatePath("/admin/stock");
    revalidatePath("/admin/products");
    revalidatePath("/admin/orders");
    revalidatePath("/admin/customers");
    revalidatePath("/catalog");
    revalidatePath("/products");
    revalidatePath("/collections");
    revalidatePath("/eyeglasses");
    revalidatePath("/sunglasses");
    revalidatePath("/men");
    revalidatePath("/women");
    revalidatePath("/kids");
    revalidatePath("/");
    if (slug) {
      revalidatePath(`/products/${slug}`);
      revalidatePath(`/eyeglasses/${slug}`);
      revalidatePath(`/catalogue/${slug}`);
    }
    revalidateTag("stock-inventory");
    revalidateTag("products");
  } catch (error) {
    // Non-fatal if invoked in an environment where Next.js cache revalidation context is unavailable
    console.warn("[revalidateInventory] Cache revalidation notice:", error);
  }
}

export interface OrderItemStockTarget {
  productId: string;
  quantity: number;
  name?: string;
}

/**
 * Atomically verifies stock levels and deducts purchased quantities from Product inventory.
 * Throws an Error if stock is insufficient to prevent overselling.
 */
export async function deductStockForOrder(
  tx: Prisma.TransactionClient,
  items: OrderItemStockTarget[]
): Promise<void> {
  for (const item of items) {
    const pId = item.productId.trim();
    if (!pId) continue;

    const quantity = Math.max(1, Math.floor(item.quantity || 1));

    // Check available inventory within the same transaction
    const product = await tx.product.findUnique({
      where: { id: pId },
      select: { id: true, name: true, stock: true },
    });

    if (!product) {
      throw new Error(`Product not found: ${item.name || pId}`);
    }

    if (product.stock < quantity) {
      throw new Error(
        `Insufficient stock for "${product.name}". Requested: ${quantity}, Available: ${product.stock}.`
      );
    }

    // Atomic decrement
    await tx.product.update({
      where: { id: pId },
      data: {
        stock: {
          decrement: quantity,
        },
      },
    });
  }
}

/**
 * Restores product stock levels when an order is cancelled or rejected.
 */
export async function restockOrderItems(
  tx: Prisma.TransactionClient,
  orderOrItems: string | { productId: string; quantity: number }[]
): Promise<void> {
  let itemsToRestock: { productId: string; quantity: number }[] = [];

  if (Array.isArray(orderOrItems)) {
    itemsToRestock = orderOrItems;
  } else {
    const order = await tx.order.findUnique({
      where: { id: orderOrItems },
      include: {
        items: {
          select: {
            productId: true,
            quantity: true,
          },
        },
      },
    });
    if (order?.items) {
      itemsToRestock = order.items;
    }
  }

  for (const item of itemsToRestock) {
    if (item.productId) {
      const quantity = Math.max(1, Math.floor(item.quantity || 1));
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            increment: quantity,
          },
        },
      });
    }
  }
}

/**
 * Re-deducts product stock if a previously cancelled order is restored/reopened.
 */
export async function redeductOrderItems(
  tx: Prisma.TransactionClient,
  orderOrItems: string | { productId: string; quantity: number }[]
): Promise<void> {
  let itemsToRededuct: { productId: string; quantity: number }[] = [];

  if (Array.isArray(orderOrItems)) {
    itemsToRededuct = orderOrItems;
  } else {
    const order = await tx.order.findUnique({
      where: { id: orderOrItems },
      include: {
        items: {
          select: {
            productId: true,
            quantity: true,
          },
        },
      },
    });
    if (order?.items) {
      itemsToRededuct = order.items;
    }
  }

  // First verify all items have enough stock
  for (const item of itemsToRededuct) {
    if (item.productId) {
      const quantity = Math.max(1, Math.floor(item.quantity || 1));
      const product = await tx.product.findUnique({
        where: { id: item.productId },
        select: { name: true, stock: true },
      });

      if (product && product.stock < quantity) {
        throw new Error(
          `Cannot reopen Order: Insufficient stock for "${product.name}". Available: ${product.stock}, Required: ${quantity}.`
        );
      }
    }
  }

  // Then decrement
  for (const item of itemsToRededuct) {
    if (item.productId) {
      const quantity = Math.max(1, Math.floor(item.quantity || 1));
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: quantity,
          },
        },
      });
    }
  }
}
