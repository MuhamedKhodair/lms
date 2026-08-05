"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

interface Lesson {
  id: string;
  title: string;
  module: { title: string };
}

interface QuestionDraft {
  questionText: string;
  type: "multiple_choice" | "short_answer";
  options: string[];
  correctOption: number;
  correctAnswer: string;
  points: number;
}

interface QuizBuilderProps {
  courseId: string;
  lessons: Lesson[];
  initialQuiz?: {
    id: string;
    title: string;
    lessonId: string | null;
    questions: {
      questionText: string;
      type: string;
      optionsJson: string | null;
      correctAnswer: string;
      points: number;
    }[];
  };
  onDone: (quizId: string) => void;
}

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-text focus:border-primary focus:outline-none";

export function QuizBuilder({ courseId, lessons, initialQuiz, onDone }: QuizBuilderProps) {
  const { token } = useAuth();
  const [title, setTitle] = useState(initialQuiz?.title || "");
  const [lessonId, setLessonId] = useState(initialQuiz?.lessonId || "");
  const [questions, setQuestions] = useState<QuestionDraft[]>(
    initialQuiz?.questions.map((q) => ({
      questionText: q.questionText,
      type: q.type as QuestionDraft["type"],
      options: (() => {
        try {
          const parsed = q.optionsJson ? JSON.parse(q.optionsJson) : [];
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      })(),
      correctOption: (() => {
        try {
          const parsed = q.optionsJson ? JSON.parse(q.optionsJson) : [];
          return Array.isArray(parsed) ? Math.max(0, parsed.indexOf(q.correctAnswer)) : 0;
        } catch {
          return 0;
        }
      })(),
      correctAnswer: q.type === "short_answer" ? q.correctAnswer : "",
      points: q.points,
    })) || []
  );
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function addQuestion() {
    setQuestions((prev) => [
      ...prev,
      { questionText: "", type: "multiple_choice", options: ["", ""], correctOption: 0, correctAnswer: "", points: 1 },
    ]);
  }

  function updateQuestion(index: number, patch: Partial<QuestionDraft>) {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  }

  function updateOption(qIndex: number, oIndex: number, value: string) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex ? { ...q, options: q.options.map((o, oi) => (oi === oIndex ? value : o)) } : q
      )
    );
  }

  function removeQuestion(index: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  function validate(): string | null {
    if (title.trim().length < 2) return "Quiz title must be at least 2 characters";
    if (questions.length === 0) return "Add at least one question";
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) return `Question ${i + 1} is missing text`;
      if (q.type === "multiple_choice") {
        const opts = q.options.map((o) => o.trim());
        if (opts.length < 2 || opts.some((o) => !o)) return `Question ${i + 1} needs at least two options`;
        if (!opts[q.correctOption]) return `Question ${i + 1} needs a marked correct answer`;
      } else {
        if (!q.correctAnswer.trim()) return `Question ${i + 1} is missing the correct answer`;
      }
    }
    return null;
  }

  function buildPayload() {
    return {
      title,
      courseId,
      lessonId: lessonId || undefined,
      questions: questions.map((q) => ({
        questionText: q.questionText,
        type: q.type,
        optionsJson: q.type === "multiple_choice" ? q.options : undefined,
        correctAnswer: q.type === "multiple_choice" ? q.options[q.correctOption] || "" : q.correctAnswer,
        points: q.points,
      })),
    };
  }

  async function handleSubmit() {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(
        initialQuiz ? `/api/quizzes/${initialQuiz.id}` : "/api/quizzes",
        {
          method: initialQuiz ? "PUT" : "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(buildPayload()),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save quiz");
      onDone(data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save quiz");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-text">Quiz Title</label>
          <input
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Module 1 Assessment"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text">Attach to lesson</label>
          <select className={inputClass} value={lessonId} onChange={(e) => setLessonId(e.target.value)}>
            <option value="">Course-level quiz (not attached to a lesson)</option>
            {lessons.map((l) => (
              <option key={l.id} value={l.id}>
                {l.module.title} — {l.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((q, qi) => (
          <div key={qi} className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-text">Question {qi + 1}</label>
                <input
                  className={inputClass}
                  value={q.questionText}
                  onChange={(e) => updateQuestion(qi, { questionText: e.target.value })}
                  placeholder="Enter the question"
                />
              </div>
              <button
                onClick={() => removeQuestion(qi)}
                className="mt-6 rounded-lg px-2 py-1 text-xs text-danger hover:bg-danger/5 transition-colors"
              >
                Remove
              </button>
            </div>

            <div className="mb-3 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-text">Type</label>
                <select
                  className={inputClass}
                  value={q.type}
                  onChange={(e) => updateQuestion(qi, { type: e.target.value as QuestionDraft["type"] })}
                >
                  <option value="multiple_choice">Multiple choice</option>
                  <option value="short_answer">Short answer</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-text">Points</label>
                <input
                  type="number"
                  min={1}
                  className={inputClass}
                  value={q.points}
                  onChange={(e) => updateQuestion(qi, { points: Math.max(1, Number(e.target.value)) })}
                />
              </div>
            </div>

            {q.type === "multiple_choice" ? (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-text">Options (mark the correct one)</label>
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${qi}`}
                      checked={q.correctOption === oi}
                      onChange={() => updateQuestion(qi, { correctOption: oi })}
                      className="h-4 w-4 shrink-0 accent-[var(--color-primary)]"
                    />
                    <input
                      className={inputClass}
                      value={opt}
                      onChange={(e) => updateOption(qi, oi, e.target.value)}
                      placeholder={`Option ${oi + 1}`}
                    />
                    <button
                      onClick={() =>
                        updateQuestion(qi, { options: q.options.filter((_, i) => i !== oi) })
                      }
                      disabled={q.options.length <= 2}
                      className="rounded-lg px-2 py-1 text-xs text-text-muted hover:text-danger disabled:opacity-40"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => updateQuestion(qi, { options: [...q.options, ""] })}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  + Add option
                </button>
              </div>
            ) : (
              <div>
                <label className="mb-1 block text-sm font-medium text-text">Correct answer</label>
                <input
                  className={inputClass}
                  value={q.correctAnswer}
                  onChange={(e) => updateQuestion(qi, { correctAnswer: e.target.value })}
                  placeholder="Exact answer"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={addQuestion}
        className="w-full rounded-xl border border-dashed border-border bg-card py-3 text-sm font-medium text-primary hover:border-primary/40 transition-colors"
      >
        + Add question
      </button>

      {error && (
        <p className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</p>
      )}

      <div className="flex items-center justify-end gap-2">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {submitting ? "Saving..." : initialQuiz ? "Save Changes" : "Create Quiz"}
        </button>
      </div>
    </div>
  );
}
