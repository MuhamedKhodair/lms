import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return apiError("Unauthorized", 401);
    }
    return apiSuccess({ user });
  } catch (error) {
    console.error("Me error:", error);
    return apiError("Internal server error", 500);
  }
}
