"use server";

import { prisma } from "@/lib/prisma";
import { OrderStatus, PaymentStatus, Category, FrameShape, Material } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  sendApprovalNotification,
  sendRejectionNotification,
  sendFlaggedAlert,
} from "@/lib/notifications/paymentAlert";
import {
  revalidateInventory,
  restockOrderItems,
  redeductOrderItems,
} from "@/lib/inventory";
import { sendEmail } from "@/lib/email";
import {
  buildPaymentApprovedEmail,
  buildPaymentRejectionEmail,
  buildOrderDispatchedEmail,
  buildOrderDeliveredEmail,
  buildIncompleteLeadEmail,
} from "@/lib/emailTemplates";

export interface ProductInput {
  name: string;
  slug?: string;
  description: string;
  price: number;
  stock: number;
  frameShape: FrameShape;
  material: Material;
  gender: string;
  images: string[] | string;
  category: Category;
  featured?: boolean;
}

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Non-fatal if invoked outside Next.js request lifecycle
  }
}

export async function updateOrderStatusAction(
  orderId: string,
  status: OrderStatus | string,
  courierName?: string,
  trackingNumber?: string
) {
  try {
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!existingOrder) {
      return { success: false, error: "Order not found" };
    }

    const previousStatus = existingOrder.status;
    const isCancelling =
      (status === OrderStatus.CANCELLED ||
        (status as string) === "CANCELLED" ||
        (status as string) === "REJECTED") &&
      previousStatus !== OrderStatus.CANCELLED;

    const isReopening =
      previousStatus === OrderStatus.CANCELLED &&
      status !== OrderStatus.CANCELLED &&
      (status as string) !== "REJECTED";

    const updatedOrder = await prisma.$transaction(
      async (tx) => {
        if (isCancelling) {
          // Increment stock for all items
          await restockOrderItems(tx, existingOrder.items);

          await tx.paymentAuditLog.create({
            data: {
              orderId,
              action: "RESTOCKED",
              actor: "ADMIN",
              notes: `Stock automatically returned to inventory due to order status transition to ${status}.`,
            },
          });
        } else if (isReopening) {
          // Rededuct stock if order is uncancelled / reopened
          await redeductOrderItems(tx, existingOrder.items);

          await tx.paymentAuditLog.create({
            data: {
              orderId,
              action: "DEDUCTED",
              actor: "ADMIN",
              notes: `Stock re-deducted from inventory due to order reactivation to ${status}.`,
            },
          });
        }

        return await tx.order.update({
          where: { id: orderId },
          data: { status: status as OrderStatus },
          include: {
            items: {
              include: {
                product: true,
                prescription: true,
              },
            },
          },
        });
      },
      { maxWait: 5000, timeout: 15000 }
    );

    // Concurrently dispatch transactional lifecycle email based on new status (non-blocking)
    if (updatedOrder.customerEmail) {
      const normalizedStatus = String(status).toUpperCase();
      const displayId = updatedOrder.orderNumber || updatedOrder.id;

      switch (normalizedStatus) {
        case "VERIFIED":
        case "PROCESSING":
        case "ADVANCE_VERIFIED":
          sendEmail({
            to: updatedOrder.customerEmail,
            subject: `Deposit Confirmed - Order #${displayId} in Lab Production`,
            html: buildPaymentApprovedEmail(updatedOrder),
          }).catch((err) => console.error("[Processing Email Error]:", err));
          break;

        case "DISPATCHED":
        case "SHIPPED":
        case "DISPATCHED_WITH_COURIER":
          sendEmail({
            to: updatedOrder.customerEmail,
            subject: `Order Dispatched #${displayId} - Tracking Details`,
            html: buildOrderDispatchedEmail(updatedOrder, courierName, trackingNumber),
          }).catch((err) => console.error("[Dispatched Email Error]:", err));
          break;

        case "DELIVERED":
          sendEmail({
            to: updatedOrder.customerEmail,
            subject: `Delivered: Order #${displayId} Receipt & Care Guide`,
            html: buildOrderDeliveredEmail(updatedOrder),
          }).catch((err) => console.error("[Delivered Email Error]:", err));
          break;

        default:
          break;
      }
    }

    revalidateInventory();
    safeRevalidatePath("/admin");
    safeRevalidatePath("/admin/orders");
    safeRevalidatePath("/admin/customers");
    safeRevalidatePath(`/admin/orders/${orderId}`);
    return { success: true, order: updatedOrder };
  } catch (error: any) {
    console.error("Error updating order status:", error);
    return { success: false, error: error?.message || "Failed to update order status" };
  }
}

export async function updatePaymentStatusAction(orderId: string, paymentStatus: PaymentStatus | string) {
  try {
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: paymentStatus as PaymentStatus },
    });

    safeRevalidatePath("/admin");
    safeRevalidatePath("/admin/orders");
    safeRevalidatePath("/admin/customers");
    return { success: true, order: updatedOrder };
  } catch (error) {
    console.error("Error updating payment status:", error);
    return { success: false, error: "Failed to update payment status" };
  }
}

export async function updateProductStockAction(productId: string, newStock: number) {
  try {
    const updated = await prisma.product.update({
      where: { id: productId },
      data: { stock: Math.max(0, newStock) },
    });

    revalidateInventory(updated.slug);
    return { success: true, product: updated };
  } catch (error) {
    console.error("Error updating product stock:", error);
    return { success: false, error: "Failed to update stock" };
  }
}

export async function adjustStockDeltaAction(productId: string, delta: number) {
  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return { success: false, error: "Product not found" };

    const newStock = Math.max(0, product.stock + delta);
    const updated = await prisma.product.update({
      where: { id: productId },
      data: { stock: newStock },
    });

    revalidateInventory(updated.slug);
    return { success: true, product: updated };
  } catch (error) {
    console.error("Error adjusting stock delta:", error);
    return { success: false, error: "Failed to adjust stock" };
  }
}

export async function createProductAction(input: ProductInput) {
  try {
    let formattedImages = "";
    if (Array.isArray(input.images)) {
      formattedImages = JSON.stringify(input.images.filter((img) => img.trim() !== ""));
    } else if (typeof input.images === "string") {
      if (input.images.startsWith("[")) {
        formattedImages = input.images;
      } else {
        const splitUrls = input.images
          .split(",")
          .map((url) => url.trim())
          .filter((url) => url.length > 0);
        formattedImages = JSON.stringify(splitUrls);
      }
    }

    const slug =
      input.slug && input.slug.trim() !== ""
        ? input.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")
        : input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now().toString().slice(-4);

    const product = await prisma.product.create({
      data: {
        name: input.name,
        slug,
        description: input.description,
        price: Number(input.price),
        stock: Number(input.stock),
        frameShape: input.frameShape,
        material: input.material,
        gender: input.gender,
        images: formattedImages,
        category: input.category,
        featured: input.featured ?? false,
      },
    });

    revalidateInventory(product.slug);
    return { success: true, product };
  } catch (error) {
    console.error("Error creating product:", error);
    return { success: false, error: "Failed to create product" };
  }
}

export async function updateProductAction(productId: string, input: Partial<ProductInput>) {
  try {
    const updateData: Record<string, unknown> = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.price !== undefined) updateData.price = Number(input.price);
    if (input.stock !== undefined) updateData.stock = Number(input.stock);
    if (input.frameShape !== undefined) updateData.frameShape = input.frameShape;
    if (input.material !== undefined) updateData.material = input.material;
    if (input.gender !== undefined) updateData.gender = input.gender;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.featured !== undefined) updateData.featured = input.featured;

    if (input.images !== undefined) {
      if (Array.isArray(input.images)) {
        updateData.images = JSON.stringify(input.images.filter((img) => img.trim() !== ""));
      } else if (typeof input.images === "string") {
        updateData.images = input.images;
      }
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: updateData,
    });

    revalidateInventory(updated.slug);
    return { success: true, product: updated };
  } catch (error) {
    console.error("Error updating product:", error);
    return { success: false, error: "Failed to update product" };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  PAYMENT VERIFICATION ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Approve a payment: mark as PAID, write audit log, notify customer.
 */
export async function verifyPaymentAction(
  orderId: string,
  adminEmail: string,
  notes?: string
) {
  try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: PaymentStatus.PAID,
        status: OrderStatus.PROCESSING,
        verifiedBy: adminEmail,
        verifiedAt: new Date(),
        customerNotified: false,
      },
      include: {
        items: {
          include: {
            product: true,
            prescription: true,
          },
        },
      },
    });

    await prisma.paymentAuditLog.create({
      data: {
        orderId,
        action: "APPROVED",
        actor: adminEmail,
        notes: notes || "Payment manually verified and approved by admin.",
      },
    });

    // 1. Asynchronously dispatch Approval Email to customer (non-blocking)
    if (order.customerEmail) {
      sendEmail({
        to: order.customerEmail,
        subject: `Advance Deposit Verified for Order #${order.orderNumber || order.id} - MY EYES Optical Studio`,
        html: buildPaymentApprovedEmail(order),
      }).catch((emailErr) => console.error("[Payment Approved Email Error]:", emailErr));
    }

    // 2. Trigger WhatsApp notification
    try {
      await sendApprovalNotification(order);
      await prisma.order.update({
        where: { id: orderId },
        data: { customerNotified: true },
      });
      await prisma.paymentAuditLog.create({
        data: {
          orderId,
          action: "NOTIFIED",
          actor: "SYSTEM",
          notes: "Approval WhatsApp notification sent to customer.",
        },
      });
    } catch (notifErr) {
      console.error("Notification failed (non-fatal):", notifErr);
    }

    revalidateInventory();
    safeRevalidatePath("/admin");
    safeRevalidatePath("/admin/payments");
    safeRevalidatePath("/admin/orders");
    return { success: true, order };
  } catch (error) {
    console.error("verifyPaymentAction error:", error);
    return { success: false, error: "Failed to verify payment" };
  }
}

/**
 * Reject a payment: mark as FAILED, write audit log, notify customer with reason.
 */
export async function rejectPaymentAction(
  orderId: string,
  adminEmail: string,
  reason: string,
  customReason?: string
) {
  try {
    const fullReason =
      customReason && customReason.trim() !== ""
        ? `${reason}: ${customReason.trim()}`
        : reason;

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: PaymentStatus.FAILED,
        verifiedBy: adminEmail,
        verifiedAt: new Date(),
        rejectionReason: fullReason,
        customerNotified: false,
      },
      include: {
        items: {
          include: {
            product: true,
            prescription: true,
          },
        },
      },
    });

    await prisma.paymentAuditLog.create({
      data: {
        orderId,
        action: "REJECTED",
        actor: adminEmail,
        notes: `Rejection reason: ${fullReason}`,
      },
    });

    // 1. Asynchronously dispatch Rejection Email to customer (non-blocking)
    if (order.customerEmail) {
      sendEmail({
        to: order.customerEmail,
        subject: `Payment Verification Issue for Order #${order.orderNumber || order.id} - MY EYES Optical Studio`,
        html: buildPaymentRejectionEmail(order, reason, customReason),
      }).catch((emailErr) => console.error("[Payment Rejection Email Error]:", emailErr));
    }

    // 2. Trigger rejection notification
    try {
      await sendRejectionNotification(order, fullReason);
      await prisma.order.update({
        where: { id: orderId },
        data: { customerNotified: true },
      });
      await prisma.paymentAuditLog.create({
        data: {
          orderId,
          action: "NOTIFIED",
          actor: "SYSTEM",
          notes: "Rejection WhatsApp notification sent to customer with re-upload link.",
        },
      });
    } catch (notifErr) {
      console.error("Rejection notification failed (non-fatal):", notifErr);
    }

    safeRevalidatePath("/admin");
    safeRevalidatePath("/admin/payments");
    safeRevalidatePath("/admin/orders");
    return { success: true, order };
  } catch (error) {
    console.error("rejectPaymentAction error:", error);
    return { success: false, error: "Failed to reject payment" };
  }
}

/**
 * Flag a payment as suspicious for manager review.
 */
export async function flagPaymentAction(
  orderId: string,
  adminEmail: string,
  notes?: string
) {
  try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        flaggedSuspicious: true,
        verifiedBy: adminEmail,
      },
    });

    await prisma.paymentAuditLog.create({
      data: {
        orderId,
        action: "FLAGGED",
        actor: adminEmail,
        notes: notes || "Flagged as suspicious for manager review.",
      },
    });

    await sendFlaggedAlert(order, notes || "No additional notes.");

    safeRevalidatePath("/admin");
    safeRevalidatePath("/admin/payments");
    safeRevalidatePath("/admin/orders");
    return { success: true, order };
  } catch (error) {
    console.error("flagPaymentAction error:", error);
    return { success: false, error: "Failed to flag payment" };
  }
}

export async function deleteProductAction(productId: string) {
  try {
    // Delete associated OrderItem records first to avoid foreign key constraint errors
    await prisma.orderItem.deleteMany({
      where: { productId },
    });

    const deleted = await prisma.product.delete({
      where: { id: productId },
    });

    revalidateInventory(deleted?.slug);
    return { success: true };
  } catch (error) {
    console.error("Error deleting product:", error);
    return { success: false, error: "Failed to delete product" };
  }
}

/**
 * Send an incomplete lead follow-up email to assist with prescription and checkout.
 */
export async function sendIncompleteLeadEmailAction(lead: {
  customerName?: string;
  name?: string;
  email: string;
  mobileNumber?: string;
  whatsapp?: string;
  frameName?: string;
  resumeUrl?: string;
}) {
  if (!lead.email) {
    return { success: false, error: "Lead email is required" };
  }

  try {
    await sendEmail({
      to: lead.email,
      subject: "Need Help Completing Your Eyewear Order? - MY EYES Optical Studio",
      html: buildIncompleteLeadEmail(lead),
    });
    return { success: true };
  } catch (error: any) {
    console.error("sendIncompleteLeadEmailAction error:", error);
    return { success: false, error: error?.message || "Failed to send email" };
  }
}

