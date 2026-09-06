import nodemailer from "nodemailer";

/**
 * Singleton Nodemailer Transporter configured for official Gmail SMTP.
 */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER || "myeyes2026@gmail.com",
    pass: process.env.GMAIL_APP_PASSWORD || "jzrftsddidvaokmu",
  },
});

export interface SendEmailPayload {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: unknown;
}

/**
 * Dispatches an automated transactional email asynchronously.
 */
export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: SendEmailPayload): Promise<SendEmailResult> {
  const fromAddress = process.env.GMAIL_USER || "myeyes2026@gmail.com";

  try {
    const info = await transporter.sendMail({
      from: `"MY EYES Optical Studio" <${fromAddress}>`,
      to,
      replyTo: replyTo || fromAddress,
      subject,
      html,
    });

    console.log(`[Email Dispatched] Message ID: ${info.messageId} -> To: ${to}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Dispatch Error] Failed to send email to ${to}:`, error);
    return { success: false, error };
  }
}
