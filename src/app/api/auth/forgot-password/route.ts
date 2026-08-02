import { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/utils";
import { rateLimit, clientKey, rateLimitResponse } from "@/lib/rate-limit";
import { sendEmail, passwordResetEmail } from "@/lib/email";
import { z } from "zod/v4";

const forgotSchema = z.object({
  email: z.email(),
});

export async function POST(request: NextRequest) {
  try {
    const rl = rateLimit(clientKey(request, "forgot-password"), { limit: 4, windowMs: 300_000 });
    if (!rl.success) return rateLimitResponse(rl);

    const body = await request.json();
    const parsed = forgotSchema.safeParse(body);
    if (!parsed.success) return apiError("Invalid email address");

    const { email } = parsed.data;

    // Always respond with success to avoid leaking whether the email exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return apiSuccess({ message: "If that email exists, a reset link has been sent." });
    }

    // Invalidate any existing unused tokens
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;
    const mail = passwordResetEmail(user.name, resetUrl);
    await sendEmail({ ...mail, to: user.email });

    return apiSuccess({ message: "If that email exists, a reset link has been sent." });
  } catch (error) {
    console.error("Forgot password error:", error);
    return apiError("Internal server error", 500);
  }
}
