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

export default function NewQuizPage() {
  const router = useRouter();
  const { token } = useAuth();
  const params = useParams();
  const courseId = params.id as string;

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`/api/courses/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const course = await res.json();
          const ls: Lesson[] = [];
          for (const mod of course.modules || []) {
            for (const lesson of mod.lessons || []) {
              ls.push({ id: lesson.id, title: lesson.title, module: { title: mod.title } });
            }
          }
          setLessons(ls);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [token, courseId]);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <Link href={`/dashboard/courses/${courseId}`} className="text-sm font-medium text-primary hover:underline">
          ← Back to course
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-text">Create Quiz</h1>
        <p className="mt-1 text-text-muted">Add questions with multiple choice or short answer.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
        </div>
      ) : (
        <QuizBuilder
          courseId={courseId}
          lessons={lessons}
          onDone={() => router.push(`/dashboard/courses/${courseId}`)}
        />
      )}
    </div>
  );
}
