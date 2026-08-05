import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return apiError("Unauthorized", 401);
    if (user.role === "STUDENT") return apiError("Forbidden", 403);

    const courseId = request.nextUrl.searchParams.get("courseId");

    const where: { instructorId?: string } = {};
    if (user.role !== "ADMIN") where.instructorId = user.id;

    const courses = courseId
      ? await prisma.course.findMany({ where: { id: courseId, ...where } })
      : await prisma.course.findMany({ where });

    if (!courses.length) {
      return apiSuccess({ courses: [], summary: null });
    }

    const results = await Promise.all(
      courses.map(async (course) => {
        const lessons = await prisma.lesson.findMany({
          where: { module: { courseId: course.id } },
          select: { id: true },
        });
        const lessonIds = lessons.map((l) => l.id);

        const [enrollments, certificates, quizIds] = await Promise.all([
          prisma.enrollment.count({ where: { courseId: course.id } }),
          prisma.certificate.count({ where: { courseId: course.id } }),
          prisma.quiz
            .findMany({ where: { courseId: course.id }, select: { id: true } })
            .then((qs) => qs.map((q) => q.id)),
        ]);

        let completed = 0;
        let completionRate = 0;
        if (lessonIds.length > 0) {
          const progress = await prisma.progress.findMany({
            where: { lessonId: { in: lessonIds }, completed: true },
            select: { userId: true },
          });
          const perUser = new Map<string, number>();
          for (const p of progress) {
            perUser.set(p.userId, (perUser.get(p.userId) || 0) + 1);
          }
          completed = Array.from(perUser.values()).filter((c) => c >= lessonIds.length).length;
          completionRate = enrollments > 0 ? Math.round((completed / enrollments) * 100) : 0;
        }

        let avgScore: number | null = null;
        let attempts = 0;
        if (quizIds.length > 0) {
          const attemptsArr = await prisma.quizAttempt.findMany({
            where: { quizId: { in: quizIds } },
            select: { score: true },
          });
          attempts = attemptsArr.length;
          if (attempts > 0) {
            avgScore = Math.round(
              (attemptsArr.reduce((sum, a) => sum + a.score, 0) / attempts) * 100
            );
          }
        }

        const recentEnrollments = await prisma.enrollment.findMany({
          where: { courseId: course.id },
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { enrolledAt: "desc" },
          take: 5,
        });

        return {
          courseId: course.id,
          title: course.title,
          published: course.published,
          totalLessons: lessonIds.length,
          enrollments,
          certificates,
          completed,
          completionRate,
          attempts,
          avgScore,
          recentEnrollments,
        };
      })
    );

    const totalEnrollments = results.reduce((s, r) => s + r.enrollments, 0);
    const totalCompleted = results.reduce((s, r) => s + r.completed, 0);

    return apiSuccess({
      courses: results,
      summary: {
        courses: results.length,
        enrollments: totalEnrollments,
        completed: totalCompleted,
        completionRate:
          totalEnrollments > 0 ? Math.round((totalCompleted / totalEnrollments) * 100) : 0,
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return apiError("Internal server error", 500);
  }
}
