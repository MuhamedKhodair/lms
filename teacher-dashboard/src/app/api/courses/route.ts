import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { courseSchema, paginationParams, apiSuccess, apiError } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const { page, limit, skip } = paginationParams(searchParams);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const mine = searchParams.get("mine") === "true";

    const user = await getAuthUser(request);

    const where: Record<string, unknown> = {};

    if (mine && user) {
      where.instructorId = user.id;
    }

    if (!mine) {
      where.published = true;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category) {
      where.category = category;
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          instructor: { select: { id: true, name: true, email: true } },
          _count: { select: { enrollments: true, modules: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.course.count({ where }),
    ]);

    return apiSuccess({
      data: courses,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Courses GET error:", error);
    return apiError("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return apiError("Unauthorized", 401);
    if (user.role !== "INSTRUCTOR" && user.role !== "ADMIN") {
      return apiError("Only instructors can create courses", 403);
    }

    const body = await request.json();
    const parsed = courseSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues.map((i) => i.message).join(", "));
    }

    const course = await prisma.course.create({
      data: {
        ...parsed.data,
        instructorId: user.id,
      },
      include: {
        instructor: { select: { id: true, name: true, email: true } },
      },
    });

    return apiSuccess(course, 201);
  } catch (error) {
    console.error("Courses POST error:", error);
    return apiError("Internal server error", 500);
  }
}
