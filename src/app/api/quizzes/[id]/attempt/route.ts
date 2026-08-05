import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser(request);
    if (!user) return apiError("Unauthorized", 401);

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: { questions: true },
    });
    if (!quiz) return apiError("Quiz not found", 404);

    const body = await request.json();
    const { answers } = body;

    if (!answers || typeof answers !== "object") {
      return apiError("Answers are required");
    }

    let totalPoints = 0;
    let earnedPoints = 0;
    const questionResults: {
      questionId: string;
      questionText: string;
      type: string;
      userAnswer: string | null;
      correctAnswer: string;
      correct: boolean;
      points: number;
    }[] = [];

    for (const question of quiz.questions) {
      totalPoints += question.points;
      const userAnswer = answers[question.id];
      const isCorrect =
        userAnswer !== undefined &&
        (question.type === "multiple_choice"
          ? userAnswer === question.correctAnswer
          : userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim());
      if (isCorrect) {
        earnedPoints += question.points;
      }
      questionResults.push({
        questionId: question.id,
        questionText: question.questionText,
        type: question.type,
        userAnswer: userAnswer ?? null,
        correctAnswer: question.correctAnswer,
        correct: !!isCorrect,
        points: question.points,
      });
    }

    const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;

    const attempt = await prisma.quizAttempt.create({
      data: {
        userId: user.id,
        quizId: id,
        score,
        answersJson: JSON.stringify(answers),
      },
    });

    return apiSuccess({ attempt, score, earnedPoints, totalPoints, questionResults }, 201);
  } catch (error) {
    console.error("Quiz attempt POST error:", error);
    return apiError("Internal server error", 500);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser(request);
    if (!user) return apiError("Unauthorized", 401);

    const attempts = await prisma.quizAttempt.findMany({
      where: { quizId: id, userId: user.id },
      orderBy: { submittedAt: "desc" },
    });

    return apiSuccess(attempts);
  } catch (error) {
    console.error("Quiz attempts GET error:", error);
    return apiError("Internal server error", 500);
  }
}
