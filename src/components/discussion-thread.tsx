"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

interface Discussion {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string };
}

interface DiscussionThreadProps {
  courseId: string;
  discussions: Discussion[];
  canCreate: boolean;
  onCreate: (title: string, content: string) => void;
}

export function DiscussionThread({ courseId, discussions, canCreate, onCreate }: DiscussionThreadProps) {
  const { token } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");

  const sorted = [...discussions].sort((a, b) => {
    if (sort === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onCreate(title.trim(), content.trim());
    setTitle("");
    setContent("");
    setShowForm(false);
  };

  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-text">Discussions</h2>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as "newest" | "oldest")}
            className="rounded-lg border border-border bg-white px-2 py-1 text-xs shadow-xs outline-none"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark shadow-xs transition-all"
          >
            New discussion
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-4 rounded-xl border border-border bg-card p-5 space-y-4">
          <input
            type="text"
            placeholder="What's your question or topic?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            autoFocus
          />
          <textarea
            placeholder="Provide more details..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark shadow-xs transition-all"
            >
              Post discussion
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-text hover:bg-surface transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 space-y-3">
        {sorted.length === 0 ? (
          <div className="rounded-xl border border-border bg-card px-5 py-10 text-center">
            <p className="text-text-muted">No discussions yet. Start one!</p>
          </div>
        ) : (
          sorted.map((d) => (
            <div
              key={d.id}
              className="rounded-xl border border-border bg-card px-5 py-4 transition-all hover:shadow-xs"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {d.user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-text">{d.title}</h3>
                  </div>
                  <p className="mt-1 text-sm text-text-muted line-clamp-3 leading-relaxed">
                    {d.content}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-text-muted">
                    <span className="font-medium">{d.user.name}</span>
                    <span>·</span>
                    <span>{timeAgo(d.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
