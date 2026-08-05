import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/utils";
import { z } from "zod/v4";

const updateCourseSchema = z.object({
  published: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser(request);
    if (!user || user.role !== "ADMIN") return apiError("Forbidden", 403);

    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) return apiError("Course not found", 404);

    const body = await request.json();
    const parsed = updateCourseSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues.map((i) => i.message).join(", "));
    }

    const updated = await prisma.course.update({
      where: { id },
      data: parsed.data,
      include: { instructor: { select: { id: true, name: true } } },
    });

    return apiSuccess(updated);
  } catch (error) {
    console.error("Admin course PATCH error:", error);
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

    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) return apiError("Course not found", 404);

    await prisma.course.delete({ where: { id } });
    return apiSuccess({ message: "Course deleted" });
  } catch (error) {
    console.error("Admin course DELETE error:", error);
    return apiError("Internal server error", 500);
  }
}
