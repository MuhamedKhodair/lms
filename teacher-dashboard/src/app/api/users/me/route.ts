import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, hashPassword, comparePassword } from "@/lib/auth";
import { apiSuccess, apiError, updateProfileSchema, changePasswordSchema } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return apiError("Unauthorized", 401);

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            enrollments: true,
            courses: true,
            certificates: true,
          },
        },
      },
    });

    return apiSuccess({ user: profile });
  } catch (error) {
    console.error("Profile GET error:", error);
    return apiError("Internal server error", 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return apiError("Unauthorized", 401);

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues.map((i) => i.message).join(", "));
    }

    const data: Record<string, string> = {};
    if (parsed.data.name) data.name = parsed.data.name;
    if (parsed.data.email) data.email = parsed.data.email;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data,
      select: { id: true, name: true, email: true, role: true },
    });

    return apiSuccess(updated);
  } catch (error) {
    console.error("Profile PUT error:", error);
    return apiError("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return apiError("Unauthorized", 401);

    const body = await request.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues.map((i) => i.message).join(", "));
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) return apiError("User not found", 404);

    const valid = await comparePassword(parsed.data.currentPassword, dbUser.passwordHash);
    if (!valid) return apiError("Current password is incorrect", 401);

    const passwordHash = await hashPassword(parsed.data.newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return apiSuccess({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Password change error:", error);
    return apiError("Internal server error", 500);
  }
}
