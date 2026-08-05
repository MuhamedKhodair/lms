"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { QuizBuilder } from "@/components/quiz-builder";

interface Lesson {
  id: string;
  title: string;
  module: { title: string };
}

interface QuizQuestion {
  questionText: string;
  type: string;
  optionsJson: string | null;
  correctAnswer: string;
  points: number;
}

export default function EditQuizPage() {
  const router = useRouter();
  const { token } = useAuth();
  const p = useParams() as { id: string; quizId: string };
  const courseId = p.id;
  const quizId = p.quizId;

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [quiz, setQuiz] = useState<{
    id: string;
    title: string;
    lessonId: string | null;
    questions: QuizQuestion[];
  } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const [courseRes, quizRes] = await Promise.all([
          fetch(`/api/courses/${courseId}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/quizzes/${quizId}`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (!courseRes.ok || !quizRes.ok) {
          setError("Quiz not found");
          return;
        }
        const course = await courseRes.json();
        const quizData = await quizRes.json();
        const ls: Lesson[] = [];
        for (const mod of course.modules || []) {
          for (const lesson of mod.lessons || []) {
            ls.push({ id: lesson.id, title: lesson.title, module: { title: mod.title } });
          }
        }
        setLessons(ls);
        setQuiz({
          id: quizData.id,
          title: quizData.title,
          lessonId: quizData.lessonId || null,
          questions: quizData.questions || [],
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [token, courseId, quizId]);

  if (error) {
    return <div className="rounded-xl border border-danger/30 bg-danger/5 p-6 text-danger">{error}</div>;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <Link href={`/dashboard/courses/${courseId}`} className="text-sm font-medium text-primary hover:underline">
          ← Back to course
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-text">Edit Quiz</h1>
        <p className="mt-1 text-text-muted">Update the title, questions, and answers.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
        </div>
      ) : (
        quiz && (
          <QuizBuilder
            courseId={courseId}
            lessons={lessons}
            initialQuiz={quiz}
            onDone={() => router.push(`/dashboard/courses/${courseId}`)}
          />
        )
      )}
    </div>
  );
}
