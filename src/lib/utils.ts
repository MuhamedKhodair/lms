import { z } from "zod/v4";

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.email(),
  password: z.string().min(6).max(100),
  role: z.enum(["STUDENT", "INSTRUCTOR"]).optional().default("STUDENT"),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const courseSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  category: z.string().max(100).optional(),
  price: z.number().min(0).optional().default(0),
  imageUrl: z.string().max(500).optional(),
  published: z.boolean().optional().default(false),
});

export const moduleSchema = z.object({
  title: z.string().min(2).max(200),
  order: z.number().int().min(0),
});

export const lessonSchema = z.object({
  title: z.string().min(2).max(200),
  contentType: z.enum(["video", "text", "file"]),
  content: z.string().optional(),
  videoUrl: z.string().max(500).optional(),
  order: z.number().int().min(0),
  duration: z.number().int().min(0).optional(),
});

export const quizSchema = z.object({
  title: z.string().min(2).max(200),
  lessonId: z.string().optional(),
  courseId: z.string().optional(),
});

export const quizQuestionSchema = z.object({
  questionText: z.string().min(1).max(1000),
  type: z.enum(["multiple_choice", "short_answer"]),
  optionsJson: z.union([z.string(), z.array(z.string())]).optional(),
  correctAnswer: z.string().min(1),
  points: z.number().int().min(1).optional().default(1),
});

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export function parsePagination(searchParams: URLSearchParams, defaultLimit = 20): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || String(defaultLimit), 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}

/** @deprecated Use `parsePagination` instead */
export function paginationParams(searchParams: URLSearchParams): PaginationParams {
  return parsePagination(searchParams);
}

export function apiSuccess<T>(data: T, status = 200): Response {
  return Response.json(data, { status });
}

export function apiError(message: string, status = 400): Response {
  return Response.json({ error: message }, { status });
}

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.email().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export const certificateIssueSchema = z.object({
  courseId: z.string().min(1),
});

export const notificationCreateSchema = z.object({
  userId: z.string().min(1),
  type: z.enum(["info", "success", "warning", "error"]),
  message: z.string().min(1).max(500),
});

export const quizAttemptSchema = z.object({
  answers: z.record(z.string(), z.string()),
});

export const discussionCreateSchema = z.object({
  title: z.string().min(3).max(200),
  content: z.string().min(3).max(5000),
  courseId: z.string().min(1),
});

export const commentCreateSchema = z.object({
  lessonId: z.string().min(1),
  content: z.string().min(1).max(2000),
});
