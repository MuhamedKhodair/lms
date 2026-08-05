"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { StatCard } from "@/components/stat-card";

interface AdminStats {
  totals: {
    users: number;
    instructors: number;
    students: number;
    admins: number;
    courses: number;
    publishedCourses: number;
    enrollments: number;
    certificates: number;
    quizzes: number;
    discussions: number;
  };
  recentUsers: { id: string; name: string; email: string; role: string; createdAt: string }[];
  recentCourses: { id: string; title: string; published: boolean; createdAt: string; instructor: { name: string }; _count: { enrollments: number } }[];
}

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [courses, setCourses] = useState<{ id: string; title: string; published: boolean; createdAt: string; _count: { enrollments: number; modules: number } }[]>([]);
  const [loading, setLoading] = useState(true);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!user || !token) return;
    const role = user.role;
    let cancelled = false;

    async function load() {
      try {
        if (role === "ADMIN") {
          const res = await fetch("/api/admin/stats", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (!cancelled) setAdminStats(data);
          }
        } else {
          const res = await fetch("/api/courses?mine=true&limit=100", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (!cancelled) setCourses(data.data || []);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user, token]);

  if (!user) return null;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-text">
          Welcome back, {user.name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-text-muted">
          {user.role === "ADMIN" ? "Platform overview" : "Your teaching overview"}
        </p>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
        </div>
      )}

      {user.role === "ADMIN" && adminStats && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Users" value={adminStats.totals.users} tone="primary" />
            <StatCard label="Instructors" value={adminStats.totals.instructors} />
            <StatCard label="Students" value={adminStats.totals.students} />
            <StatCard label="Admins" value={adminStats.totals.admins} tone="accent" />
            <StatCard label="Courses" value={adminStats.totals.courses} hint={`${adminStats.totals.publishedCourses} published`} />
            <StatCard label="Enrollments" value={adminStats.totals.enrollments} tone="success" />
            <StatCard label="Certificates Issued" value={adminStats.totals.certificates} />
            <StatCard label="Quizzes" value={adminStats.totals.quizzes} />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="mb-4 font-semibold text-text">Recent Users</h2>
              {adminStats.recentUsers.length === 0 ? (
                <p className="text-sm text-text-muted">No users yet</p>
              ) : (
                <ul className="divide-y divide-border">
                  {adminStats.recentUsers.map((u) => (
                    <li key={u.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <p className="text-sm font-medium text-text">{u.name}</p>
                        <p className="text-xs text-text-muted">{u.email}</p>
                      </div>
                      <span className="text-xs font-medium text-text-muted">{u.role.toLowerCase()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="mb-4 font-semibold text-text">Recent Courses</h2>
              {adminStats.recentCourses.length === 0 ? (
                <p className="text-sm text-text-muted">No courses yet</p>
              ) : (
                <ul className="divide-y divide-border">
                  {adminStats.recentCourses.map((c) => (
                    <li key={c.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <p className="text-sm font-medium text-text">{c.title}</p>
                        <p className="text-xs text-text-muted">
                          by {c.instructor?.name} · {c._count.enrollments} students
                        </p>
                      </div>
                      <span
                        className={`text-xs font-medium ${
                          c.published ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {c.published ? "published" : "draft"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}

      {user.role === "INSTRUCTOR" && !loading && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="My Courses" value={courses.length} tone="primary" />
            <StatCard
              label="Published"
              value={courses.filter((c) => c.published).length}
              tone="success"
            />
            <StatCard
              label="Total Students"
              value={courses.reduce((s, c) => s + (c._count?.enrollments || 0), 0)}
            />
            <StatCard
              label="Total Modules"
              value={courses.reduce((s, c) => s + (c._count?.modules || 0), 0)}
            />
          </div>

          <div className="mt-8 flex items-center justify-between">
            <h2 className="font-semibold text-text">Your Courses</h2>
            <Link
              href="/dashboard/courses/new"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
            >
              New Course
            </Link>
          </div>
          {courses.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-border bg-card p-10 text-center">
              <p className="text-text-muted">You haven&apos;t created any courses yet.</p>
              <Link
                href="/dashboard/courses/new"
                className="mt-2 inline-block font-medium text-primary hover:underline"
              >
                Create your first course
              </Link>
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {courses.slice(0, 6).map((c) => (
                <Link
                  key={c.id}
                  href={`/dashboard/courses/${c.id}`}
                  className="rounded-xl border border-border bg-card p-5 transition-all hover:shadow-sm hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-text line-clamp-1">{c.title}</h3>
                    <span
                      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        c.published
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                      }`}
                    >
                      {c.published ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-text-muted">
                    {c._count?.enrollments || 0} students
                  </p>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
