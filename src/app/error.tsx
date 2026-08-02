"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center px-4 py-32 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-950">
        <svg className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <h1 className="mt-6 text-3xl font-bold tracking-tight text-text sm:text-4xl">
        Something went wrong
      </h1>
      <p className="mt-4 max-w-md text-text-muted">
        An unexpected error occurred. Our team has been notified. Please try again.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-text-muted font-mono">
          Error ID: {error.digest}
        </p>
      )}
      <div className="mt-8 flex items-center gap-4">
        <button
          onClick={() => unstable_retry()}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-dark shadow-xs transition-all"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-text hover:bg-surface shadow-xs transition-all"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
}
