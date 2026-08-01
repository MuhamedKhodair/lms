"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

interface Stat {
  label: string;
  value: number;
  href: string;
  icon: React.ReactNode;
  color: string;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ users: 0, courses: 0, enrollments: 0, instructors: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user || user.role !== "ADMIN") return;
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      try {
        const [usersRes, coursesRes] = await Promise.all([
          fetch("/api/admin/users?limit=1", { headers }),
          fetch("/api/admin/courses?limit=1", { headers }),
        ]);
        const usersData = await usersRes.json();
        const coursesData = await coursesRes.json();
        setStats({
          users: usersData.data?.total ?? usersData.total ?? 0,
          courses: coursesData.data?.total ?? coursesData.total ?? 0,
          enrollments: 0,
          instructors: 0,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  if (!user || user.role !== "ADMIN") return null;

  const statCards: Stat[] = [
    {
      label: "Total Users",
      value: stats.users,
      href: "/admin/users",
      color: "bg-accent/10 text-accent",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      ),
    },
    {
      label: "Courses",
      value: stats.courses,
      href: "/admin/courses",
      color: "bg-primary/10 text-primary",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
  ];

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        {statCards.map((stat) => (
          <Link
            key={stat.href}
            href={stat.href}
            className="rounded-xl border border-border bg-card p-6 shadow-xs transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.color}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-sm text-text-muted">{stat.label}</p>
                <p className="text-2xl font-bold text-text">
                  {loading ? (
                    <span className="inline-block h-7 w-12 animate-pulse rounded bg-surface" />
                  ) : (
                    stat.value
                  )}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-text">Quick Actions</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Link
            href="/admin/users"
            className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4 hover:border-primary/30 transition-colors"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-text">Manage Users</p>
              <p className="text-sm text-text-muted">Add, edit or remove users</p>
            </div>
          </Link>
          <Link
            href="/admin/courses"
            className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4 hover:border-primary/30 transition-colors"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-text">Manage Courses</p>
              <p className="text-sm text-text-muted">Review and manage all courses</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
