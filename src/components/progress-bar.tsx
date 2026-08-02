"use client";

interface ProgressBarProps {
  value: number; // 0-100
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function ProgressBar({ value, showLabel = false, size = "md" }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const heights = { sm: "h-1.5", md: "h-2.5", lg: "h-4" };

  return (
    <div className="flex items-center gap-3">
      <div className={`flex-1 ${heights[size]} w-full overflow-hidden rounded-full bg-border dark:bg-zinc-700`}>
        <div
          className="h-full rounded-full bg-linear-to-r from-primary to-accent transition-all duration-500 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-text-muted shrink-0 w-10 text-right">
          {clamped}%
        </span>
      )}
    </div>
  );
}
