import type { ReactNode } from "react";

export function StatTile({
  label,
  value,
  accentClass = "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
  icon,
}: {
  label: string;
  value: string | number;
  accentClass?: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-300 dark:border-neutral-800/80 dark:bg-neutral-900/60 dark:backdrop-blur-md">
      <div className="flex items-center justify-between">
        <span className="text-xs font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          {label}
        </span>
        <div className={`rounded-xl p-2 ${accentClass} shrink-0`}>
          {icon}
        </div>
      </div>
      <div className="mt-4 text-3xl font-extrabold tracking-tight tabular-nums text-neutral-900 dark:text-white font-display">
        {value}
      </div>
    </div>
  );
}
