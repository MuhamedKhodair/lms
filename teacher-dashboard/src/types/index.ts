export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "INSTRUCTOR" | "STUDENT";
  createdAt?: string;
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
}

export interface CourseResponse {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  instructor?: { id: string; name: string; email: string };
  category: string | null;
  price: number;
  imageUrl: string | null;
  published: boolean;
  createdAt: string;
  modules?: ModuleResponse[];
  enrollmentCount?: number;
  progress?: number;
  _count?: { enrollments: number; modules?: number; lessons?: number };
}

export interface ModuleResponse {
  id: string;
  courseId: string;
  title: string;
  order: number;
  lessons: LessonResponse[];
}

export interface LessonResponse {
  id: string;
  moduleId: string;
  title: string;
  contentType: string;
  content: string | null;
  videoUrl: string | null;
  order: number;
  duration: number | null;
  completed?: boolean;
  comments?: CommentResponse[];
  quizzes?: QuizResponse[];
  [key: string]: unknown;
}

export interface CommentResponse {
  id: string;
  lessonId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string };
}

export interface EnrollmentResponse {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: string;
  status: string;
  course?: CourseResponse;
}

export interface QuizResponse {
  id: string;
  lessonId: string | null;
  courseId: string | null;
  title: string;
  questions?: QuizQuestionResponse[];
}

export interface QuizQuestionResponse {
  id: string;
  quizId: string;
  questionText: string;
  type: string;
  optionsJson: string | null;
  correctAnswer?: string;
  points: number;
}

export interface QuizAttemptResponse {
  id: string;
  userId: string;
  quizId: string;
  score: number;
  answersJson: string;
  submittedAt: string;
}

export interface CertificateResponse {
  id: string;
  userId: string;
  courseId: string;
  issuedAt: string;
  fileUrl: string | null;
  course?: CourseResponse;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
