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
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!user || user.role !== "ADMIN") return;
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/admin/courses?page=${page}&limit=10`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        setCourses(json.data ?? []);
        setTotalPages(json.totalPages ?? 1);
        setTotal(json.total ?? 0);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user, page]);

  const togglePublish = async (course: AdminCourse) => {
    setBusyId(course.id);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/courses/${course.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ published: !course.published }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to update course");
        return;
      }
      setCourses((prev) =>
        prev.map((c) => (c.id === course.id ? { ...c, published: !course.published } : c))
      );
    } catch (e) {
      console.error(e);
    } finally {
      setBusyId(null);
    }
  };

  const deleteCourse = async (id: string, title: string) => {
    if (!confirm(`Delete course "${title}"? This cannot be undone.`)) return;
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/admin/courses/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Failed to delete course");
      return;
    }
    setCourses((prev) => prev.filter((c) => c.id !== id));
  };

  if (!user || user.role !== "ADMIN") return null;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text">Courses</h2>
          <p className="mt-1 text-sm text-text-muted">All courses on the platform.</p>
        </div>
        {total > 0 && <p className="text-sm text-text-muted">{total} total</p>}
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="px-4 py-3 text-left font-medium text-text-muted">Title</th>
              <th className="px-4 py-3 text-left font-medium text-text-muted">Instructor</th>
              <th className="px-4 py-3 text-left font-medium text-text-muted">Status</th>
              <th className="px-4 py-3 text-left font-medium text-text-muted">Enrollments</th>
              <th className="px-4 py-3 text-left font-medium text-text-muted">Created</th>
              <th className="px-4 py-3 text-right font-medium text-text-muted">Actions</th>
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
                    <button
                      onClick={() => togglePublish(course)}
                      disabled={busyId === course.id}
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                        course.published
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900"
                          : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                      }`}
                      title={course.published ? "Click to unpublish" : "Click to publish"}
                    >
                      {course.published ? "Published" : "Draft"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{course._count.enrollments}</td>
                  <td className="px-4 py-3 text-text-muted">
                    {new Date(course.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/courses/${course.id}`}
                        className="text-primary hover:underline text-sm font-medium"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => deleteCourse(course.id, course.title)}
                        className="text-danger hover:underline text-xs font-medium"
                      >
                        Delete
                      </button>
                    </div>
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
