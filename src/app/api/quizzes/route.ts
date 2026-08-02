import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { quizSchema, quizQuestionSchema, apiSuccess, apiError } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return apiError("Unauthorized", 401);
    if (user.role === "STUDENT") return apiError("Forbidden", 403);

    const body = await request.json();
    const parsed = quizSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues.map((i) => i.message).join(", "));
    }

    const { questions, ...quizData } = body;

    const quiz = await prisma.quiz.create({
      data: {
        ...quizData,
        questions: questions
          ? {
              create: (questions as unknown[]).map((q) => {
                const qParsed = quizQuestionSchema.safeParse(q);
                if (!qParsed.success) throw new Error("Invalid question");
                const d = qParsed.data;
                return {
                  ...d,
                  optionsJson: Array.isArray(d.optionsJson) ? JSON.stringify(d.optionsJson) : d.optionsJson,
                };
              }),
            }
          : undefined,
      },
      include: { questions: true },
    });

    return apiSuccess(quiz, 201);
  } catch (error) {
    console.error("Quiz POST error:", error);
    return apiError("Internal server error", 500);
  }
}
