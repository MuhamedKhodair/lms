import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { moduleSchema, apiSuccess, apiError } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const modules = await prisma.module.findMany({
      where: { courseId: id },
      include: { lessons: { orderBy: { order: "asc" } } },
      orderBy: { order: "asc" },
    });
    return apiSuccess(modules);
  } catch (error) {
    console.error("Modules GET error:", error);
    return apiError("Internal server error", 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser(request);
    if (!user) return apiError("Unauthorized", 401);

    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) return apiError("Course not found", 404);
    if (course.instructorId !== user.id && user.role !== "ADMIN") {
      return apiError("Forbidden", 403);
    }

    const body = await request.json();
    const parsed = moduleSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues.map((i) => i.message).join(", "));
    }

    const mod = await prisma.module.create({
      data: { ...parsed.data, courseId: id },
      include: { lessons: true },
    });

    return apiSuccess(mod, 201);
  } catch (error) {
    console.error("Modules POST error:", error);
    return apiError("Internal server error", 500);
  }
}
