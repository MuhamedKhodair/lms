"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

interface Reply {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string };
}

interface Discussion {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string };
  replies?: Reply[];
  _count?: { replies: number };
}

interface DiscussionThreadProps {
  discussions: Discussion[];
  canCreate: boolean;
  onCreate: (title: string, content: string) => void;
  onReply: (discussionId: string, content: string) => Promise<void>;
}

export function DiscussionThread({ discussions, canCreate, onCreate, onReply }: DiscussionThreadProps) {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [postingReply, setPostingReply] = useState(false);

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

  const handleReply = async (discussionId: string) => {
    if (!replyText.trim()) return;
    setPostingReply(true);
    try {
      await onReply(discussionId, replyText.trim());
      setReplyText("");
      setReplyingTo(null);
    } finally {
      setPostingReply(false);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });

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
                    <span>{formatDate(d.createdAt)}</span>
                    {(d._count?.replies ?? d.replies?.length ?? 0) > 0 && (
                      <>
                        <span>·</span>
                        <span>{d._count?.replies ?? d.replies?.length} replies</span>
                      </>
                    )}
                    {user && (
                      <button
                        onClick={() => {
                          setReplyingTo(replyingTo === d.id ? null : d.id);
                          setReplyText("");
                        }}
                        className="ml-2 font-medium text-primary hover:text-primary-dark transition-colors"
                      >
                        Reply
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Replies */}
              {d.replies && d.replies.length > 0 && (
                <div className="mt-3 space-y-2.5 border-l-2 border-border pl-4">
                  {d.replies.map((r) => (
                    <div key={r.id} className="flex items-start gap-2.5">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
                        {r.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-text">{r.user.name}</span>
                          <span className="text-xs text-text-muted">{formatDate(r.createdAt)}</span>
                        </div>
                        <p className="mt-0.5 text-sm text-text-muted leading-relaxed">{r.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply form */}
              {replyingTo === d.id && (
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    placeholder="Write a reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleReply(d.id);
                    }}
                    className="block flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    autoFocus
                  />
                  <button
                    onClick={() => handleReply(d.id)}
                    disabled={postingReply || !replyText.trim()}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark shadow-xs transition-all disabled:opacity-50"
                  >
                    {postingReply ? "..." : "Reply"}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
