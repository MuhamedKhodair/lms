"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import type { QuizQuestionResponse } from "@/types";

interface QuizPlayerProps {
  quizId: string;
  title: string;
  questions: QuizQuestionResponse[];
  onComplete: (score: number, totalPoints: number, earnedPoints: number) => void;
}

interface QuestionResult {
  questionId: string;
  questionText: string;
  type: string;
  userAnswer: string | null;
  correctAnswer: string;
  correct: boolean;
  points: number;
}

export function QuizPlayer({ quizId, title, questions, onComplete }: QuizPlayerProps) {
  const { token } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; earnedPoints: number; totalPoints: number } | null>(null);
  const [questionResults, setQuestionResults] = useState<QuestionResult[] | null>(null);
  const [error, setError] = useState("");

  const question = questions[currentIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;

  const handleAnswer = (questionId: string, answer: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    setError("");
    try {
      const res = await fetch(`/api/quizzes/${quizId}/attempt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answers }),
      });

      if (!res.ok) throw new Error("Failed to submit quiz");

      const data = await res.json();
      setResult({ score: data.score, earnedPoints: data.earnedPoints, totalPoints: data.totalPoints });
      setQuestionResults(data.questionResults || null);
      setSubmitted(true);
      onComplete(data.score, data.totalPoints, data.earnedPoints);
    } catch (e) {
      setError("Failed to submit quiz. Please try again.");
      console.error(e);
    }
  };

  const getOptions = (question: QuizQuestionResponse): string[] => {
    if (question.type === "multiple_choice" && question.optionsJson) {
      try {
        return JSON.parse(question.optionsJson);
      } catch {
        return [];
      }
    }
    return [];
  };

  const getScoreMessage = (score: number) => {
    if (score >= 90) return "Excellent! 🎉";
    if (score >= 70) return "Great job! 👏";
    if (score >= 50) return "Good effort! 💪";
    return "Keep practicing! 📚";
  };

  if (submitted && result) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <svg className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d={result.score >= 70
                ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              }
            />
          </svg>
        </div>
        <h2 className="mt-6 text-2xl font-bold text-text">{getScoreMessage(result.score)}</h2>
        <div className="mt-4">
          <span className="text-5xl font-bold text-primary">{Math.round(result.score)}%</span>
        </div>
        <p className="mt-2 text-text-muted">
          You earned {result.earnedPoints} out of {result.totalPoints} points
        </p>
        {questionResults && (
          <div className="mt-8 text-left">
            <h3 className="font-semibold text-text">Question breakdown</h3>
            <div className="mt-4 space-y-3">
              {questionResults.map((qr, i) => (
                <div
                  key={qr.questionId}
                  className={`rounded-lg border px-4 py-3 ${
                    qr.correct
                      ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/40"
                      : "border-red-200 bg-red-50/60 dark:border-red-900 dark:bg-red-950/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-text">
                      {i + 1}. {qr.questionText}
                    </p>
                    <span className={`shrink-0 text-xs font-semibold ${
                      qr.correct ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
                    }`}>
                      {qr.correct ? "Correct" : "Incorrect"}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1 text-sm">
                    <p className="text-text-muted">
                      Your answer: <span className={qr.correct ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-red-500 font-medium"}>
                        {qr.userAnswer || "(no answer)"}
                      </span>
                    </p>
                    {!qr.correct && (
                      <p className="text-text-muted">
                        Correct answer: <span className="text-emerald-600 dark:text-emerald-400 font-medium">{qr.correctAnswer}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="mt-8 flex justify-center gap-3">
          <button
            onClick={() => {
              setSubmitted(false);
              setResult(null);
              setQuestionResults(null);
              setAnswers({});
              setCurrentIndex(0);
            }}
            className="rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-text hover:bg-surface shadow-xs transition-all"
          >
            Retake quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Quiz header */}
      <div className="border-b border-border bg-surface/30 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">{title}</h2>
          <span className="text-sm text-text-muted">
            {currentIndex + 1} of {totalQuestions}
          </span>
        </div>
        {/* Progress dots */}
        <div className="mt-3 flex gap-1.5">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(i)}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i === currentIndex
                  ? "bg-primary"
                  : answers[q.id]
                    ? "bg-emerald-400"
                    : "bg-border"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Question */}
      <div className="px-6 py-6">
        <h3 className="text-lg font-medium text-text">
          {question.questionText}
        </h3>
        <p className="mt-1 text-sm text-text-muted">
          {question.points} {question.points === 1 ? "point" : "points"}
        </p>

        <div className="mt-6 space-y-3">
          {question.type === "multiple_choice" ? (
            getOptions(question).map((option, i) => (
              <label
                key={i}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
                  answers[question.id] === option
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-surface/50"
                }`}
              >
                <input
                  type="radio"
                  name={`q-${question.id}`}
                  value={option}
                  checked={answers[question.id] === option}
                  onChange={() => handleAnswer(question.id, option)}
                  className="h-4 w-4 text-primary focus:ring-primary"
                />
                <span className="text-sm text-text">{option}</span>
              </label>
            ))
          ) : (
            <input
              type="text"
              placeholder="Type your answer..."
              value={answers[question.id] || ""}
              onChange={(e) => handleAnswer(question.id, e.target.value)}
              className="block w-full rounded-lg border border-border bg-white px-4 py-3 text-sm shadow-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          )}
        </div>
      </div>

      {/* Footer / navigation */}
      <div className="flex items-center justify-between border-t border-border bg-surface/30 px-6 py-4">
        <button
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-text hover:bg-surface transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <div className="flex items-center gap-3">
          {error && <p className="text-sm text-red-500">{error}</p>}
          {currentIndex < totalQuestions - 1 ? (
            <button
              onClick={() => setCurrentIndex((i) => Math.min(totalQuestions - 1, i + 1))}
              className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={answeredCount < totalQuestions}
              className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit quiz
            </button>
          )}
        </div>
      </div>

      <div className="border-t border-border bg-surface/30 px-6 py-2 text-center text-xs text-text-muted">
        {answeredCount} of {totalQuestions} answered
      </div>
    </div>
  );
}
