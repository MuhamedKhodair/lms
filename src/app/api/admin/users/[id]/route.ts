import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/utils";
import { z } from "zod/v4";

const updateRoleSchema = z.object({
  role: z.enum(["ADMIN", "INSTRUCTOR", "STUDENT"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser(request);
    if (!user || user.role !== "ADMIN") return apiError("Forbidden", 403);

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return apiError("User not found", 404);

    const body = await request.json();
    const parsed = updateRoleSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues.map((i) => i.message).join(", "));
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role: parsed.data.role },
      select: { id: true, name: true, email: true, role: true },
    });

    return apiSuccess(updated);
  } catch (error) {
    console.error("Admin user PATCH error:", error);
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser(request);
    if (!user || user.role !== "ADMIN") return apiError("Forbidden", 403);
    if (user.id === id) return apiError("You cannot delete your own account", 400);

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return apiError("User not found", 404);

    await prisma.user.delete({ where: { id } });
    return apiSuccess({ message: "User deleted" });
  } catch (error) {
    console.error("Admin user DELETE error:", error);
    return apiError("Internal server error", 500);
  }
}
