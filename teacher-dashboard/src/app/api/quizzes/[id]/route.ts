import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { apiSuccess, apiError, quizQuestionSchema } from "@/lib/utils";

/** Load a quiz with enough info to determine the owning course. */
async function loadQuiz(id: string) {
  return prisma.quiz.findUnique({
    where: { id },
    include: {
      questions: true,
      lesson: { include: { module: true } },
      course: true,
    },
  });
}

function canManage(
  quiz: { courseId: string | null; lesson?: { module: { courseId: string } | null } | null; course?: { instructorId: string } | null },
  user: { id: string; role: string }
) {
  const ownerId = quiz.course?.instructorId ?? quiz.lesson?.module?.courseId ?? null;
  if (!ownerId) return user.role === "ADMIN";
  return ownerId === user.id || user.role === "ADMIN";
}

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser(request);
    if (!user) return apiError("Unauthorized", 401);

    const quiz = await loadQuiz(id);
    if (!quiz) return apiError("Quiz not found", 404);
    if (!canManage(quiz, user)) return apiError("Forbidden", 403);

    const body = await request.json();

    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (title.length < 2) return apiError("Title must be at least 2 characters");

    const questions = Array.isArray(body.questions) ? body.questions : [];

    const updated = await prisma.$transaction(async (tx) => {
      await tx.quizQuestion.deleteMany({ where: { quizId: id } });

      for (const q of questions) {
        const qParsed = quizQuestionSchema.safeParse(q);
        if (!qParsed.success) throw new Error(qParsed.error.issues.map((i) => i.message).join(", "));
        const d = qParsed.data;
        await tx.quizQuestion.create({
          data: {
            quizId: id,
            questionText: d.questionText,
            type: d.type,
            optionsJson: Array.isArray(d.optionsJson) ? JSON.stringify(d.optionsJson) : d.optionsJson,
            correctAnswer: d.correctAnswer,
            points: d.points,
          },
        });
      }

      return tx.quiz.update({
        where: { id },
        data: { title },
        include: { questions: true },
      });
    });

    return apiSuccess(updated);
  } catch (error) {
    console.error("Quiz PUT error:", error);
    if (error instanceof Error) return apiError(error.message);
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser(request);
    if (!user) return apiError("Unauthorized", 401);

    const quiz = await loadQuiz(id);
    if (!quiz) return apiError("Quiz not found", 404);
    if (!canManage(quiz, user)) return apiError("Forbidden", 403);

    await prisma.quiz.delete({ where: { id } });
    return apiSuccess({ message: "Quiz deleted" });
  } catch (error) {
    console.error("Quiz DELETE error:", error);
    return apiError("Internal server error", 500);
  }
}
