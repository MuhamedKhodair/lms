/**
 * Email abstraction layer.
 * Dev: logs to console. Production: swap `send` with nodemailer/Resend/SES/etc.
 */

export interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

async function sendDev({ to, subject, text }: MailOptions) {
  console.log("--- EMAIL (dev) ---");
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body:\n${text}`);
  console.log("-------------------");
}

export async function sendEmail(options: MailOptions): Promise<void> {
  if (process.env.NODE_ENV === "development") {
    await sendDev(options);
    return;
  }
  await sendDev(options);
}
