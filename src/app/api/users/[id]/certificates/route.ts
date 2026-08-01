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
    const user = await getAuthUser(request);
    if (!user) return apiError("Unauthorized", 401);
    if (user.id !== id && user.role !== "ADMIN") {
      return apiError("Forbidden", 403);
    }

    const certificates = await prisma.certificate.findMany({
      where: { userId: id },
      include: { course: { select: { id: true, title: true } } },
      orderBy: { issuedAt: "desc" },
    });

    return apiSuccess(certificates);
  } catch (error) {
    console.error("Certificates GET error:", error);
    return apiError("Internal server error", 500);
  }
}
