import Link from "next/link";

interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  published: boolean;
  imageUrl?: string | null;
  enrollments?: number;
  modules?: number;
}

export function CourseCard({ id, title, description, published, imageUrl, enrollments = 0, modules = 0 }: CourseCardProps) {
  return (
    <Link
      href={`/dashboard/courses/${id}`}
      className="group rounded-xl border border-border bg-card overflow-hidden transition-all hover:shadow-sm hover:-translate-y-0.5"
    >
      <div className="h-32 w-full overflow-hidden bg-surface">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl font-bold text-primary/20">
            {title.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-text group-hover:text-primary transition-colors line-clamp-1">
            {title}
          </h3>
          <span
            className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              published
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
            }`}
          >
            {published ? "Published" : "Draft"}
          </span>
        </div>
        <p className="mt-1.5 line-clamp-2 text-sm text-text-muted">{description}</p>
        <div className="mt-3 flex items-center gap-4 text-xs text-text-muted">
          <span>{modules} modules</span>
          <span>{enrollments} students</span>
        </div>
      </div>
    </Link>
  );
}
