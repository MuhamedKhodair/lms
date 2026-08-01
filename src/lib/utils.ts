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
  optionsJson: z.string().optional(),
  correctAnswer: z.string().min(1),
  points: z.number().int().min(1).optional().default(1),
});

export function paginationParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10") || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function apiError(message: string, status: number = 400) {
  return Response.json({ error: message }, { status });
}

export function apiSuccess<T>(data: T, status: number = 200) {
  return Response.json(data, { status });
}
