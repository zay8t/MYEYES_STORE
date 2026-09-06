import nodemailer from "nodemailer";

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
function getTransporter() {
  const user = process.env.GMAIL_USER || "myeyes2026@gmail.com";
  const pass = process.env.GMAIL_APP_PASSWORD || "jzrftsddidvaokmu";

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });
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
    const transporter = getTransporter();
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

