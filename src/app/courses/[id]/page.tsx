"use client";

import { useEffect, useState } from "react";
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
  const [moduleTitle, setModuleTitle] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonContent, setLessonContent] = useState("");
  const [lessonContentType, setLessonContentType] = useState("text");
  const [lessonVideoUrl, setLessonVideoUrl] = useState("");
  const [activeLesson, setActiveLesson] = useState<string | null>(null);
  const [lessonData, setLessonData] = useState<LessonResponse | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizResult, setQuizResult] = useState<{ score: number } | null>(null);
  const [discussionTitle, setDiscussionTitle] = useState("");
  const [discussionContent, setDiscussionContent] = useState("");
  const [discussions, setDiscussions] = useState<Record<string, unknown>[]>([]);
  const [commentText, setCommentText] = useState("");

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

  async function handleAddModule() {
    if (!moduleTitle.trim()) return;
    const token = localStorage.getItem("token");
    const order = (course?.modules?.length || 0);
    const res = await fetch(`/api/courses/${id}/modules`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: moduleTitle, order }),
    });
    if (res.ok) {
      setModuleTitle("");
      const newModule = await res.json();
      setCourse((prev) =>
        prev ? { ...prev, modules: [...(prev.modules || []), newModule] } : prev
      );
    }
  }

  async function handleAddLesson(moduleId: string) {
    if (!lessonTitle.trim()) return;
    const token = localStorage.getItem("token");
    const mod = course?.modules?.find((m) => m.id === moduleId);
    const order = mod?.lessons?.length || 0;

    const body: Record<string, unknown> = {
      title: lessonTitle,
      contentType: lessonContentType,
      order,
    };
    if (lessonContentType === "text") body.content = lessonContent;
    if (lessonContentType === "video") body.videoUrl = lessonVideoUrl;

    const res = await fetch(`/api/modules/${moduleId}/lessons`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setLessonTitle("");
      setLessonContent("");
      setLessonVideoUrl("");
      const newLesson = await res.json();
      setCourse((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          modules: prev.modules?.map((m) =>
            m.id === moduleId ? { ...m, lessons: [...(m.lessons || []), newLesson] } : m
          ),
        };
      });
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
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
                You are the instructor
              </span>
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

            {isInstructor && (
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  placeholder="Module title"
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  className="block flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
                <button
                  onClick={handleAddModule}
                  className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-dark shadow-xs transition-colors"
                >
                  Add
                </button>
              </div>
            )}

            <div className="mt-4 space-y-3">
              {course.modules?.map((mod, modIdx) => (
                <div key={mod.id} className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center gap-3 bg-surface/50 px-4 py-3 border-b border-border">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
                      {modIdx + 1}
                    </span>
                    <h3 className="font-medium text-text text-sm">{mod.title}</h3>
                    <span className="ml-auto text-xs text-text-muted">{mod.lessons?.length || 0} lessons</span>
                  </div>
                  <ul className="divide-y divide-border">
                    {mod.lessons?.map((lesson) => (
                      <li key={lesson.id}>
                        <button
                          onClick={() => viewLesson(lesson)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
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
                          <span className="flex-1">{lesson.title}</span>
                          {lesson.duration && (
                            <span className="text-xs text-text-muted/60">{lesson.duration}min</span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>

                  {isInstructor && (
                    <div className="border-t border-border p-3 space-y-2 bg-surface/30">
                      <input
                        type="text"
                        placeholder="Lesson title"
                        value={lessonTitle}
                        onChange={(e) => setLessonTitle(e.target.value)}
                        className="block w-full rounded-lg border border-border bg-white px-2 py-1.5 text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      />
                      <select
                        value={lessonContentType}
                        onChange={(e) => setLessonContentType(e.target.value)}
                        className="block w-full rounded-lg border border-border bg-white px-2 py-1.5 text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      >
                        <option value="text">Text</option>
                        <option value="video">Video</option>
                        <option value="file">File</option>
                      </select>
                      {lessonContentType === "text" && (
                        <textarea
                          placeholder="Content"
                          rows={2}
                          value={lessonContent}
                          onChange={(e) => setLessonContent(e.target.value)}
                          className="block w-full rounded-lg border border-border bg-white px-2 py-1.5 text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                        />
                      )}
                      {lessonContentType === "video" && (
                        <input
                          type="text"
                          placeholder="Video URL"
                          value={lessonVideoUrl}
                          onChange={(e) => setLessonVideoUrl(e.target.value)}
                          className="block w-full rounded-lg border border-border bg-white px-2 py-1.5 text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                        />
                      )}
                      <button
                        onClick={() => handleAddLesson(mod.id)}
                        className="w-full rounded-lg bg-primary/10 px-2 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                      >
                        Add Lesson
                      </button>
                    </div>
                  )}
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
                <h3 className="font-semibold text-text">{d.title as string}</h3>
                <p className="mt-1.5 text-sm text-text-muted">{d.content as string}</p>
                <p className="mt-2 text-xs text-text-muted/60 flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    {(d.user as { name: string })?.name?.charAt(0) || "?"}
                  </span>
                  {(d.user as { name: string })?.name}
                </p>
              </div>
            ))}
            {discussions.length === 0 && (
              <div className="rounded-xl border border-border bg-card p-8 text-center">
                <p className="text-sm text-text-muted">No discussions yet. Start the conversation!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
