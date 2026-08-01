"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      window.location.href = "/dashboard";
    }
  }, [user, loading]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold tracking-tight text-text">
            <span className="text-primary">L</span>MS
          </Link>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-text">Welcome back</h1>
          <p className="mt-1 text-sm text-text-muted">Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
          {error && (
            <div className="rounded-lg bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm shadow-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm shadow-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              placeholder="Enter your password"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark shadow-xs transition-all"
          >
            Sign in
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-text-muted">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-primary hover:text-primary-dark transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
