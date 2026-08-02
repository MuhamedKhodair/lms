import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/utils";
import { rateLimit, clientKey, rateLimitResponse } from "@/lib/rate-limit";
import { z } from "zod/v4";

const resetSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const rl = rateLimit(clientKey(request, "reset-password"), { limit: 6, windowMs: 300_000 });
    if (!rl.success) return rateLimitResponse(rl);

    const body = await request.json();
    const parsed = resetSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues.map((i) => i.message).join(", "));
    }

    const { token, newPassword } = parsed.data;

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      return apiError("Invalid or expired reset token", 400);
    }

    const passwordHash = await hashPassword(newPassword);

    await Promise.all([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return apiSuccess({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    return apiError("Internal server error", 500);
  }
}
