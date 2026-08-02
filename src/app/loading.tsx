export default function Loading() {
  return (
    <div className="flex items-center justify-center px-4 py-32">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-border border-t-primary" />
        <p className="text-sm text-text-muted">Loading...</p>
      </div>
    </div>
  );
}
