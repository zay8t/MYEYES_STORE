import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOrderConfirmationEmail(orderData: {
  email: string;
  orderNumber: string;
  total: number;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: "My Eyes <onboarding@resend.dev>",
      to: [orderData.email],
      subject: `Order Confirmation #${orderData.orderNumber} - My Eyes`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
          <h2 style="color: #111;">Order Confirmed! 🎉</h2>
          <p>Thank you for your order. We are getting your eyewear ready.</p>
          <p><strong>Order Number:</strong> #${orderData.orderNumber}</p>
          <p><strong>Total Amount:</strong> Rs. ${orderData.total.toLocaleString()}</p>
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
          <p style="color: #666; font-size: 12px; margin: 0 0 6px 0;">
            Support: <a href="mailto:myeyes2026@gmail.com" style="color: #111; text-decoration: underline;">myeyes2026@gmail.com</a> &bull; WhatsApp: <a href="https://wa.me/923390103262" style="color: #111; text-decoration: underline;">+92 339 0103262</a>
          </p>
          <p style="color: #999; font-size: 11px; margin: 0;">If you have any questions, reply directly to this email or reach us on WhatsApp.</p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error };
    }

    console.log("Email successfully sent via Resend:", data?.id);
    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error("Email dispatch crashed:", err);
    return { success: false, error: err };
  }
}
