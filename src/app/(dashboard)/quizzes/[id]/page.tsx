"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { QuizPlayer } from "@/components/quiz-player";
import type { QuizQuestionResponse } from "@/types";

interface QuizData extends Omit<import("@/types").QuizResponse, "lessonId" | "courseId"> {
  lessonId: string | null;
  courseId: string | null;
  questions: QuizQuestionResponse[];
  lesson?: {
    module?: {
      courseId?: string;
      course?: { id: string; title: string };
    };
  };
  course?: { id: string; title: string };
}

export default function QuizPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const res = await fetch(`/api/quizzes/${id}`);
        if (!res.ok) throw new Error("Quiz not found");
        const data = await res.json();
        setQuiz(data);
      } catch {
        setError("Quiz not found");
      } finally {
        setFetching(false);
      }
    }
    load();
  }, [id]);

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-border border-t-primary" />
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <p className="text-lg font-medium text-text">Quiz not found</p>
        <p className="mt-1 text-sm text-text-muted">The quiz you&apos;re looking for doesn&apos;t exist.</p>
      </div>
    );
  }

  const courseTitle = quiz.lesson?.module?.course?.title || quiz.course?.title;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-text-muted mb-8">
        <Link href="/courses" className="hover:text-text transition-colors">Courses</Link>
        <span>/</span>
        {courseTitle && (
          <>
            <Link href={`/courses/${quiz.courseId || quiz.lesson?.module?.courseId}`} className="hover:text-text transition-colors">
              {courseTitle}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-text font-medium">Quiz</span>
      </nav>

      {quiz.questions.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-5 py-16 text-center">
          <p className="text-text-muted">This quiz has no questions yet.</p>
        </div>
      ) : (
        <QuizPlayer
          quizId={quiz.id}
          title={quiz.title}
          questions={quiz.questions}
          onComplete={async () => {
            if (!quiz.lessonId) return;
            const token = localStorage.getItem("token");
            await fetch(`/api/lessons/${quiz.lessonId}/progress`, {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
            });
          }}
        />
      )}
    </div>
  );
}
