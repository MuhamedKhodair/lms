"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Pagination } from "@/components/pagination";
import type { CourseResponse, PaginatedResponse } from "@/types";

function CourseCard({ course }: { course: CourseResponse }) {
  const imgSrc = course.imageUrl || `/api/placeholder?text=${encodeURIComponent(course.title)}`;
  const catColors: Record<string, string> = {
    programming: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
    design: "bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-300",
    business: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    science: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    math: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  };

  return (
    <Link
      href={`/courses/${course.id}`}
      className="group rounded-xl border border-border bg-card shadow-xs transition-all hover:shadow-md hover:-translate-y-0.5 overflow-hidden"
    >
      <div className="aspect-[16/9] bg-gradient-to-br from-primary/10 to-accent/10 relative overflow-hidden">
        {imgSrc.startsWith("http") ? (
          <img
            src={imgSrc}
            alt={course.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-6">
            <span className="text-4xl font-bold text-primary/20">
              {course.title.charAt(0)}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        {course.price > 0 && (
          <span className="absolute top-3 right-3 rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
            ${course.price}
          </span>
        )}
        {!course.published && (
          <span className="absolute top-3 left-3 rounded-full bg-zinc-900/70 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-xs">
            Draft
          </span>
        )}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-lg font-semibold text-white leading-tight">
            {course.title}
          </h3>
        </div>
      </div>
      <div className="p-4 space-y-2">
        <p className="text-sm text-text-muted line-clamp-2 leading-relaxed">
          {course.description}
        </p>
        <div className="flex items-center justify-between text-xs text-text-muted">
          <div className="flex items-center gap-2">
            <span className="font-medium text-text">{course.instructor?.name}</span>
          </div>
          <div className="flex items-center gap-2">
            {course.category && (
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${catColors[course.category] || "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"}`}>
                {course.category}
              </span>
            )}
            {course._count && (
              <span className="text-text-muted">{course._count.enrollments} enrolled</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function CoursesPage() {
  const [data, setData] = useState<PaginatedResponse<CourseResponse> | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);

  // Debounce search input 400ms
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    async function load() {
      const params = new URLSearchParams({ page: String(page), limit: "12" });
      if (search) params.set("search", search);
      if (category) params.set("category", category);
      const res = await fetch(`/api/courses?${params}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    }
    load();
  }, [page, search, category]);

  return (
    <div className="min-h-screen bg-surface">
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <h1 className="text-3xl font-bold tracking-tight text-text">
            Explore Courses
          </h1>
          <p className="mt-2 text-text-muted max-w-2xl">
            Discover courses crafted by expert instructors. Learn at your own pace and earn certificates.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1 max-w-md">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search courses..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="block w-full rounded-lg border border-border bg-card pl-10 pr-3 py-2.5 text-sm text-text placeholder:text-text-muted shadow-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="block rounded-lg border border-border bg-white px-3 py-2.5 text-sm shadow-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="">All categories</option>
              <option value="programming">Programming</option>
              <option value="design">Design</option>
              <option value="business">Business</option>
              <option value="science">Science</option>
              <option value="math">Math</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mt-2 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data?.data.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
          {data?.data.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
              <svg className="w-12 h-12 text-text-muted/50 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p className="text-text-muted font-medium">No courses found</p>
              <p className="text-sm text-text-muted/70 mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </div>

        {data && (
          <div className="mt-10">
            <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}
