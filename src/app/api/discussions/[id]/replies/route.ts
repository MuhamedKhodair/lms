import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/utils";
import { z } from "zod/v4";

const replySchema = z.object({
  content: z.string().min(1).max(2000),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser(request);
    if (!user) return apiError("Unauthorized", 401);

    const discussion = await prisma.discussion.findUnique({ where: { id } });
    if (!discussion) return apiError("Discussion not found", 404);

    const body = await request.json();
    const parsed = replySchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues.map((i) => i.message).join(", "));
    }

    const reply = await prisma.reply.create({
      data: { discussionId: id, userId: user.id, content: parsed.data.content },
      include: { user: { select: { id: true, name: true } } },
    });

    return apiSuccess(reply, 201);
  } catch (error) {
    console.error("Reply POST error:", error);
    return apiError("Internal server error", 500);
  }
}
