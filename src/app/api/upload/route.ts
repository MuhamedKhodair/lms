import { NextRequest } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { getAuthUser } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/utils";
import { rateLimit, clientKey, rateLimitResponse } from "@/lib/rate-limit";

const UPLOAD_ROOT = process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads");
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // pptx
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
  "application/zip",
  "image/png",
  "image/jpeg",
  "image/gif",
  "video/mp4",
  "text/plain",
]);

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return apiError("Unauthorized", 401);
    if (user.role === "STUDENT") return apiError("Forbidden", 403);

    const rl = rateLimit(clientKey(request, "upload", user.id), { limit: 20, windowMs: 60_000 });
    if (!rl.success) return rateLimitResponse(rl);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return apiError("file is required");

    if (file.size > MAX_SIZE) return apiError("File exceeds 10 MB limit", 413);
    if (!ALLOWED_TYPES.has(file.type)) return apiError("File type not allowed", 415);

    const safeName = file.name.replace(/[^a-z0-9._-]/gi, "_");
    const storedName = `${randomUUID()}-${safeName}`;
    const bytes = Buffer.from(await file.arrayBuffer());

    await writeFile(path.join(UPLOAD_ROOT, storedName), bytes);

    return apiSuccess(
      {
        url: `/uploads/${storedName}`,
        name: file.name,
        size: file.size,
        type: file.type,
      },
      201
    );
  } catch (error) {
    console.error("Upload error:", error);
    return apiError("Internal server error", 500);
  }
}
