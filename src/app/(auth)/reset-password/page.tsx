"use client";

import { useState, FormEvent, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword: password }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Reset failed");
      return;
    }
    setDone(true);
  }

  if (!token) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-xs text-center">
        <p className="text-sm text-text-muted">Invalid reset link. Request a new one.</p>
        <Link href="/forgot-password" className="mt-4 inline-block text-sm font-medium text-primary hover:text-primary-dark">
          Request reset link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-xs text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950">
          <svg className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="mt-4 text-lg font-semibold text-text">Password updated</h2>
        <p className="mt-1 text-sm text-text-muted">Your password has been reset successfully.</p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-dark shadow-xs transition-all"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
      {error && (
        <div className="rounded-lg bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-text">New password</label>
        <input
          id="password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1.5 block w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-text placeholder:text-text-muted shadow-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
          placeholder="At least 6 characters"
        />
      </div>
      <div>
        <label htmlFor="confirm" className="block text-sm font-medium text-text">Confirm password</label>
        <input
          id="confirm"
          type="password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="mt-1.5 block w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-text placeholder:text-text-muted shadow-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
          placeholder="Repeat new password"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark shadow-xs transition-all disabled:opacity-50"
      >
        {loading ? "Resetting..." : "Reset password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold tracking-tight text-text">
            <span className="text-primary">L</span>MS
          </Link>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-text">Set new password</h1>
          <p className="mt-1 text-sm text-text-muted">Choose a strong new password</p>
        </div>
        <Suspense fallback={<div className="h-48 animate-pulse rounded-xl border border-border bg-card" />}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
