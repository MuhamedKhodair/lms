import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { paginationParams, apiSuccess, apiError } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== "ADMIN") return apiError("Forbidden", 403);

    const { searchParams } = request.nextUrl;
    const { page, limit, skip } = paginationParams(searchParams);

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        include: {
          instructor: { select: { id: true, name: true } },
          _count: { select: { enrollments: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.course.count(),
    ]);

    return apiSuccess({
      data: courses,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Admin courses GET error:", error);
    return apiError("Internal server error", 500);
  }
}
