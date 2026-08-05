"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import type { CourseResponse } from "@/types";

export default function DashboardPage() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<{ course: CourseResponse; enrolledAt: string }[]>([]);
  const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:3001";

  useEffect(() => {
    async function load() {
      if (!user) return;
      if (user.role === "ADMIN" || user.role === "INSTRUCTOR") {
        window.location.href = `${dashboardUrl}/dashboard`;
        return;
      }
      const token = localStorage.getItem("token");
      const res = await fetch("/api/enrollments", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setEnrollments(data.data || data);
      }
    }
    load();
  }, [user, dashboardUrl]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-surface">
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-text">Dashboard</h1>
              <p className="mt-1 text-text-muted">
                Welcome back, <span className="font-medium text-text">{user.name}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <section>
          <h2 className="text-lg font-semibold text-text">My Enrollments</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {enrollments.map((enrollment) => (
                <Link
                  key={enrollment.course.id}
                  href={`/courses/${enrollment.course.id}`}
                  className="group rounded-xl border border-border bg-card shadow-xs transition-all hover:shadow-md hover:-translate-y-0.5 overflow-hidden"
                >
                  <div className="aspect-[16/9] bg-gradient-to-br from-primary/10 to-accent/10 relative">
                    {enrollment.course.imageUrl && (
                      <img src={enrollment.course.imageUrl} alt={enrollment.course.title} className="h-full w-full object-cover" loading="lazy" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="font-semibold text-white">{enrollment.course.title}</h3>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-text-muted">
                      Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              ))}
              {enrollments.length === 0 && (
                <div className="col-span-full rounded-xl border border-border bg-card p-8 text-center">
                  <svg className="mx-auto h-12 w-12 text-text-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <p className="mt-2 text-text-muted font-medium">Not enrolled in any courses</p>
                  <Link href="/courses" className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:text-primary-dark font-medium">
                    Browse courses
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </Link>
                </div>
              )}
            </div>
          </section>


      </div>
    </div>
  );
}
