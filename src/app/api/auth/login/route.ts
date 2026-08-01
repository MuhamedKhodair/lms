import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { comparePassword, signToken } from "@/lib/auth";
import { loginSchema, apiError } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues.map(i => i.message).join(", "));
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return apiError("Invalid email or password", 401);
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      return apiError("Invalid email or password", 401);
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    const response = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token,
    });

    response.cookies.set("token", token, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return apiError("Internal server error", 500);
  }
}
