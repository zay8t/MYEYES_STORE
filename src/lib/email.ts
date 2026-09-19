import nodemailer from "nodemailer";
import { Resend } from "resend";

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
 * Configures Nodemailer Transporter for Gmail SMTP using runtime environment variables.
 */
export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || process.env.GMAIL_USER || "myeyes2026@gmail.com",
    pass: process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD,
  },
});

const resendApiKey = process.env.RESEND_API_KEY;
const resendClient = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * Dispatches an automated transactional email asynchronously via Resend with SMTP fallback.
 */
export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: SendEmailPayload): Promise<SendEmailResult> {
  const fromAddress =
    process.env.EMAIL_USER || process.env.GMAIL_USER || "myeyes2026@gmail.com";

  // 1. Try Resend first if API key is configured
  if (resendClient) {
    try {
      const { data, error } = await resendClient.emails.send({
        from: "My Eyes <onboarding@resend.dev>",
        to: [to],
        replyTo: replyTo || fromAddress,
        subject,
        html,
      });

      if (!error && data?.id) {
        console.log(`[Email Dispatched via Resend] ID: ${data.id} -> To: ${to}`);
        return { success: true, messageId: data.id };
      }
      if (error) {
        console.warn("[Resend Notice] Falling back to SMTP:", error);
      }
    } catch (resendErr) {
      console.warn("[Resend Error] Falling back to SMTP:", resendErr);
    }
  }

  // 2. Fallback to Nodemailer SMTP
  try {
    const info = await transporter.sendMail({
      from: `"MY EYES Optical Studio" <${fromAddress}>`,
      to,
      replyTo: replyTo || fromAddress,
      subject,
      html,
    });

    console.log(`[Email Dispatched via SMTP] Message ID: ${info.messageId} -> To: ${to}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Dispatch Error] Failed to send email to ${to}:`, error);
    return { success: false, error };
  }
}


