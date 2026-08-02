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
  const [instructorMenuOpen, setInstructorMenuOpen] = useState(false);
  const [courseEditOpen, setCourseEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPrice, setEditPrice] = useState(0);
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editPublished, setEditPublished] = useState(false);
  const [editing, setEditing] = useState(false);

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

  async function handleEditCourse() {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/courses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title: editTitle,
        description: editDescription,
        category: editCategory,
        price: editPrice,
        imageUrl: editImageUrl,
        published: editPublished,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setCourse(updated);
      setCourseEditOpen(false);
      setEditing(false);
    } else {
      alert("Failed to update course");
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
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
                  You are the instructor
                </span>
                <div className="relative">
                  <button
                    onClick={() => setInstructorMenuOpen(!instructorMenuOpen)}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-text hover:bg-surface transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                    </svg>
                    Manage
                  </button>
                  {instructorMenuOpen && (
                    <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
                      <Link
                        href={`/courses/${id}/quizzes/new`}
                        onClick={() => setInstructorMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-surface transition-colors"
                      >
                        <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                        </svg>
                        New Quiz
                      </Link>
                      <button
                        onClick={() => {
                          setEditTitle(course.title);
                          setEditDescription(course.description);
                          setEditCategory(course.category || "");
                          setEditPrice(course.price);
                          setEditImageUrl(course.imageUrl || "");
                          setEditPublished(course.published);
                          setCourseEditOpen(true);
                          setInstructorMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-surface transition-colors text-left"
                      >
                        <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zM8 13a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm18 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                        </svg>
                        Edit Course
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) return;
                          const token = localStorage.getItem("token");
                          await fetch(`/api/courses/${id}`, {
                            method: "DELETE",
                            headers: { Authorization: `Bearer ${token}` },
                          });
                          router.push("/courses");
                        }}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-danger hover:bg-danger/5 transition-colors text-left"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                        Delete Course
                      </button>
                    </div>
                  )}
                </div>
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

        {/* ===== Edit Course Modal ===== */}
        {courseEditOpen && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-xs px-4"
            onClick={(e) => e.target === e.currentTarget && setCourseEditOpen(false)}
          >
            <div
              className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text">Edit course</h2>
                <button
                  onClick={() => setCourseEditOpen(false)}
                  className="rounded-lg p-1.5 text-text-muted hover:bg-surface hover:text-text transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mt-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text">Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="mt-1.5 block w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-text placeholder:text-text-muted shadow-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text">Description</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    className="mt-1.5 block w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-text placeholder:text-text-muted shadow-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-text">Category</label>
                    <input
                      type="text"
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="mt-1.5 block w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-text placeholder:text-text-muted shadow-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text">Price ($)</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={editPrice}
                      onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                      className="mt-1.5 block w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-text placeholder:text-text-muted shadow-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text">Image URL</label>
                  <input
                    type="text"
                    value={editImageUrl}
                    onChange={(e) => setEditImageUrl(e.target.value)}
                    className="mt-1.5 block w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-text placeholder:text-text-muted shadow-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={editPublished}
                    onChange={(e) => setEditPublished(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-text">Published</span>
                </label>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleEditCourse}
                    disabled={editing}
                    className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark shadow-xs transition-all disabled:opacity-50"
                  >
                    {editing ? "Saving..." : "Save changes"}
                  </button>
                  <button
                    onClick={() => setCourseEditOpen(false)}
                    className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text hover:bg-surface transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
