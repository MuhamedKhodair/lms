import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { apiSuccess, apiError, parsePagination } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return apiError("Unauthorized", 401);

    const { searchParams } = request.nextUrl;
    const { page, limit, skip } = parsePagination(searchParams, 50);

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { userId: user.id } }),
    ]);

    return apiSuccess({ data: notifications, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Notifications GET error:", error);
    return apiError("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return apiError("Unauthorized", 401);

    const body = await request.json();
    const { userId, type, message } = body;

    if (!userId || !type || !message) {
      return apiError("userId, type, and message are required");
    }

    const notification = await prisma.notification.create({
      data: { userId, type, message },
    });

    return apiSuccess(notification, 201);
  } catch (error) {
    console.error("Notifications POST error:", error);
    return apiError("Internal server error", 500);
  }
}
