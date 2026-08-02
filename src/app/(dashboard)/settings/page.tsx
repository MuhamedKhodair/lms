"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function SettingsPage() {
  const { user, token, loading, updateProfile, logout } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"profile" | "security" | "certificates" | "notifications">("profile");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user, loading, router]);

  if (!user) return null;

  const tabs = [
    { id: "profile" as const, label: "Profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
    { id: "security" as const, label: "Security", icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" },
    { id: "certificates" as const, label: "Certificates", icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" },
    { id: "notifications" as const, label: "Notifications", icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" },
  ];

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await updateProfile({ name, email });
      setMessage({ text: "Profile updated successfully", type: "success" });
    } catch (e) {
      setMessage({ text: e instanceof Error ? e.message : "Failed to update profile", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ text: "New passwords do not match", type: "error" });
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/users/me", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password");

      setMessage({ text: "Password changed successfully", type: "success" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      setMessage({ text: e instanceof Error ? e.message : "Failed to change password", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const [certificates, setCertificates] = useState<{ id: string; courseId: string; issuedAt: string; course?: { title: string } }[]>([]);

  useEffect(() => {
    if (activeTab === "certificates" && token) {
      fetch(`/api/users/${user.id}/certificates`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => setCertificates(Array.isArray(data) ? data : []));
    }
  }, [activeTab, token, user.id]);

  const roleColors: Record<string, string> = {
    ADMIN: "bg-accent/10 text-accent",
    INSTRUCTOR: "bg-primary/10 text-primary",
    STUDENT: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold ${roleColors[user.role]}`}>
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">{user.name}</h1>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${roleColors[user.role]}`}>
              {user.role.toLowerCase()}
            </span>
            <p className="text-sm text-text-muted">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 flex gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setMessage(null); }}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
        {/* Logout button */}
        <div className="ml-auto">
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-500 hover:text-red-700 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mt-6 rounded-lg px-4 py-3 text-sm font-medium ${
          message.type === "success"
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
            : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
        }`}>
          {message.text}
        </div>
      )}

      {/* Tab content */}
      <div className="mt-8">
        {activeTab === "profile" && (
          <div className="max-w-md space-y-6">
            <div>
              <label htmlFor="profile-name" className="block text-sm font-medium text-text">Full name</label>
              <input
                type="text"
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm shadow-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              />
            </div>
            <div>
              <label htmlFor="profile-email" className="block text-sm font-medium text-text">Email address</label>
              <input
                type="email"
                id="profile-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm shadow-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text">Role</label>
              <p className="mt-1.5 text-sm text-text-muted capitalize">{user.role.toLowerCase()}</p>
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-dark shadow-xs transition-all disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        )}

        {activeTab === "security" && (
          <form onSubmit={handleChangePassword} className="max-w-md space-y-6">
            <div>
              <label htmlFor="current-pw" className="block text-sm font-medium text-text">Current password</label>
              <input
                type="password"
                id="current-pw"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="mt-1.5 block w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm shadow-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              />
            </div>
            <div>
              <label htmlFor="new-pw" className="block text-sm font-medium text-text">New password</label>
              <input
                type="password"
                id="new-pw"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1.5 block w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm shadow-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              />
              <p className="mt-1.5 text-xs text-text-muted">Must be at least 6 characters</p>
            </div>
            <div>
              <label htmlFor="confirm-pw" className="block text-sm font-medium text-text">Confirm new password</label>
              <input
                type="password"
                id="confirm-pw"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="mt-1.5 block w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm shadow-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-dark shadow-xs transition-all disabled:opacity-50"
            >
              {saving ? "Changing..." : "Change password"}
            </button>
          </form>
        )}

        {activeTab === "certificates" && (
          <div className="space-y-4">
            {certificates.length === 0 ? (
              <div className="rounded-xl border border-border bg-card px-5 py-16 text-center">
                <svg className="mx-auto h-12 w-12 text-text-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <p className="mt-4 text-text-muted font-medium">No certificates yet</p>
                <p className="mt-1 text-sm text-text-muted/70">Complete a course to earn your first certificate</p>
              </div>
            ) : (
              certificates.map((cert) => (
                <div key={cert.id} className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950">
                      <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-text">{cert.course?.title || "Untitled Course"}</p>
                      <p className="text-sm text-text-muted">
                        {new Date(cert.issuedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <a
                    href={`/api/certificates/${cert.id}/download`}
                    className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-text hover:bg-surface transition-colors"
                  >
                    Download
                  </a>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "notifications" && (
          <NotificationsTab userId={user.id} token={token} />
        )}
      </div>
    </div>
  );
}

function NotificationsTab({ userId, token }: { userId: string; token: string | null }) {
  const [notifications, setNotifications] = useState<{ id: string; type: string; message: string; read: boolean; createdAt: string }[]>([]);

  useEffect(() => {
    if (!token) return;
    fetch("/api/notifications", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setNotifications(data.data || []));
  }, [token]);

  const typeIcons: Record<string, string> = {
    info: "ℹ️",
    success: "✅",
    warning: "⚠️",
    error: "❌",
  };

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ read: true }),
    });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  return (
    <div className="space-y-3">
      {notifications.length === 0 ? (
        <p className="text-text-muted">No notifications.</p>
      ) : (
        notifications.map((n) => (
          <button
            key={n.id}
            onClick={() => markRead(n.id)}
            className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
              !n.read
                ? "border-primary/20 bg-primary/5 hover:bg-primary/10"
                : "border-border bg-card hover:bg-surface/50"
            }`}
          >
            <span className="text-lg">{typeIcons[n.type] || typeIcons.info}</span>
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
  );
}
