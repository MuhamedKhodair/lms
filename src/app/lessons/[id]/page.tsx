"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import type { LessonResponse, CommentResponse } from "@/types";

interface LessonData extends LessonResponse {
  module?: {
    id: string;
    title: string;
    courseId: string;
    course?: { id: string; title: string };
  };
}

export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const res = await fetch(`/api/lessons/${id}`);
        if (!res.ok) throw new Error("Lesson not found");
        const data = await res.json();

        setLesson(data);
        setComments(
          (data.comments || []).map((c: Record<string, unknown>) => ({
            id: c.id as string,
            lessonId: id,
            userId: (c.user as Record<string, unknown>)?.id as string || "",
            content: c.content as string,
            createdAt: c.createdAt as string,
            user: c.user as { id: string; name: string },
          }))
        );
      } catch {
        setError("Lesson not found or you don't have access.");
      } finally {
        setFetching(false);
      }
    }
    load();
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    const token = localStorage.getItem("token");
    fetch(`/api/lessons/${id}/progress`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.completed) setCompleted(true);
      });
  }, [user, id]);

  const markComplete = async () => {
    const token = localStorage.getItem("token");
    await fetch(`/api/lessons/${id}/progress`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    setCompleted(true);
  };

  const postComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;
    setPosting(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ lessonId: id, content: commentText.trim() }),
      });
      if (res.ok) {
        const newComment = await res.json();
        setComments((prev) => [
          { ...newComment, user: { id: user.id, name: user.name } },
          ...prev,
        ]);
        setCommentText("");
      }
    } finally {
      setPosting(false);
    }
  };

  if (authLoading || fetching) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-border border-t-primary" />
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-32 text-center">
        <p className="text-lg font-medium text-text">{error || "Lesson not found"}</p>
        <Link
          href="/courses"
          className="mt-4 inline-block rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-text hover:bg-surface transition-colors"
        >
          Back to courses
        </Link>
      </div>
    );
  }

  const courseTitle = lesson.module?.course?.title;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-text-muted mb-6">
        <Link href="/courses" className="hover:text-text transition-colors">Courses</Link>
        {courseTitle && lesson.module && (
          <>
            <span>/</span>
            <Link href={`/courses/${lesson.module.courseId}`} className="hover:text-text transition-colors">
              {courseTitle}
            </Link>
            <span>/</span>
            <span>{lesson.module.title}</span>
          </>
        )}
        <span>/</span>
        <span className="text-text font-medium">{lesson.title}</span>
      </nav>

      {/* Lesson header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">{lesson.title}</h1>
          <div className="mt-2 flex items-center gap-3 text-sm text-text-muted">
            {lesson.duration && <span>{lesson.duration} min</span>}
            {lesson.contentType && (
              <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-text-muted capitalize">
                {lesson.contentType}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={markComplete}
          disabled={completed}
          className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-all shadow-xs ${
            completed
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 cursor-default"
              : "bg-primary text-white hover:bg-primary-dark"
          }`}
        >
          {completed ? "✓ Completed" : "Mark complete"}
        </button>
      </div>

      {/* Content */}
      <div className="mt-8 rounded-xl border border-border bg-card overflow-hidden">
        {lesson.contentType === "video" && lesson.videoUrl ? (
          <VideoPlayer url={lesson.videoUrl} />
        ) : lesson.contentType === "file" && lesson.content ? (
          <div className="p-6">
            <a
              href={lesson.content}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-border bg-surface px-5 py-4 transition-colors hover:border-primary/30"
            >
              <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <div>
                <p className="font-medium text-text">Download attachment</p>
                <p className="text-sm text-text-muted">{lesson.content.split("/").pop()}</p>
              </div>
              <svg className="ml-auto h-5 w-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </a>
          </div>
        ) : lesson.contentType === "text" && lesson.content ? (
          <div className="p-6">
            <div className="prose max-w-none text-text whitespace-pre-line leading-relaxed">
              {lesson.content}
            </div>
          </div>
        ) : (
          <div className="p-6 text-text-muted">No content available for this lesson.</div>
        )}
      </div>

      {/* Quizzes */}
      {lesson.quizzes && lesson.quizzes.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-text mb-4">Quizzes</h2>
          <div className="space-y-2">
            {lesson.quizzes.map((quiz) => (
              <Link
                key={quiz.id}
                href={`/quizzes/${quiz.id}`}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-5 py-3 transition-all hover:shadow-xs hover:border-primary/20"
              >
                <span className="font-medium text-text">{quiz.title}</span>
                <svg className="h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Comments */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-text mb-4">Comments ({comments.length})</h2>

        {user ? (
          <form onSubmit={postComment} className="mb-6">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              rows={3}
              className="block w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-text placeholder:text-text-muted shadow-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
            <button
              type="submit"
              disabled={posting || !commentText.trim()}
              className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark shadow-xs transition-all disabled:opacity-50"
            >
              {posting ? "Posting..." : "Post comment"}
            </button>
          </form>
        ) : (
          <p className="mb-6 text-sm text-text-muted">
            <Link href="/login" className="text-primary hover:underline">Sign in</Link> to comment.
          </p>
        )}

        <div className="space-y-3">
          {comments.length === 0 ? (
            <p className="text-text-muted">No comments yet.</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {c.user?.name?.charAt(0).toUpperCase() || "?"}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text">{c.user?.name}</span>
                    <span className="text-xs text-text-muted">
                      {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-text-muted whitespace-pre-line">{c.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function VideoPlayer({ url }: { url: string }) {
  const isYoutube = /youtu\.?be/.test(url);
  const videoId = isYoutube
    ? url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?.*v=|embed\/|v\/))([^&?/\s]+)/)?.[1]
    : null;

  if (isYoutube && videoId) {
    return (
      <div className="aspect-video bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Lesson video"
        />
      </div>
    );
  }

  return (
    <div className="aspect-video bg-black">
      <video controls className="h-full w-full" src={url}>
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
