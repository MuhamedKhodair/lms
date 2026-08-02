"use client";

import Link from "next/link";
import type { CourseResponse } from "@/types";

interface CourseCardProps {
  course: CourseResponse;
}

export function CourseCard({ course }: CourseCardProps) {
  return (
    <Link
      href={`/courses/${course.id}`}
      className="group block rounded-xl border border-border bg-card overflow-hidden transition-all hover:shadow-md hover:border-primary/20"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-linear-to-br from-primary/10 to-accent/10 overflow-hidden">
        {course.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.imageUrl}
            alt={course.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg className="h-16 w-16 text-primary/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        )}
        {course.category && (
          <span className="absolute left-3 top-3 rounded-full bg-black/40 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-xs">
            {course.category}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-5">
        <h3 className="font-semibold text-text leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {course.title}
        </h3>
        <p className="mt-1.5 text-sm text-text-muted line-clamp-2 leading-relaxed">
          {course.description}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {course.instructor && (
              <>
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {course.instructor.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs text-text-muted">{course.instructor.name}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {course.price > 0 ? (
              <span className="text-sm font-semibold text-text">${course.price.toFixed(2)}</span>
            ) : (
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Free</span>
            )}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3 text-xs text-text-muted">
          {course._count && (
            <>
              <span>{course._count.modules} modules</span>
              <span>·</span>
              <span>{course._count.enrollments} enrolled</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
