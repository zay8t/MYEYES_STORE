import webPush from "web-push";
import { prisma } from "@/lib/prisma";

const vapidSubject = process.env.VAPID_SUBJECT || "mailto:myeyes2026@gmail.com";
const vapidPublicKey =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BAOdRnhNF4JiNQPJe4VK0KNGdvQX0qzsnrX2AVEEtU_n_izAYJe6I1MRWlhZVqzuiolwZhyCC8YhpJx7VxMqGJI";
const vapidPrivateKey =
  process.env.VAPID_PRIVATE_KEY || "YkBhPOXs8pdWqf63Rq_Zs7NWlqA545PKdxbIXA-NU2s";

if (vapidSubject && vapidPublicKey && vapidPrivateKey) {
  try {
    webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  } catch (err) {
    console.warn("VAPID details setup warning:", err);
  }
}

export interface AdminPushAlertOrder {
  orderNumber?: string | null;
  customerName?: string | null;
  total?: number | null;
  totalAmount?: number | null;
  paymentMethod?: string | null;
}

export async function sendAdminPushAlert(order: AdminPushAlertOrder) {
  try {
    const subscriptions = await prisma.adminPushSubscription.findMany();
    if (!subscriptions || subscriptions.length === 0) {
      return;
    }

    const orderNum = order.orderNumber || "NEW";
    const custName = order.customerName || "Customer";
    const amount = Number(order.total ?? order.totalAmount ?? 0);

    const payload = JSON.stringify({
      title: "👓 New Order Received!",
      body: `Order #${orderNum} by ${custName} — Rs. ${amount.toLocaleString()}`,
      url: `/admin/orders`,
    });

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webPush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            payload
          );
        } catch (err: unknown) {
          const status = (err as { statusCode?: number })?.statusCode;
          // Clean up expired or revoked browser subscriptions (410 Gone / 404 Not Found)
          if (status === 410 || status === 404) {
            await prisma.adminPushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
          }
        }
      })
    );
  } catch (error) {
    console.error("Failed to dispatch admin push alerts:", error);
  }
}
