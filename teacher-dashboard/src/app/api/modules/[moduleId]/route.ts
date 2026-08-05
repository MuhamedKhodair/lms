import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { moduleSchema, apiSuccess, apiError } from "@/lib/utils";

export async function PUT(
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
    const parsed = moduleSchema.partial().safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues.map((i) => i.message).join(", "));
    }

    const updated = await prisma.module.update({
      where: { id: moduleId },
      data: parsed.data,
      include: { lessons: { orderBy: { order: "asc" } } },
    });

    return apiSuccess(updated);
  } catch (error) {
    console.error("Module PUT error:", error);
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(
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

    await prisma.module.delete({ where: { id: moduleId } });
    return apiSuccess({ message: "Module deleted" });
  } catch (error) {
    console.error("Module DELETE error:", error);
    return apiError("Internal server error", 500);
  }
}
