"use client";

import { useState } from "react";
import Link from "next/link";
import type { ModuleResponse, LessonResponse } from "@/types";
import { ProgressBar } from "./progress-bar";
import { FileUpload } from "./file-upload";

interface ModuleAccordionProps {
  modules: ModuleResponse[];
  courseId: string;
  isEnrolled: boolean;
  isInstructor: boolean;
  completedLessonIds: Set<string>;
  onAddModule: (title: string) => void;
  onAddLesson: (moduleId: string, data: { title: string; contentType: string; content?: string; videoUrl?: string }) => void;
}

const contentTypeIcons: Record<string, React.ReactNode> = {
  video: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  text: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  file: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
    </svg>
  ),
};

export function ModuleAccordion({
  modules,
  courseId,
  isEnrolled,
  isInstructor,
  completedLessonIds,
  onAddModule,
  onAddLesson,
}: ModuleAccordionProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [showAddModule, setShowAddModule] = useState(false);
  const [showAddLesson, setShowAddLesson] = useState<string | null>(null);
  const [moduleTitle, setModuleTitle] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonContentType, setLessonContentType] = useState("video");
  const [lessonContent, setLessonContent] = useState("");
  const [lessonVideoUrl, setLessonVideoUrl] = useState("");
  const [lessonFileUrl, setLessonFileUrl] = useState("");

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getProgress = () => {
    const total = modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0);
    const completed = modules.reduce(
      (sum, m) => sum + (m.lessons?.filter((l) => completedLessonIds.has(l.id)).length || 0),
      0
    );
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const handleAddModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleTitle.trim()) return;
    onAddModule(moduleTitle.trim());
    setModuleTitle("");
    setShowAddModule(false);
  };

  const handleAddLesson = (moduleId: string) => (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonTitle.trim()) return;
    onAddLesson(moduleId, {
      title: lessonTitle.trim(),
      contentType: lessonContentType,
      content: lessonContentType === "text" ? lessonContent : lessonContentType === "file" ? lessonFileUrl : undefined,
      videoUrl: lessonVideoUrl || undefined,
    });
    setLessonTitle("");
    setLessonContent("");
    setLessonVideoUrl("");
    setLessonFileUrl("");
    setShowAddLesson(null);
  };

  return (
    <div>
      {isEnrolled && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-text">Your progress</span>
            <span className="text-text-muted">{getProgress()}%</span>
          </div>
          <div className="mt-2">
            <ProgressBar value={getProgress()} />
          </div>
        </div>
      )}

      <div className="space-y-3">
        {modules.map((module, moduleIndex) => (
          <div key={module.id} className="rounded-xl border border-border bg-card overflow-hidden">
            {/* Module header */}
            <button
              onClick={() => toggleModule(module.id)}
              className="flex w-full items-center justify-between px-5 py-4 hover:bg-surface/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-medium text-text-muted">
                  {moduleIndex + 1}
                </span>
                <div className="text-left">
                  <h3 className="font-medium text-text">{module.title}</h3>
                  <p className="text-xs text-text-muted">
                    {module.lessons?.length || 0} lessons
                  </p>
                </div>
              </div>
              <svg
                className={`h-5 w-5 text-text-muted transition-transform ${expandedModules.has(module.id) ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Lessons (expanded) */}
            {expandedModules.has(module.id) && (
              <div className="border-t border-border">
                {(module.lessons || []).map((lesson: LessonResponse) => (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between px-5 py-3 pl-12 border-b border-border last:border-b-0 hover:bg-surface/30"
                  >
                    <Link
                      href={`/lessons/${lesson.id}`}
                      className="flex items-center gap-3 flex-1 min-w-0 group"
                    >
                      <span className="text-text-muted shrink-0">
                        {contentTypeIcons[lesson.contentType]}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text truncate group-hover:text-primary transition-colors">
                          {lesson.title}
                        </p>
                        {lesson.duration && (
                          <p className="text-xs text-text-muted">{lesson.duration} min</p>
                        )}
                      </div>
                    </Link>
                    <div className="flex items-center gap-2 shrink-0">
                      {completedLessonIds.has(lesson.id) && (
                        <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      {lesson.quizzes && lesson.quizzes.length > 0 && (
                        <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                          Quiz
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {isInstructor && (
                  <div className="px-5 py-3 pl-12">
                    {showAddLesson === module.id ? (
                      <form onSubmit={handleAddLesson(module.id)} className="rounded-lg border border-border bg-surface p-4 space-y-3">
                        <input
                          type="text"
                          placeholder="Lesson title"
                          value={lessonTitle}
                          onChange={(e) => setLessonTitle(e.target.value)}
                          className="block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                          autoFocus
                        />
                        <select
                          value={lessonContentType}
                          onChange={(e) => setLessonContentType(e.target.value)}
                          className="block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                        >
                          <option value="video">Video</option>
                          <option value="text">Text</option>
                          <option value="file">File</option>
                        </select>
                        {lessonContentType === "text" && (
                          <textarea
                            placeholder="Lesson content"
                            value={lessonContent}
                            onChange={(e) => setLessonContent(e.target.value)}
                            rows={3}
                            className="block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                          />
                        )}
                        {lessonContentType === "video" && (
                          <input
                            type="text"
                            placeholder="Video URL"
                            value={lessonVideoUrl}
                            onChange={(e) => setLessonVideoUrl(e.target.value)}
                            className="block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                          />
                        )}
                        {lessonContentType === "file" && (
                          <FileUpload onUpload={(url) => setLessonFileUrl(url)} />
                        )}
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary-dark transition-colors"
                          >
                            Add lesson
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAddLesson(null)}
                            className="rounded-lg border border-border bg-card px-4 py-2 text-xs font-medium text-text hover:bg-surface transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => setShowAddLesson(module.id)}
                        className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add lesson
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {isInstructor && (
        <div className="mt-4">
          {showAddModule ? (
            <form onSubmit={handleAddModule} className="rounded-xl border border-border bg-card p-5 space-y-3">
              <input
                type="text"
                placeholder="Module title"
                value={moduleTitle}
                onChange={(e) => setModuleTitle(e.target.value)}
                className="block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary-dark transition-colors"
                >
                  Add module
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModule(false)}
                  className="rounded-lg border border-border bg-card px-4 py-2 text-xs font-medium text-text hover:bg-surface transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowAddModule(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add module
            </button>
          )}
        </div>
      )}
    </div>
  );
}
