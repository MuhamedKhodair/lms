"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { CourseCard } from "@/components/course-card";
import { Pagination } from "@/components/pagination";

interface CourseItem {
  id: string;
  title: string;
  description: string;
  published: boolean;
  imageUrl: string | null;
  instructor?: { id: string; name: string; email: string };
  _count?: { enrollments: number; modules: number };
}

export default function CoursesPage() {
  const { user } = useAuth();
  const [data, setData] = useState<CourseItem[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === "ADMIN";
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!token) return;
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, token]);

  useEffect(() => {
    if (!user || !token) return;
    let cancelled = false;

    async function load() {
      const url = isAdmin
        ? `/api/admin/courses?page=${page}&limit=12&search=${encodeURIComponent(search)}`
        : `/api/courses?mine=true&page=${page}&limit=12&search=${encodeURIComponent(search)}`;
      try {
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const d = await res.json();
          if (!cancelled) {
            setData(d.data || []);
            setTotalPages(d.totalPages || 1);
            setTotal(d.total || 0);
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
  }, [user, token, page, search, isAdmin]);

  if (!user) return null;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">
            {isAdmin ? "All Courses" : "My Courses"}
          </h1>
          <p className="mt-1 text-text-muted">
            {isAdmin ? "Manage every course on the platform" : "Create, edit, and publish your courses"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search courses..."
            className="w-56 rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
          />
          <Link
            href="/dashboard/courses/new"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
          >
            New Course
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
        </div>
      ) : data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-text-muted">
            {search ? "No courses match your search." : isAdmin ? "No courses yet." : "You haven't created any courses yet."}
          </p>
          {!search && !isAdmin && (
            <Link
              href="/dashboard/courses/new"
              className="mt-2 inline-block font-medium text-primary hover:underline"
            >
              Create your first course
            </Link>
          )}
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-text-muted">{total} courses</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((c) => (
              <CourseCard
                key={c.id}
                id={c.id}
                title={c.title}
                description={c.description}
                published={c.published}
                imageUrl={c.imageUrl}
                enrollments={c._count?.enrollments || 0}
                modules={c._count?.modules || 0}
              />
            ))}
          </div>
          <div className="mt-8">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </>
      )}
    </div>
  );
}
