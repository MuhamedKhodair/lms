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
  // Production: plug in your provider here (nodemailer, Resend, Postmark...)
  await sendDev(options);
}

export function passwordResetEmail(name: string, url: string): MailOptions {
  return {
    to: "",
    subject: "Reset your password",
    text: `Hi ${name},\n\nYou requested a password reset. Click the link below to set a new password (valid for 1 hour):\n\n${url}\n\nIf you didn't request this, ignore this email.`,
    html: `<p>Hi ${name},</p><p>You requested a password reset. Click the link below to set a new password (valid for 1 hour):</p><p><a href="${url}">${url}</a></p><p>If you didn't request this, ignore this email.</p>`,
  };
}

export function welcomeEmail(name: string): MailOptions {
  return {
    to: "",
    subject: "Welcome to LMS!",
    text: `Hi ${name},\n\nWelcome to LMS! Your account has been created. Start exploring courses and begin learning today.`,
    html: `<p>Hi ${name},</p><p>Welcome to LMS! Your account has been created. Start exploring courses and begin learning today.</p>`,
  };
}

export function enrollmentEmail(name: string, courseTitle: string): MailOptions {
  return {
    to: "",
    subject: `You're enrolled in ${courseTitle}`,
    text: `Hi ${name},\n\nYou've successfully enrolled in "${courseTitle}". Visit your dashboard to start learning.`,
    html: `<p>Hi ${name},</p><p>You've successfully enrolled in "<strong>${courseTitle}</strong>". Visit your dashboard to start learning.</p>`,
  };
}
