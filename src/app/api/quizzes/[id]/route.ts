import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: true,
        lesson: { include: { module: { include: { course: { select: { id: true, title: true } } } } } },
        course: { select: { id: true, title: true } },
      },
    });
    if (!quiz) return apiError("Quiz not found", 404);
    return apiSuccess(quiz);
  } catch (error) {
    console.error("Quiz GET error:", error);
    return apiError("Internal server error", 500);
  }
}
