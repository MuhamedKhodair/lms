import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const courseId = searchParams.get("courseId");

    const where = courseId ? { courseId } : {};

    const discussions = await prisma.discussion.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess(discussions);
  } catch (error) {
    console.error("Discussions GET error:", error);
    return apiError("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return apiError("Unauthorized", 401);

    const body = await request.json();
    const { courseId, title, content } = body;

    if (!courseId || !title || !content) {
      return apiError("courseId, title, and content are required");
    }

    const discussion = await prisma.discussion.create({
      data: { courseId, userId: user.id, title, content },
      include: { user: { select: { id: true, name: true } } },
    });

    return apiSuccess(discussion, 201);
  } catch (error) {
    console.error("Discussions POST error:", error);
    return apiError("Internal server error", 500);
  }
}
