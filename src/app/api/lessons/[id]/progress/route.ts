import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser(request);
    if (!user) return apiError("Unauthorized", 401);

    const lesson = await prisma.lesson.findUnique({ where: { id } });
    if (!lesson) return apiError("Lesson not found", 404);

    const progress = await prisma.progress.upsert({
      where: {
        userId_lessonId: { userId: user.id, lessonId: id },
      },
      update: { completed: true, completedAt: new Date() },
      create: { userId: user.id, lessonId: id, completed: true, completedAt: new Date() },
    });

    return apiSuccess(progress);
  } catch (error) {
    console.error("Progress POST error:", error);
    return apiError("Internal server error", 500);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser(request);
    if (!user) return apiError("Unauthorized", 401);

    const progress = await prisma.progress.findUnique({
      where: { userId_lessonId: { userId: user.id, lessonId: id } },
    });

    return apiSuccess(progress || { completed: false });
  } catch (error) {
    console.error("Progress GET error:", error);
    return apiError("Internal server error", 500);
  }
}
