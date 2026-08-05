"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { StatCard } from "@/components/stat-card";

interface CourseStat {
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

interface AnalyticsResponse {
  courses: CourseStat[];
  summary: { courses: number; enrollments: number; completed: number; completionRate: number } | null;
}

export default function AnalyticsPage() {
  const { user, token } = useAuth();
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !token) return;
    (async () => {
      try {
        const res = await fetch("/api/analytics", { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const d = await res.json();
          setData(d);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [user, token]);

  if (!user) return null;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-text">Analytics</h1>
        <p className="mt-1 text-text-muted">
          {user.role === "ADMIN"
            ? "Performance across all courses on the platform"
            : "Performance across your courses"}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
        </div>
      ) : !data || data.courses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center text-text-muted">
          No courses with data yet.
        </div>
      ) : (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Courses" value={data.courses.length} tone="primary" />
            <StatCard label="Total Enrollments" value={data.summary?.enrollments || 0} tone="success" />
            <StatCard label="Students Completed" value={data.summary?.completed || 0} />
            <StatCard label="Avg Completion Rate" value={`${data.summary?.completionRate || 0}%`} />
          </div>

          <div className="space-y-4">
            {data.courses.map((c) => (
              <div key={c.courseId} className="rounded-xl border border-border bg-card overflow-hidden">
                <button
                  onClick={() => setExpanded(expanded === c.courseId ? null : c.courseId)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-surface/50"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-text">{c.title}</p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      {c.enrollments} enrollments · {c.completed} completed · {c.totalLessons} lessons
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-text">{c.completionRate}%</p>
                      <p className="text-xs text-text-muted">completion</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      c.published
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                    }`}>
                      {c.published ? "Published" : "Draft"}
                    </span>
                  </div>
                </button>

                {expanded === c.courseId && (
                  <div className="border-t border-border px-5 py-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="rounded-lg bg-surface p-4">
                        <p className="text-xs text-text-muted">Certificates issued</p>
                        <p className="mt-1 text-xl font-bold text-text">{c.certificates}</p>
                      </div>
                      <div className="rounded-lg bg-surface p-4">
                        <p className="text-xs text-text-muted">Quiz attempts</p>
                        <p className="mt-1 text-xl font-bold text-text">{c.attempts}</p>
                      </div>
                      <div className="rounded-lg bg-surface p-4">
                        <p className="text-xs text-text-muted">Average quiz score</p>
                        <p className="mt-1 text-xl font-bold text-text">{c.avgScore ?? "—"}%</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <h3 className="mb-2 text-sm font-medium text-text">Recent enrollments</h3>
                      {c.recentEnrollments.length === 0 ? (
                        <p className="text-sm text-text-muted">No enrollments yet.</p>
                      ) : (
                        <ul className="divide-y divide-border rounded-lg border border-border">
                          {c.recentEnrollments.map((e) => (
                            <li key={e.id} className="flex items-center justify-between px-3 py-2">
                              <span className="text-sm text-text">{e.user.name}</span>
                              <span className="text-xs text-text-muted">
                                {new Date(e.enrolledAt).toLocaleDateString()}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="mt-4">
                      <Link
                        href={`/dashboard/courses/${c.courseId}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Open course editor →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
