import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser(request);
    if (!user) return apiError("Unauthorized", 401);

    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) return apiError("Notification not found", 404);
    if (notification.userId !== user.id && user.role !== "ADMIN") return apiError("Forbidden", 403);

    return apiSuccess(notification);
  } catch (error) {
    console.error("Notification GET error:", error);
    return apiError("Internal server error", 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser(request);
    if (!user) return apiError("Unauthorized", 401);

    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) return apiError("Notification not found", 404);
    if (notification.userId !== user.id && user.role !== "ADMIN") return apiError("Forbidden", 403);

    const body = await request.json();
    const updated = await prisma.notification.update({
      where: { id },
      data: { read: body.read !== undefined ? Boolean(body.read) : notification.read },
    });

    return apiSuccess(updated);
  } catch (error) {
    console.error("Notification PUT error:", error);
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
    if (!user) return apiError("Unauthorized", 401);

    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) return apiError("Notification not found", 404);
    if (notification.userId !== user.id && user.role !== "ADMIN") return apiError("Forbidden", 403);

    await prisma.notification.delete({ where: { id } });
    return apiSuccess({ message: "Notification deleted" });
  } catch (error) {
    console.error("Notification DELETE error:", error);
    return apiError("Internal server error", 500);
  }
}
