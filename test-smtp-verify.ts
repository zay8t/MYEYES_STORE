import { transporter } from "./src/lib/email";

async function verifySMTP() {
  console.log("==================================================");
  console.log("🧪 VERIFYING GMAIL SMTP TRANSPORTER");
  console.log("==================================================");

  try {
    console.log("Verifying connection to Gmail SMTP server...");
    const isReady = await transporter.verify();
    if (isReady) {
      console.log("✅ Gmail SMTP Transporter is READY to send messages!");
    } else {
      console.error("❌ Transporter verify returned false");
    }
  } catch (error) {
    console.error("❌ SMTP Verification Failed:", error);
    process.exit(1);
  }

  console.log("==================================================");
  console.log("🎉 SMTP VERIFICATION COMPLETE 100%!");
  console.log("==================================================");
}

verifySMTP();
