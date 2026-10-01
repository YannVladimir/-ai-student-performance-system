import type { ReactNode } from "react";

export function Card({
  title,
  action,
  children,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-800/80 dark:bg-neutral-900/60 dark:backdrop-blur-md">
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4.5 dark:border-neutral-800/80">
          {title && (
            <h2 className="text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      <div className="px-6 py-5.5">{children}</div>
    </div>
  );
}
