"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { NotificationBell } from "@/components/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";

export function Header() {
  const { user, logout } = useAuth();
  const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:3001";
  const isStaff = user?.role === "ADMIN" || user?.role === "INSTRUCTOR";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold tracking-tight text-text">
          <span className="text-primary">L</span>MS
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <ThemeToggle />
          <Link
            href="/courses"
            className="font-medium text-text-muted hover:text-text transition-colors"
          >
            Courses
          </Link>
          {user ? (
            <>
              {isStaff ? (
                <a
                  href={`${dashboardUrl}/dashboard`}
                  className="font-medium text-text-muted hover:text-text transition-colors"
                >
                  Teacher Dashboard
                </a>
              ) : (
                <Link
                  href="/dashboard"
                  className="font-medium text-text-muted hover:text-text transition-colors"
                >
                  Dashboard
                </Link>
              )}
              <Link
                href="/notifications"
                className="font-medium text-text-muted hover:text-text transition-colors"
              >
                Notifications
              </Link>
              <Link
                href="/settings"
                className="font-medium text-text-muted hover:text-text transition-colors"
              >
                Settings
              </Link>
              <NotificationBell />
              <span className="text-sm text-text-muted/60">|</span>
              <Link
                href="/settings"
                className="text-sm font-medium text-text hover:text-primary transition-colors"
              >
                {user.name}
              </Link>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                user.role === "ADMIN"
                  ? "bg-accent/10 text-accent"
                  : user.role === "INSTRUCTOR"
                  ? "bg-primary/10 text-primary"
                  : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
              }`}>
                {user.role.toLowerCase()}
              </span>
              <button
                onClick={logout}
                className="rounded-lg border border-border px-3 py-1.5 font-medium text-text-muted hover:bg-surface hover:text-text transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="font-medium text-text-muted hover:text-text transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-primary px-4 py-2 font-medium text-white hover:bg-primary-dark shadow-xs transition-all hover:shadow-sm"
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
