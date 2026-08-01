import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return apiError("Unauthorized", 401);

    const body = await request.json();
    const { lessonId, content } = body;

    if (!lessonId || !content) {
      return apiError("lessonId and content are required");
    }

    const comment = await prisma.comment.create({
      data: { lessonId, userId: user.id, content },
      include: { user: { select: { id: true, name: true } } },
    });

    return apiSuccess(comment, 201);
  } catch (error) {
    console.error("Comments POST error:", error);
    return apiError("Internal server error", 500);
  }
}
