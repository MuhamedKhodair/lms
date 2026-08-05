"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import type { CourseResponse, LessonResponse, CommentResponse } from "@/types";

interface ProgressData {
  total: number;
  completed: number;
  percentage: number;
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [course, setCourse] = useState<CourseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [activeLesson, setActiveLesson] = useState<string | null>(null);
  const [lessonData, setLessonData] = useState<LessonResponse | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizResult, setQuizResult] = useState<{ score: number } | null>(null);
  const [discussionTitle, setDiscussionTitle] = useState("");
  const [discussionContent, setDiscussionContent] = useState("");
  const [discussions, setDiscussions] = useState<Record<string, unknown>[]>([]);
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [courseQuizzes, setCourseQuizzes] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/courses/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCourse(data);
      }
      setLoading(false);

      if (user) {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const enrollRes = await fetch("/api/enrollments", { headers });
        if (enrollRes.ok) {
          const enrollData = await enrollRes.json();
          const items = enrollData.data || enrollData;
          setEnrolled(items.some((e: { courseId: string }) => e.courseId === id));
        }

        const progRes = await fetch(`/api/courses/${id}/progress`, { headers });
        if (progRes.ok) {
          setProgress(await progRes.json());
        }

        const discRes = await fetch(`/api/discussions?courseId=${id}`);
        if (discRes.ok) {
          const discData = await discRes.json();
          setDiscussions(discData);
        }

        const quizRes = await fetch(`/api/quizzes?courseId=${id}`);
        if (quizRes.ok) {
          const quizData = await quizRes.json();
          setCourseQuizzes(quizData.data || quizData);
        }
      }
    }
    load();
  }, [id, user]);

  async function handleEnroll() {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/courses/${id}/enroll`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setEnrolled(true);
    } else {
      const data = await res.json();
      alert(data.error || "Enrollment failed");
    }
  }

  async function markComplete(lessonId: string) {
    const token = localStorage.getItem("token");
    await fetch(`/api/lessons/${lessonId}/progress`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    setCourse((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        modules: prev.modules?.map((m) => ({
          ...m,
          lessons: m.lessons?.map((l) =>
            l.id === lessonId ? { ...l, completed: true } : l
          ),
        })),
      };
    });

    const progRes = await fetch(`/api/courses/${id}/progress`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (progRes.ok) {
      setProgress(await progRes.json());
    }
  }

  function viewLesson(lesson: LessonResponse) {
    setActiveLesson(lesson.id);
    setLessonData(lesson);
    setQuizResult(null);
    setQuizAnswers({});
  }

  async function handleSubmitQuiz(quizId: string) {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/quizzes/${quizId}/attempt`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ answers: quizAnswers }),
    });
    if (res.ok) {
      const result = await res.json();
      setQuizResult(result);

      const quiz = lessonData?.quizzes?.find((q) => q.id === quizId);
      if (quiz?.lessonId && activeLesson) {
        await markComplete(quiz.lessonId);
      }
    } else {
      const data = await res.json();
      alert(data.error || "Quiz submission failed");
    }
  }

  async function handleAddDiscussion() {
    if (!discussionTitle.trim() || !discussionContent.trim()) return;
    const token = localStorage.getItem("token");
    const res = await fetch("/api/discussions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ courseId: id, title: discussionTitle, content: discussionContent }),
    });
    if (res.ok) {
      setDiscussionTitle("");
      setDiscussionContent("");
      const newDisc = await res.json();
      setDiscussions((prev) => [newDisc, ...prev]);
    }
  }

  async function handleAddReply(discussionId: string) {
    if (!replyText.trim()) return;
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/discussions/${discussionId}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ content: replyText }),
    });
    if (res.ok) {
      const newReply = await res.json();
      setDiscussions((prev) =>
        prev.map((d) => {
          if (d.id !== discussionId) return d;
          const replies = (d.replies as Record<string, unknown>[]) || [];
          return { ...d, replies: [...replies, newReply] };
        })
      );
      setReplyText("");
      setReplyingTo(null);
    }
  }

  async function handleAddComment() {
    if (!commentText.trim() || !activeLesson) return;
    const token = localStorage.getItem("token");
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ lessonId: activeLesson, content: commentText }),
    });
    if (res.ok) {
      setCommentText("");
      const newComment = await res.json();
      setLessonData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          comments: [newComment, ...(prev.comments || [])],
        };
      });
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="flex items-center gap-2 text-text-muted">
        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading...
      </div>
    </div>
  );
  if (!course) return <div className="min-h-screen bg-surface flex items-center justify-center text-text-muted">Course not found</div>;

  const isInstructor = user && (user.id === course.instructorId || user.role === "ADMIN");
  const imgSrc = course.imageUrl || "";

  return (
    <div className="min-h-screen bg-surface">
      <div className={`relative ${imgSrc ? "h-64 sm:h-80" : "h-40"} overflow-hidden`}>
        {imgSrc ? (
          <>
            <img src={imgSrc} alt={course.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          </>
        ) : (
          <div className="h-full bg-gradient-to-br from-primary/10 to-accent/10" />
        )}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
          <div className="mx-auto max-w-5xl">
            {course.category && (
              <span className="inline-flex items-center rounded-full bg-white/20 backdrop-blur-xs px-3 py-1 text-xs font-medium text-white">
                {course.category}
              </span>
            )}
            <h1 className={`mt-2 font-bold text-white ${imgSrc ? "text-3xl sm:text-4xl" : "text-2xl text-text"}`}>
              {course.title}
            </h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
              {course.instructor?.name?.charAt(0) || "?"}
            </div>
            <div>
              <p className="font-medium text-text text-sm">{course.instructor?.name}</p>
              <p className="text-xs text-text-muted">Instructor</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!user ? (
              <button
                onClick={() => router.push("/login")}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-dark shadow-xs transition-all"
              >
                Sign in to enroll
              </button>
            ) : !enrolled && !isInstructor ? (
              <button
                onClick={handleEnroll}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-dark shadow-xs transition-all"
              >
                Enroll now {course.price > 0 && `- $${course.price}`}
              </button>
            ) : isInstructor ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
                  You are the instructor
                </span>
                <a
                  href={`${process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:3001"}/dashboard/courses/${id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark shadow-xs transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                  </svg>
                  Manage in Dashboard
                </a>
              </div>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Enrolled
              </span>
            )}
          </div>
        </div>

        <p className="mt-4 text-text-muted leading-relaxed">{course.description}</p>

        {progress && (
          <div className="mt-6 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-text">Your progress</span>
              <span className="text-text-muted">{progress.percentage}% ({progress.completed}/{progress.total} lessons)</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-surface overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <h2 className="text-lg font-semibold text-text">Course content</h2>
            <p className="text-sm text-text-muted mt-1">{course.modules?.length || 0} modules</p>

            <div className="mt-4 space-y-3">
              {course.modules?.map((mod, modIdx) => (
                <div key={mod.id} className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center gap-3 bg-surface/50 px-4 py-3 border-b border-border">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
                      {modIdx + 1}
                    </span>
                    <h3 className="font-medium text-text text-sm flex-1 truncate">{mod.title}</h3>
                    <span className="text-xs text-text-muted">{mod.lessons?.length || 0} lessons</span>
                  </div>
                  <ul className="divide-y divide-border">
                    {mod.lessons?.map((lesson) => (
                      <li key={lesson.id}>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => viewLesson(lesson)}
                            className={`flex-1 flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                              activeLesson === lesson.id
                                ? "bg-primary/5 text-primary font-medium"
                                : "text-text-muted hover:bg-surface hover:text-text"
                            }`}
                          >
                            <span className={`flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full border ${
                              lesson.completed
                                ? "bg-success border-success text-white"
                                : activeLesson === lesson.id
                                ? "border-primary text-primary"
                                : "border-border"
                            }`}>
                              {lesson.completed ? (
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                              ) : activeLesson === lesson.id ? (
                                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                              ) : null}
                            </span>
                            <span className="flex-1 truncate">{lesson.title}</span>
                            {lesson.duration && (
                              <span className="text-xs text-text-muted/60">{lesson.duration}min</span>
                            )}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {(!course.modules || course.modules.length === 0) && (
                <div className="rounded-xl border border-border bg-card p-8 text-center">
                  <p className="text-sm text-text-muted">No modules yet</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            {activeLesson && lessonData ? (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="border-b border-border px-6 py-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-text">{lessonData.title}</h2>
                  {user && !isInstructor && (
                    <button
                      onClick={() => markComplete(activeLesson)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-success px-4 py-2 text-sm font-medium text-white hover:opacity-90 shadow-xs transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      Mark complete
                    </button>
                  )}
                </div>
                <div className="px-6 py-5">
                  {lessonData.contentType === "video" && lessonData.videoUrl && (
                    <div className="aspect-video rounded-lg bg-surface overflow-hidden mb-6">
                      {lessonData.videoUrl.includes("youtube") || lessonData.videoUrl.includes("youtu.be") ? (
                        <iframe
                          src={lessonData.videoUrl.replace("watch?v=", "embed/")}
                          className="h-full w-full"
                          allowFullScreen
                        />
                      ) : (
                        <video src={lessonData.videoUrl} controls className="h-full w-full" />
                      )}
                    </div>
                  )}

                  {lessonData.contentType === "text" && lessonData.content && (
                    <div className="prose prose-sm max-w-none text-text-muted leading-relaxed whitespace-pre-wrap">
                      {lessonData.content}
                    </div>
                  )}

                  {lessonData.quizzes && lessonData.quizzes.length > 0 && (
                    <div className="mt-8 rounded-xl border border-border bg-surface p-5">
                      <h3 className="font-semibold text-text flex items-center gap-2">
                        <svg className="w-5 h-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {lessonData.quizzes[0].title}
                      </h3>
                      {quizResult ? (
                        <div className="mt-4 flex items-center gap-4">
                          <div className={`flex h-16 w-16 items-center justify-center rounded-full text-lg font-bold ${
                            quizResult.score >= 80
                              ? "bg-success/10 text-success"
                              : quizResult.score >= 50
                              ? "bg-warning/10 text-warning"
                              : "bg-danger/10 text-danger"
                          }`}>
                            {Math.round(quizResult.score)}%
                          </div>
                          <div>
                            <p className="font-medium text-text">Quiz completed</p>
                            <p className="text-sm text-text-muted">
                              {quizResult.score >= 80 ? "Great job!" : quizResult.score >= 50 ? "Good effort" : "Keep practicing"}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 space-y-4">
                          {lessonData.quizzes[0].questions?.map((q, qIdx) => (
                            <div key={q.id}>
                              <p className="text-sm font-medium text-text">
                                {qIdx + 1}. {q.questionText}
                              </p>
                              {q.type === "multiple_choice" && q.optionsJson && (
                                <div className="mt-2 space-y-1.5">
                                  {(JSON.parse(q.optionsJson) as string[]).map((opt, i) => (
                                    <label
                                      key={i}
                                      className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors ${
                                        quizAnswers[q.id] === opt
                                          ? "border-primary bg-primary/5 text-primary"
                                          : "border-border hover:border-primary/30 hover:bg-surface"
                                      }`}
                                    >
                                      <input
                                        type="radio"
                                        name={q.id}
                                        value={opt}
                                        checked={quizAnswers[q.id] === opt}
                                        onChange={(e) =>
                                          setQuizAnswers((prev) => ({
                                            ...prev,
                                            [q.id]: e.target.value,
                                          }))
                                        }
                                        className="sr-only"
                                      />
                                      <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                                        quizAnswers[q.id] === opt ? "border-primary bg-primary" : "border-border"
                                      }`}>
                                        {quizAnswers[q.id] === opt && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                                      </span>
                                      {opt}
                                    </label>
                                  ))}
                                </div>
                              )}
                              {q.type === "short_answer" && (
                                <input
                                  type="text"
                                  placeholder="Your answer"
                                  value={quizAnswers[q.id] || ""}
                                  onChange={(e) =>
                                    setQuizAnswers((prev) => ({
                                      ...prev,
                                      [q.id]: e.target.value,
                                    }))
                                  }
                                  className="mt-2 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                />
                              )}
                            </div>
                          ))}
                          <button
                            onClick={() => handleSubmitQuiz(lessonData.quizzes![0].id)}
                            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-dark shadow-xs transition-all"
                          >
                            Submit quiz
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {lessonData.comments && (
                    <div className="mt-8">
                      <h3 className="font-semibold text-text flex items-center gap-2">
                        <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        Comments ({lessonData.comments.length})
                      </h3>
                      {user && (
                        <div className="mt-3 flex gap-2">
                          <input
                            type="text"
                            placeholder="Add a comment..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            className="block flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                          />
                          <button
                            onClick={handleAddComment}
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark shadow-xs transition-colors"
                          >
                            Post
                          </button>
                        </div>
                      )}
                      <div className="mt-4 space-y-3">
                        {lessonData.comments.map((c: CommentResponse) => (
                          <div key={c.id} className="flex gap-3">
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                              {c.user?.name?.charAt(0) || "?"}
                            </div>
                            <div className="flex-1 rounded-xl bg-surface px-4 py-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-text">{c.user?.name}</span>
                              </div>
                              <p className="mt-1 text-sm text-text-muted">{c.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-16 text-center">
                <svg className="w-16 h-16 text-text-muted/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                <p className="text-text-muted font-medium">Select a lesson to begin</p>
                <p className="text-sm text-text-muted/60 mt-1">Choose from the modules on the left</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-lg font-semibold text-text flex items-center gap-2">
            <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            Discussions ({discussions.length})
          </h2>
          {user && (
            <div className="mt-4 rounded-xl border border-border bg-card p-4 space-y-3">
              <input
                type="text"
                placeholder="Discussion title"
                value={discussionTitle}
                onChange={(e) => setDiscussionTitle(e.target.value)}
                className="block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              />
              <textarea
                placeholder="What's on your mind?"
                rows={2}
                value={discussionContent}
                onChange={(e) => setDiscussionContent(e.target.value)}
                className="block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              />
              <button
                onClick={handleAddDiscussion}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark shadow-xs transition-colors"
              >
                Start discussion
              </button>
            </div>
          )}
          <div className="mt-4 space-y-3">
            {discussions.map((d) => (
              <div key={d.id as string} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-text">{d.title as string}</h3>
                    <p className="mt-1.5 text-sm text-text-muted">{d.content as string}</p>
                    <p className="mt-2 text-xs text-text-muted/60 flex items-center gap-1.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                        {(d.user as { name: string })?.name?.charAt(0) || "?"}
                      </span>
                      {(d.user as { name: string })?.name}
                    </p>
                  </div>
                  {user && (
                    <button
                      onClick={() => {
                        setReplyingTo(replyingTo === (d.id as string) ? null : (d.id as string));
                        setReplyText("");
                      }}
                      className="shrink-0 text-xs font-medium text-primary hover:text-primary-dark transition-colors"
                    >
                      Reply
                    </button>
                  )}
                </div>

                {(d.replies as Record<string, unknown>[])?.length > 0 && (
                  <div className="mt-3 space-y-2 border-l-2 border-border pl-4">
                    {(d.replies as Record<string, unknown>[]).map((r) => (
                      <div key={r.id as string} className="flex items-start gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-medium text-accent">
                          {((r.user as { name: string })?.name?.charAt(0) || "?").toUpperCase()}
                        </span>
                        <div>
                          <span className="text-xs font-medium text-text">
                            {(r.user as { name: string })?.name}
                          </span>
                          <p className="text-sm text-text-muted">{r.content as string}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {replyingTo === (d.id as string) && (
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      placeholder="Write a reply..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddReply(d.id as string);
                      }}
                      className="block flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      autoFocus
                    />
                    <button
                      onClick={() => handleAddReply(d.id as string)}
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark shadow-xs transition-colors"
                    >
                      Reply
                    </button>
                  </div>
                )}
              </div>
            ))}
            {discussions.length === 0 && (
              <div className="rounded-xl border border-border bg-card p-8 text-center">
                <p className="text-sm text-text-muted">No discussions yet. Start the conversation!</p>
              </div>
            )}
          </div>
        </div>

        {/* ===== Course Quizzes ===== */}
        {courseQuizzes.filter((q) => q.lessonId == null).length > 0 && (
          <div className="mt-12">
            <h2 className="text-lg font-semibold text-text flex items-center gap-2">
              <svg className="w-5 h-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Course Quizzes
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {courseQuizzes
                .filter((q) => q.lessonId == null)
                .map((q) => (
                  <Link
                    key={q.id as string}
                    href={`/quizzes/${q.id as string}`}
                    className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4 transition-all hover:shadow-xs hover:border-primary/20"
                  >
                    <span className="font-medium text-text">{q.title as string}</span>
                    <svg className="h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
