"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import type { CourseResponse } from "@/types";

export default function DashboardPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [enrollments, setEnrollments] = useState<{ course: CourseResponse; enrolledAt: string }[]>([]);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      if (user.role === "INSTRUCTOR" || user.role === "ADMIN") {
        const res = await fetch("/api/courses?mine=true", { headers });
        if (res.ok) {
          const data = await res.json();
          setCourses(data.data || data);
        }
      }

      if (user.role === "STUDENT") {
        const res = await fetch("/api/enrollments", { headers });
        if (res.ok) {
          const data = await res.json();
          setEnrollments(data.data || data);
        }
      }
    }
    load();
  }, [user]);

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
            {(user.role === "INSTRUCTOR" || user.role === "ADMIN") && (
              <Link
                href="/courses/new"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark shadow-xs transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                New Course
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {(user.role === "INSTRUCTOR" || user.role === "ADMIN") && (
          <section>
            <h2 className="text-lg font-semibold text-text">My Courses</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className="group rounded-xl border border-border bg-card shadow-xs transition-all hover:shadow-md hover:-translate-y-0.5 overflow-hidden"
                >
                  <div className="aspect-[16/9] bg-gradient-to-br from-primary/10 to-accent/10 relative">
                    {course.imageUrl && (
                      <img src={course.imageUrl} alt={course.title} className="h-full w-full object-cover" loading="lazy" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute top-3 right-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        course.published
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
                      }`}>
                        {course.published ? "Published" : "Draft"}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="font-semibold text-white">{course.title}</h3>
                    </div>
                  </div>
                </Link>
              ))}
              {courses.length === 0 && (
                <div className="col-span-full rounded-xl border border-border bg-card p-8 text-center">
                  <svg className="mx-auto h-12 w-12 text-text-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <p className="mt-2 text-text-muted font-medium">No courses yet</p>
                  <Link href="/courses/new" className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:text-primary-dark font-medium">
                    Create your first course
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}

        {user.role === "STUDENT" && (
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
        )}


      </div>
    </div>
  );
}
