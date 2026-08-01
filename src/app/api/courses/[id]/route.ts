import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { courseSchema, apiSuccess, apiError } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        instructor: { select: { id: true, name: true, email: true } },
        modules: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              orderBy: { order: "asc" },
            },
          },
        },
        _count: { select: { enrollments: true } },
      },
    });

    if (!course) return apiError("Course not found", 404);

    return apiSuccess(course);
  } catch (error) {
    console.error("Course GET error:", error);
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

    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) return apiError("Course not found", 404);
    if (existing.instructorId !== user.id && user.role !== "ADMIN") {
      return apiError("Forbidden", 403);
    }

    const body = await request.json();
    const parsed = courseSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues.map((i) => i.message).join(", "));
    }

    const course = await prisma.course.update({
      where: { id },
      data: parsed.data,
      include: {
        instructor: { select: { id: true, name: true, email: true } },
      },
    });

    return apiSuccess(course);
  } catch (error) {
    console.error("Course PUT error:", error);
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

    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) return apiError("Course not found", 404);
    if (existing.instructorId !== user.id && user.role !== "ADMIN") {
      return apiError("Forbidden", 403);
    }

    await prisma.course.delete({ where: { id } });
    return apiSuccess({ message: "Course deleted" });
  } catch (error) {
    console.error("Course DELETE error:", error);
    return apiError("Internal server error", 500);
  }
}
