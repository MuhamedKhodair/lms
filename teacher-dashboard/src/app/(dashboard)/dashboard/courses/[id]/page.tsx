"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { FileUpload } from "@/components/file-upload";

interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  contentType: string;
  content: string | null;
  videoUrl: string | null;
  order: number;
  duration: number | null;
}

interface Module {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface Quiz {
  id: string;
  title: string;
  lessonId: string | null;
  questions: { id: string }[];
}

interface CourseAnalytics {
  courseId: string;
  title: string;
  published: boolean;
  totalLessons: number;
  enrollments: number;
  certificates: number;
  completed: number;
  completionRate: number;
  attempts: number;
  avgScore: number | null;
  recentEnrollments: { id: string; enrolledAt: string; user: { name: string; email: string } }[];
}

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-text focus:border-primary focus:outline-none";

export default function CourseEditorPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const params = useParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<{
    id: string;
    title: string;
    description: string;
    category: string | null;
    price: number;
    imageUrl: string | null;
    published: boolean;
    modules: Module[];
  } | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [analytics, setAnalytics] = useState<CourseAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // course settings modal
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({ title: "", description: "", category: "", price: 0, imageUrl: "" });

  // module UI
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [addingModule, setAddingModule] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editingModuleTitle, setEditingModuleTitle] = useState("");

  // lesson UI
  const [addingLessonModule, setAddingLessonModule] = useState<string | null>(null);
  const [lessonDraft, setLessonDraft] = useState({ title: "", contentType: "text", content: "", videoUrl: "" });
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState({ title: "", contentType: "text", content: "", videoUrl: "" });

  const loadAll = useCallback(async () => {
    try {
      const [courseRes, quizRes, analyticsRes] = await Promise.all([
        fetch(`/api/courses/${courseId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/quizzes?courseId=${courseId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/analytics?courseId=${courseId}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (!courseRes.ok) throw new Error("Course not found");
      const c = await courseRes.json();
      const q = await quizRes.json();
      const a = await analyticsRes.json();
      setCourse(c);
      setQuizzes(q || []);
      setAnalytics(a.courses?.[0] || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load course");
    } finally {
      setLoading(false);
    }
  }, [courseId, token]);

  useEffect(() => {
    if (user && token) loadAll();
  }, [user, token, loadAll]);

  if (!user) return null;

  function flash(msg: string) {
    setNotice(msg);
    setTimeout(() => setNotice(""), 3000);
  }

  // ---------- course ----------
  async function handleTogglePublish() {
    if (!course) return;
    const res = await fetch(`/api/courses/${course.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ published: !course.published }),
    });
    if (res.ok) {
      setCourse((prev) => (prev ? { ...prev, published: !prev.published } : prev));
      flash(course.published ? "Course unpublished" : "Course published");
      loadAll();
    }
  }

  async function handleSaveCourse() {
    if (!course) return;
    const res = await fetch(`/api/courses/${course.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title: settings.title,
        description: settings.description,
        category: settings.category || undefined,
        price: settings.price,
        imageUrl: settings.imageUrl || undefined,
      }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "Failed to update course");
      return;
    }
    setShowSettings(false);
    setError("");
    flash("Course updated");
    loadAll();
  }

  async function handleDeleteCourse() {
    if (!course) return;
    if (!confirm("Delete this course and all its content? This cannot be undone.")) return;
    const res = await fetch(`/api/courses/${course.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) router.push("/dashboard/courses");
    else setError("Failed to delete course");
  }

  // ---------- modules ----------
  async function handleAddModule() {
    if (!newModuleTitle.trim()) return;
    const res = await fetch(`/api/courses/${courseId}/modules`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: newModuleTitle, order: course!.modules.length }),
    });
    if (res.ok) {
      setNewModuleTitle("");
      setAddingModule(false);
      flash("Module added");
      loadAll();
    }
  }

  async function handleSaveModuleTitle(moduleId: string) {
    const res = await fetch(`/api/modules/${moduleId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: editingModuleTitle }),
    });
    if (res.ok) {
      setEditingModuleId(null);
      flash("Module renamed");
      loadAll();
    }
  }

  async function handleDeleteModule(moduleId: string) {
    if (!confirm("Delete this module and all its lessons?")) return;
    const res = await fetch(`/api/modules/${moduleId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      flash("Module deleted");
      loadAll();
    }
  }

  // ---------- lessons ----------
  async function handleAddLesson() {
    if (!addingLessonModule || !lessonDraft.title.trim()) return;
    const moduleLessons = course?.modules.find((m) => m.id === addingLessonModule)?.lessons || [];
    const res = await fetch(`/api/modules/${addingLessonModule}/lessons`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title: lessonDraft.title,
        contentType: lessonDraft.contentType,
        content: lessonDraft.contentType === "text" ? lessonDraft.content : lessonDraft.contentType === "file" ? lessonDraft.content : undefined,
        videoUrl: lessonDraft.contentType === "video" ? lessonDraft.videoUrl : undefined,
        order: moduleLessons.length,
      }),
    });
    if (res.ok) {
      setAddingLessonModule(null);
      setLessonDraft({ title: "", contentType: "text", content: "", videoUrl: "" });
      flash("Lesson added");
      loadAll();
    }
  }

  async function handleSaveLesson(lessonId: string) {
    const res = await fetch(`/api/lessons/${lessonId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title: editingLesson.title,
        contentType: editingLesson.contentType,
        content: editingLesson.contentType === "text" ? editingLesson.content : editingLesson.contentType === "file" ? editingLesson.content : undefined,
        videoUrl: editingLesson.contentType === "video" ? editingLesson.videoUrl : undefined,
      }),
    });
    if (res.ok) {
      setEditingLessonId(null);
      flash("Lesson updated");
      loadAll();
    }
  }

  async function handleDeleteLesson(lessonId: string) {
    if (!confirm("Delete this lesson?")) return;
    const res = await fetch(`/api/lessons/${lessonId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      flash("Lesson deleted");
      loadAll();
    }
  }

  async function handleDeleteQuiz(quizId: string) {
    if (!confirm("Delete this quiz and all its attempts?")) return;
    const res = await fetch(`/api/quizzes/${quizId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      flash("Quiz deleted");
      loadAll();
    }
  }

  function openSettings() {
    if (!course) return;
    setSettings({
      title: course.title,
      description: course.description,
      category: course.category || "",
      price: course.price,
      imageUrl: course.imageUrl || "",
    });
    setShowSettings(true);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-danger/30 bg-danger/5 p-6 text-danger">{error}</div>
    );
  }

  if (!course) return null;

  return (
    <div className="mx-auto max-w-4xl">
      {notice && (
        <div className="mb-4 rounded-lg border border-success/30 bg-success/5 px-4 py-2 text-sm text-emerald-700 dark:text-emerald-300">
          {notice}
        </div>
      )}

      {/* header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">{course.title}</h1>
          <p className="mt-1 line-clamp-2 max-w-xl text-sm text-text-muted">{course.description}</p>
          <div className="mt-3 flex items-center gap-3 text-sm">
            <button
              onClick={handleTogglePublish}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-medium transition-colors ${
                course.published
                  ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${course.published ? "bg-emerald-500" : "bg-amber-500"}`} />
              {course.published ? "Published" : "Draft"} · click to toggle
            </button>
            <a
              href={`/courses/${course.id}`}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary hover:underline"
            >
              View student page ↗
            </a>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openSettings}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text hover:bg-surface transition-colors"
          >
            Edit Details
          </button>
          <Link
            href={`/dashboard/courses/${course.id}/quizzes/new`}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
          >
            New Quiz
          </Link>
          <button
            onClick={handleDeleteCourse}
            className="rounded-lg border border-danger/30 px-4 py-2 text-sm font-medium text-danger hover:bg-danger/5 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* analytics strip */}
      {analytics && (
        <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-text-muted">Enrollments</p>
            <p className="mt-1 text-2xl font-bold text-text">{analytics.enrollments}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-text-muted">Completion rate</p>
            <p className="mt-1 text-2xl font-bold text-text">{analytics.completionRate}%</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-text-muted">Lessons</p>
            <p className="mt-1 text-2xl font-bold text-text">{analytics.totalLessons}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-text-muted">Avg quiz score</p>
            <p className="mt-1 text-2xl font-bold text-text">{analytics.avgScore ?? "—"}%</p>
          </div>
        </div>
      )}

      {/* modules */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">Modules</h2>
          <button
            onClick={() => setAddingModule(true)}
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
          >
            Add Module
          </button>
        </div>

        {addingModule && (
          <div className="mb-4 flex gap-2 rounded-xl border border-border bg-card p-3">
            <input
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddModule()}
              placeholder="Module title"
              className={inputClass}
              autoFocus
            />
            <button onClick={handleAddModule} className="rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-dark">
              Add
            </button>
            <button onClick={() => { setAddingModule(false); setNewModuleTitle(""); }} className="rounded-lg border border-border px-3 text-sm text-text-muted hover:bg-surface">
              Cancel
            </button>
          </div>
        )}

        {course.modules.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-text-muted">
            No modules yet. Add your first module to start building lessons.
          </div>
        ) : (
          <div className="space-y-4">
            {course.modules.map((mod, idx) => (
              <div key={mod.id} className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="flex items-center justify-between border-b border-border bg-surface/50 px-4 py-3">
                  {editingModuleId === mod.id ? (
                    <div className="flex flex-1 items-center gap-2">
                      <input
                        value={editingModuleTitle}
                        onChange={(e) => setEditingModuleTitle(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSaveModuleTitle(mod.id)}
                        className={inputClass}
                        autoFocus
                      />
                      <button onClick={() => handleSaveModuleTitle(mod.id)} className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white">
                        Save
                      </button>
                      <button onClick={() => setEditingModuleId(null)} className="rounded-lg border border-border px-3 py-1.5 text-sm text-text-muted">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-text-muted">{idx + 1}</span>
                      <h3 className="font-semibold text-text">{mod.title}</h3>
                      <span className="text-xs text-text-muted">{mod.lessons.length} lessons</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setEditingModuleId(mod.id); setEditingModuleTitle(mod.title); }}
                      className="rounded-lg px-2 py-1 text-xs text-text-muted hover:text-text hover:bg-surface transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteModule(mod.id)}
                      className="rounded-lg px-2 py-1 text-xs text-danger hover:bg-danger/5 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-border">
                  {mod.lessons.map((lesson) => (
                    <div key={lesson.id} className="px-4 py-3">
                      {editingLessonId === lesson.id ? (
                        <div className="space-y-3">
                          <input
                            value={editingLesson.title}
                            onChange={(e) => setEditingLesson((p) => ({ ...p, title: e.target.value }))}
                            className={inputClass}
                            placeholder="Lesson title"
                          />
                          <select
                            value={editingLesson.contentType}
                            onChange={(e) => setEditingLesson((p) => ({ ...p, contentType: e.target.value }))}
                            className={inputClass}
                          >
                            <option value="text">Text</option>
                            <option value="video">Video</option>
                            <option value="file">File</option>
                          </select>
                          {editingLesson.contentType === "text" && (
                            <textarea
                              value={editingLesson.content}
                              onChange={(e) => setEditingLesson((p) => ({ ...p, content: e.target.value }))}
                              className={`${inputClass} min-h-24`}
                              placeholder="Lesson content"
                            />
                          )}
                          {editingLesson.contentType === "video" && (
                            <input
                              value={editingLesson.videoUrl}
                              onChange={(e) => setEditingLesson((p) => ({ ...p, videoUrl: e.target.value }))}
                              className={inputClass}
                              placeholder="YouTube or MP4 URL"
                            />
                          )}
                          {editingLesson.contentType === "file" && (
                            <div className="space-y-2">
                              <input
                                value={editingLesson.content}
                                onChange={(e) => setEditingLesson((p) => ({ ...p, content: e.target.value }))}
                                className={inputClass}
                                placeholder="/uploads/file.pdf"
                              />
                              <FileUpload onUpload={(url) => setEditingLesson((p) => ({ ...p, content: url }))} />
                            </div>
                          )}
                          <div className="flex gap-2">
                            <button onClick={() => handleSaveLesson(lesson.id)} className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white">
                              Save
                            </button>
                            <button onClick={() => setEditingLessonId(null)} className="rounded-lg border border-border px-3 py-1.5 text-sm text-text-muted">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="text-xs text-text-muted">{lesson.order + 1}.</span>
                            <span className="truncate text-sm font-medium text-text">{lesson.title}</span>
                            <span className="inline-flex shrink-0 items-center rounded-full bg-surface px-2 py-0.5 text-xs text-text-muted">
                              {lesson.contentType}
                            </span>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingLessonId(lesson.id);
                                setEditingLesson({
                                  title: lesson.title,
                                  contentType: lesson.contentType,
                                  content: lesson.content || "",
                                  videoUrl: lesson.videoUrl || "",
                                });
                              }}
                              className="rounded-lg px-2 py-1 text-xs text-text-muted hover:text-text hover:bg-surface transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteLesson(lesson.id)}
                              className="rounded-lg px-2 py-1 text-xs text-danger hover:bg-danger/5 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {addingLessonModule === mod.id ? (
                    <div className="space-y-3 bg-surface/40 px-4 py-4">
                      <input
                        value={lessonDraft.title}
                        onChange={(e) => setLessonDraft((p) => ({ ...p, title: e.target.value }))}
                        className={inputClass}
                        placeholder="Lesson title"
                        autoFocus
                      />
                      <select
                        value={lessonDraft.contentType}
                        onChange={(e) => setLessonDraft((p) => ({ ...p, contentType: e.target.value }))}
                        className={inputClass}
                      >
                        <option value="text">Text</option>
                        <option value="video">Video</option>
                        <option value="file">File</option>
                      </select>
                      {lessonDraft.contentType === "text" && (
                        <textarea
                          value={lessonDraft.content}
                          onChange={(e) => setLessonDraft((p) => ({ ...p, content: e.target.value }))}
                          className={`${inputClass} min-h-24`}
                          placeholder="Lesson content"
                        />
                      )}
                      {lessonDraft.contentType === "video" && (
                        <input
                          value={lessonDraft.videoUrl}
                          onChange={(e) => setLessonDraft((p) => ({ ...p, videoUrl: e.target.value }))}
                          className={inputClass}
                          placeholder="YouTube or MP4 URL"
                        />
                      )}
                      {lessonDraft.contentType === "file" && (
                        <div className="space-y-2">
                          <input
                            value={lessonDraft.content}
                            onChange={(e) => setLessonDraft((p) => ({ ...p, content: e.target.value }))}
                            className={inputClass}
                            placeholder="/uploads/file.pdf"
                          />
                          <FileUpload onUpload={(url) => setLessonDraft((p) => ({ ...p, content: url }))} />
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button onClick={handleAddLesson} className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white">
                          Add Lesson
                        </button>
                        <button onClick={() => setAddingLessonModule(null)} className="rounded-lg border border-border px-3 py-1.5 text-sm text-text-muted">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingLessonModule(mod.id)}
                      className="block w-full px-4 py-2.5 text-left text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
                    >
                      + Add lesson
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* quizzes */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">Quizzes</h2>
          <Link
            href={`/dashboard/courses/${course.id}/quizzes/new`}
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
          >
            New Quiz
          </Link>
        </div>
        {quizzes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-text-muted">
            No quizzes yet. Quizzes can be attached to a lesson or assigned to the whole course.
          </div>
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border bg-card">
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-text">{quiz.title}</p>
                  <p className="text-xs text-text-muted">
                    {quiz.lessonId ? "Attached to a lesson" : "Course quiz"} · {quiz.questions?.length || 0} questions
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/courses/${course.id}/quizzes/${quiz.id}/edit`}
                    className="rounded-lg px-3 py-1 text-sm font-medium text-text-muted hover:text-text hover:bg-surface transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDeleteQuiz(quiz.id)}
                    className="rounded-lg px-3 py-1 text-sm font-medium text-danger hover:bg-danger/5 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* settings modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-text">Edit Course Details</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-text">Title</label>
                <input className={inputClass} value={settings.title} onChange={(e) => setSettings((p) => ({ ...p, title: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-text">Description</label>
                <textarea className={`${inputClass} min-h-24`} value={settings.description} onChange={(e) => setSettings((p) => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-text">Category</label>
                  <input className={inputClass} value={settings.category} onChange={(e) => setSettings((p) => ({ ...p, category: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-text">Price</label>
                  <input type="number" min={0} className={inputClass} value={settings.price} onChange={(e) => setSettings((p) => ({ ...p, price: Number(e.target.value) }))} />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-text">Cover Image URL</label>
                <input className={inputClass} value={settings.imageUrl} onChange={(e) => setSettings((p) => ({ ...p, imageUrl: e.target.value }))} />
              </div>
            </div>
            {error && <p className="mt-4 text-sm text-danger">{error}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowSettings(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-muted hover:bg-surface">
                Cancel
              </button>
              <button onClick={handleSaveCourse} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
