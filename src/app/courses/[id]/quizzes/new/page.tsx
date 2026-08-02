"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import type { CourseResponse, ModuleResponse } from "@/types";

interface QuestionDraft {
  questionText: string;
  type: "multiple_choice" | "short_answer";
  options: string[];
  correctAnswer: string;
  points: number;
}

const emptyQuestion: QuestionDraft = {
  questionText: "",
  type: "multiple_choice",
  options: ["", ""],
  correctAnswer: "",
  points: 1,
};

export default function NewQuizPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();

  const [course, setCourse] = useState<CourseResponse | null>(null);
  const [title, setTitle] = useState("");
  const [lessonId, setLessonId] = useState<string>("");
  const [questions, setQuestions] = useState<QuestionDraft[]>([{ ...emptyQuestion }]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role === "STUDENT")) router.push("/dashboard");
  }, [user, loading, router]);

  useEffect(() => {
    fetch(`/api/courses/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => {
        if (c) setCourse(c);
      });
  }, [id]);

  const allLessons = (course?.modules || []).flatMap((m: ModuleResponse) => m.lessons || []);

  const updateQuestion = (index: number, updates: Partial<QuestionDraft>) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...updates } : q)));
  };

  const addQuestion = () => setQuestions((prev) => [...prev, { ...emptyQuestion }]);

  const removeQuestion = (index: number) =>
    setQuestions((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) return setError(`Question ${i + 1}: enter a question.`);
      if (!q.correctAnswer.trim()) return setError(`Question ${i + 1}: enter the correct answer.`);
      if (q.type === "multiple_choice") {
        const filledOptions = q.options.filter((o) => o.trim());
        if (filledOptions.length < 2) return setError(`Question ${i + 1}: at least 2 options required.`);
        if (!filledOptions.includes(q.correctAnswer)) {
          return setError(`Question ${i + 1}: the correct answer must be one of the options.`);
        }
      }
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title,
          lessonId: lessonId || undefined,
          courseId: lessonId ? undefined : id,
          questions: questions.map((q) => ({
            questionText: q.questionText,
            type: q.type,
            optionsJson: q.type === "multiple_choice" ? q.options.filter((o) => o.trim()) : undefined,
            correctAnswer: q.correctAnswer,
            points: q.points,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create quiz");

      router.push(`/courses/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create quiz");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !course) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-border border-t-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <nav className="flex items-center gap-2 text-sm text-text-muted mb-6">
        <Link href="/courses" className="hover:text-text transition-colors">Courses</Link>
        <span>/</span>
        <Link href={`/courses/${id}`} className="hover:text-text transition-colors">{course.title}</Link>
        <span>/</span>
        <span className="text-text font-medium">New quiz</span>
      </nav>

      <h1 className="text-2xl font-bold tracking-tight text-text">Create quiz</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {error && (
          <div className="rounded-lg bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div>
            <label htmlFor="quiz-title" className="block text-sm font-medium text-text">Quiz title</label>
            <input
              id="quiz-title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-text placeholder:text-text-muted shadow-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              placeholder="e.g. Module 1 Knowledge Check"
            />
          </div>

          <div>
            <label htmlFor="quiz-lesson" className="block text-sm font-medium text-text">Attach to lesson (optional)</label>
            <select
              id="quiz-lesson"
              value={lessonId}
              onChange={(e) => setLessonId(e.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-text shadow-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="">— Course-level quiz —</option>
              {allLessons.map((l) => (
                <option key={l.id} value={l.id}>{l.title}</option>
              ))}
            </select>
          </div>
        </div>

        {questions.map((q, qi) => (
          <div key={qi} className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-muted">Question {qi + 1}</span>
              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeQuestion(qi)}
                  className="text-sm text-danger hover:underline"
                >
                  Remove
                </button>
              )}
            </div>

            <textarea
              value={q.questionText}
              onChange={(e) => updateQuestion(qi, { questionText: e.target.value })}
              placeholder="Question text"
              rows={2}
              className="block w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-text placeholder:text-text-muted shadow-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-text">Type</label>
                <select
                  value={q.type}
                  onChange={(e) => updateQuestion(qi, { type: e.target.value as QuestionDraft["type"] })}
                  className="mt-1.5 block w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-text shadow-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                >
                  <option value="multiple_choice">Multiple choice</option>
                  <option value="short_answer">Short answer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text">Points</label>
                <input
                  type="number"
                  min={1}
                  value={q.points}
                  onChange={(e) => updateQuestion(qi, { points: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                  className="mt-1.5 block w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-text shadow-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
            </div>

            {q.type === "multiple_choice" && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-text">Options</label>
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${qi}`}
                      checked={q.correctAnswer === opt && opt !== ""}
                      onChange={() => updateQuestion(qi, { correctAnswer: opt })}
                      title="Mark as correct"
                      className="h-4 w-4 text-primary focus:ring-primary"
                    />
                    <input
                      value={opt}
                      onChange={(e) =>
                        updateQuestion(qi, {
                          options: q.options.map((o, i) => (i === oi ? e.target.value : o)),
                        })
                      }
                      placeholder={`Option ${oi + 1}`}
                      className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-text placeholder:text-text-muted shadow-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    />
                    {q.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() =>
                          updateQuestion(qi, { options: q.options.filter((_, i) => i !== oi) })
                        }
                        className="text-text-muted hover:text-danger"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => updateQuestion(qi, { options: [...q.options, ""] })}
                  className="text-sm font-medium text-primary hover:text-primary-dark"
                >
                  + Add option
                </button>
              </div>
            )}

            {q.type === "short_answer" && (
              <div>
                <label className="block text-sm font-medium text-text">Correct answer</label>
                <input
                  value={q.correctAnswer}
                  onChange={(e) => updateQuestion(qi, { correctAnswer: e.target.value })}
                  placeholder="Exact answer (case-insensitive)"
                  className="mt-1.5 block w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-text placeholder:text-text-muted shadow-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
            )}
          </div>
        ))}

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={addQuestion}
            className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text hover:bg-surface transition-colors"
          >
            + Add question
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-dark shadow-xs transition-all disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create quiz"}
          </button>
        </div>
      </form>
    </div>
  );
}
