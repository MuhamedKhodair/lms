import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== "ADMIN") return apiError("Forbidden", 403);

    const [
      totalUsers,
      totalInstructors,
      totalStudents,
      totalAdmins,
      totalCourses,
      publishedCourses,
      totalEnrollments,
      totalCertificates,
      totalQuizzes,
      totalDiscussions,
      recentUsers,
      recentCourses,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "INSTRUCTOR" } }),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.course.count(),
      prisma.course.count({ where: { published: true } }),
      prisma.enrollment.count(),
      prisma.certificate.count(),
      prisma.quiz.count(),
      prisma.discussion.count(),
      prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.course.findMany({
        select: {
          id: true,
          title: true,
          published: true,
          createdAt: true,
          instructor: { select: { name: true } },
          _count: { select: { enrollments: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    return apiSuccess({
      totals: {
        users: totalUsers,
        instructors: totalInstructors,
        students: totalStudents,
        admins: totalAdmins,
        courses: totalCourses,
        publishedCourses,
        enrollments: totalEnrollments,
        certificates: totalCertificates,
        quizzes: totalQuizzes,
        discussions: totalDiscussions,
      },
      recentUsers,
      recentCourses,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return apiError("Internal server error", 500);
  }
}
