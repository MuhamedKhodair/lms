import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-32 text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-primary">404</p>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-text sm:text-4xl">
        Page not found
      </h1>
      <p className="mt-4 max-w-md text-text-muted">
        Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been
        moved or deleted.
      </p>
      <div className="mt-8 flex items-center gap-4">
        <Link
          href="/"
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-dark shadow-xs transition-all"
        >
          Go back home
        </Link>
        <Link
          href="/courses"
          className="rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-text hover:bg-surface shadow-xs transition-all"
        >
          Browse courses
        </Link>
      </div>
    </div>
  );
}
