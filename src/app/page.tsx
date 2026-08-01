import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex-1 bg-surface">
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="mx-auto max-w-7xl px-4 py-24 sm:py-32 relative">
          <div className="max-w-2xl">
            <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-text-muted">
              Platform for lifelong learning
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-text sm:text-5xl lg:text-6xl leading-[1.1]">
              Learn anything,{" "}
              <span className="bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
                anywhere
              </span>
            </h1>
            <p className="mt-4 text-lg text-text-muted leading-relaxed max-w-xl">
              A modern learning management system for students and instructors.
              Create courses, track progress, and earn certificates — all in one place.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <Link
                href="/register"
                className="rounded-lg bg-primary px-6 py-3 font-medium text-white hover:bg-primary-dark shadow-xs transition-all hover:shadow-sm"
              >
                Start learning
              </Link>
              <Link
                href="/courses"
                className="rounded-lg border border-border bg-card px-6 py-3 font-medium text-text hover:bg-surface shadow-xs transition-all"
              >
                Browse courses
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-2xl font-bold tracking-tight text-text">
            Everything you need to learn and teach
          </h2>
          <p className="mt-3 text-text-muted">
            A complete platform for creating, managing, and consuming online courses.
          </p>
        </div>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Structured Courses",
              desc: "Organize content into modules and lessons. Support for text, video, and file attachments.",
              icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
            },
            {
              title: "Track Progress",
              desc: "Mark lessons complete, track course completion percentage, and earn certificates.",
              icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
            },
            {
              title: "Quizzes & Assessment",
              desc: "Create quizzes with auto-grading. Multiple choice and short answer questions supported.",
              icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
            },
            {
              title: "Discussions & Q&A",
              desc: "Engage with instructors and peers through course discussions and lesson comments.",
              icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
            },
            {
              title: "Certificates",
              desc: "Auto-generate completion certificates as PDFs when you finish a course.",
              icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
            },
            {
              title: "Role-Based Access",
              desc: "Admin, instructor, and student roles with tailored dashboards and permissions.",
              icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-border bg-card p-6 transition-all hover:shadow-sm hover:-translate-y-0.5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={feature.icon} />
                </svg>
              </div>
              <h3 className="mt-4 font-semibold text-text">{feature.title}</h3>
              <p className="mt-1.5 text-sm text-text-muted leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 text-center text-sm text-text-muted">
          &copy; {new Date().getFullYear()} LMS. Built with Next.js.
        </div>
      </footer>
    </div>
  );
}
