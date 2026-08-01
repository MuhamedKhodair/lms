import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return apiError("Unauthorized", 401);

    const body = await request.json();
    const { courseId } = body;

    if (!courseId) return apiError("courseId is required");

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return apiError("Course not found", 404);

    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId } },
    });
    if (!enrollment) return apiError("Not enrolled in this course", 403);

    const lessons = await prisma.lesson.findMany({
      where: { module: { courseId } },
      select: { id: true },
    });
    const lessonIds = lessons.map((l) => l.id);

    const completedCount = await prisma.progress.count({
      where: { userId: user.id, lessonId: { in: lessonIds }, completed: true },
    });

    if (lessonIds.length > 0 && completedCount < lessonIds.length) {
      return apiError("Complete all lessons before claiming a certificate", 400);
    }

    const existing = await prisma.certificate.findUnique({
      where: { userId_courseId: { userId: user.id, courseId } },
    });
    if (existing) return apiError("Certificate already issued", 409);

    const certificate = await prisma.certificate.create({
      data: { userId: user.id, courseId },
    });

    return apiSuccess(certificate, 201);
  } catch (error) {
    console.error("Certificate POST error:", error);
    return apiError("Internal server error", 500);
  }
}
