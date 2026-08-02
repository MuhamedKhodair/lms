import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="text-xl font-bold tracking-tight text-text">
              <span className="text-primary">L</span>MS
            </Link>
            <p className="mt-2 text-sm text-text-muted">
              A modern learning management system for students and instructors.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text">Platform</h3>
            <ul className="mt-3 space-y-2">
              <li><Link href="/courses" className="text-sm text-text-muted hover:text-text transition-colors">Courses</Link></li>
              <li><Link href="/register" className="text-sm text-text-muted hover:text-text transition-colors">Become an instructor</Link></li>
              <li><Link href="/dashboard" className="text-sm text-text-muted hover:text-text transition-colors">My learning</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text">Support</h3>
            <ul className="mt-3 space-y-2">
              <li><Link href="#" className="text-sm text-text-muted hover:text-text transition-colors">Help center</Link></li>
              <li><Link href="#" className="text-sm text-text-muted hover:text-text transition-colors">Contact us</Link></li>
              <li><Link href="#" className="text-sm text-text-muted hover:text-text transition-colors">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text">Legal</h3>
            <ul className="mt-3 space-y-2">
              <li><Link href="#" className="text-sm text-text-muted hover:text-text transition-colors">Privacy policy</Link></li>
              <li><Link href="#" className="text-sm text-text-muted hover:text-text transition-colors">Terms of service</Link></li>
              <li><Link href="#" className="text-sm text-text-muted hover:text-text transition-colors">Cookie policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-border pt-6 text-center text-sm text-text-muted">
          &copy; {new Date().getFullYear()} LMS. Built with Next.js.
        </div>
      </div>
    </footer>
  );
}
