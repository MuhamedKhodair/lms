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

    const lessons = await prisma.lesson.findMany({
      where: { module: { courseId: id } },
      select: { id: true },
    });

    const lessonIds = lessons.map((l) => l.id);
    const total = lessonIds.length;

    const completed = await prisma.progress.count({
      where: { userId: user.id, lessonId: { in: lessonIds }, completed: true },
    });

    return apiSuccess({
      total,
      completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    });
  } catch (error) {
    console.error("Course progress GET error:", error);
    return apiError("Internal server error", 500);
  }
}
