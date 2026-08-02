"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Pagination } from "@/components/pagination";

interface AdminCourse {
  id: string;
  title: string;
  published: boolean;
  instructor: { id: string; name: string };
  _count: { enrollments: number };
  createdAt: string;
}

export default function AdminCoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user || user.role !== "ADMIN") return;
      setLoading(true);
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`/api/admin/courses?page=${page}&limit=10`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        const d = json.data ?? json;
        setCourses(d ?? []);
        setTotalPages(d.totalPages ?? 1);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user, page]);

  if (!user || user.role !== "ADMIN") return null;

  return (
    <div>
      <h2 className="text-lg font-semibold text-text">Courses</h2>
      <p className="mt-1 text-sm text-text-muted">All courses on the platform.</p>

      <div className="mt-6 overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="px-4 py-3 text-left font-medium text-text-muted">Title</th>
              <th className="px-4 py-3 text-left font-medium text-text-muted">Instructor</th>
              <th className="px-4 py-3 text-left font-medium text-text-muted">Status</th>
              <th className="px-4 py-3 text-left font-medium text-text-muted">Enrollments</th>
              <th className="px-4 py-3 text-left font-medium text-text-muted">Created</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <span className="inline-block h-4 w-20 animate-pulse rounded bg-surface" />
                    </td>
                  ))}
                </tr>
              ))
            ) : courses.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-muted">No courses found.</td>
              </tr>
            ) : (
              courses.map((course) => (
                <tr key={course.id} className="hover:bg-surface/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-text">{course.title}</td>
                  <td className="px-4 py-3 text-text-muted">{course.instructor.name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      course.published
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
                    }`}>
                      {course.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{course._count.enrollments}</td>
                  <td className="px-4 py-3 text-text-muted">
                    {new Date(course.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/courses/${course.id}`}
                      className="text-primary hover:underline text-sm font-medium"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex flex-col items-center gap-2">
          <p className="text-sm text-text-muted">
            Page {page} of {totalPages}
          </p>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
