import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/utils";
import { z } from "zod/v4";

const updateSchema = z.object({ read: z.boolean().optional() });

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser(request);
    if (!user) return apiError("Unauthorized", 401);

    const notif = await prisma.notification.findUnique({ where: { id } });
    if (!notif) return apiError("Notification not found", 404);
    if (notif.userId !== user.id && user.role !== "ADMIN") {
      return apiError("Forbidden", 403);
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues.map((i) => i.message).join(", "));
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: parsed.data,
    });

    return apiSuccess(updated);
  } catch (error) {
    console.error("Notification PUT error:", error);
    return apiError("Internal server error", 500);
  }
}
