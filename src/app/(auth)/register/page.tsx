"use client";

import { useCallback, useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [error, setError] = useState("");
  const { register, user, loading } = useAuth();
  const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:3001";

  const homeHref = useCallback(
    (role?: string) =>
      role === "ADMIN" || role === "INSTRUCTOR" ? `${dashboardUrl}/dashboard` : "/dashboard",
    [dashboardUrl]
  );

  useEffect(() => {
    if (!loading && user) {
      window.location.href = homeHref(user.role);
    }
  }, [user, loading, homeHref]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const created = await register(name, email, password, role);
      window.location.href = homeHref(created.role);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold tracking-tight text-text">
            <span className="text-primary">L</span>MS
          </Link>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-text">Create account</h1>
          <p className="mt-1 text-sm text-text-muted">Start your learning journey</p>
        </div>
        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
          {error && (
            <div className="rounded-lg bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-text">Name</label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm shadow-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              placeholder="Your full name"
            />
          </div>
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
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm shadow-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              placeholder="At least 6 characters"
            />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-text">I am a</label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {["STUDENT", "INSTRUCTOR"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                    role === r
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-white text-text-muted hover:border-primary/30 hover:text-text"
                  }`}
                >
                  {r === "STUDENT" ? "Student" : "Instructor"}
                </button>
              ))}
            </div>
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark shadow-xs transition-all"
          >
            Create account
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:text-primary-dark transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
