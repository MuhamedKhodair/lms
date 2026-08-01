import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { lessonSchema, apiSuccess, apiError } from "@/lib/utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const { moduleId } = await params;
    const user = await getAuthUser(request);
    if (!user) return apiError("Unauthorized", 401);

    const mod = await prisma.module.findUnique({
      where: { id: moduleId },
      include: { course: true },
    });
    if (!mod) return apiError("Module not found", 404);
    if (mod.course.instructorId !== user.id && user.role !== "ADMIN") {
      return apiError("Forbidden", 403);
    }

    const body = await request.json();
    const parsed = lessonSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues.map((i) => i.message).join(", "));
    }

    const lesson = await prisma.lesson.create({
      data: { ...parsed.data, moduleId },
    });

    return apiSuccess(lesson, 201);
  } catch (error) {
    console.error("Lessons POST error:", error);
    return apiError("Internal server error", 500);
  }
}
