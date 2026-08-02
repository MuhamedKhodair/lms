"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!token) return;
    fetch("/api/notifications", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setNotifications(data.data || []))
      .finally(() => setFetching(false));
  }, [token]);

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-border border-t-primary" />
      </div>
    );
  }

  const typeIcons: Record<string, string> = {
    info: "ℹ️",
    success: "✅",
    warning: "⚠️",
    error: "❌",
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ read: true }),
    });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    await Promise.all(unread.map((n) => markRead(n.id)));
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Notifications</h1>
          <p className="mt-1 text-sm text-text-muted">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text hover:bg-surface transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="mt-8 space-y-3">
        {notifications.length === 0 ? (
          <div className="rounded-xl border border-border bg-card px-5 py-16 text-center">
            <p className="text-text-muted font-medium">No notifications</p>
            <p className="mt-1 text-sm text-text-muted/70">You&apos;re all caught up!</p>
          </div>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => markRead(n.id)}
              className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors ${
                !n.read
                  ? "border-primary/20 bg-primary/5 hover:bg-primary/10"
                  : "border-border bg-card hover:bg-surface/50"
              }`}
            >
              <span className="text-lg shrink-0">{typeIcons[n.type] || typeIcons.info}</span>
              <div className="min-w-0 flex-1">
                <p className={`text-sm ${!n.read ? "font-medium text-text" : "text-text-muted"}`}>{n.message}</p>
                <p className="mt-1 text-xs text-text-muted">
                  {new Date(n.createdAt).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
              {!n.read && <div className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
