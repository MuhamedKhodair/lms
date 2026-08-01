import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { lessonSchema, apiSuccess, apiError } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        module: { include: { course: true } },
        comments: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
        },
        quizzes: { include: { questions: true } },
      },
    });
    if (!lesson) return apiError("Lesson not found", 404);
    return apiSuccess(lesson);
  } catch (error) {
    console.error("Lesson GET error:", error);
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

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: { module: { include: { course: true } } },
    });
    if (!lesson) return apiError("Lesson not found", 404);
    if (lesson.module.course.instructorId !== user.id && user.role !== "ADMIN") {
      return apiError("Forbidden", 403);
    }

    const body = await request.json();
    const parsed = lessonSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues.map((i) => i.message).join(", "));
    }

    const updated = await prisma.lesson.update({ where: { id }, data: parsed.data });
    return apiSuccess(updated);
  } catch (error) {
    console.error("Lesson PUT error:", error);
    return apiError("Internal server error", 500);
  }
}
