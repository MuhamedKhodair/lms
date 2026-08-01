import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return apiError("Unauthorized", 401);

    const enrollments = await prisma.enrollment.findMany({
      where: { userId: user.id },
      include: {
        course: {
          include: {
            instructor: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
    });

    return apiSuccess({ data: enrollments });
  } catch (error) {
    console.error("Enrollments GET error:", error);
    return apiError("Internal server error", 500);
  }
}
