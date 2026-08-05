import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/utils";
import { sendEmail, enrollmentEmail } from "@/lib/email";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser(request);
    if (!user) return apiError("Unauthorized", 401);

    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) return apiError("Course not found", 404);

    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId: id } },
    });
    if (existing) return apiError("Already enrolled", 409);

    const enrollment = await prisma.enrollment.create({
      data: { userId: user.id, courseId: id },
    });

    await Promise.all([
      sendEmail({ ...enrollmentEmail(user.name, course.title), to: user.email }).catch((e) =>
        console.error("Enrollment email failed:", e)
      ),
      prisma.notification.create({
        data: {
          userId: user.id,
          type: "success",
          message: `You enrolled in "${course.title}"`,
        },
      }),
    ]);

    return apiSuccess(enrollment, 201);
  } catch (error) {
    console.error("Enroll POST error:", error);
    return apiError("Internal server error", 500);
  }
}
