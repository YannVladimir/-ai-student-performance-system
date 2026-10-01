import { Loader2, AlertCircle } from "lucide-react";
import { CardSkeleton, TableSkeleton } from "./Skeleton";

export function LoadingState({
  label = "Loading...",
  type = "card",
}: {
  label?: string;
  type?: "card" | "table" | "text";
}) {
  if (type === "card") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 animate-pulse">
          <Loader2 className="animate-spin" size={14} />
          <span>{label}</span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (type === "table") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 animate-pulse">
          <Loader2 className="animate-spin" size={14} />
          <span>{label}</span>
        </div>
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 py-12 text-sm text-neutral-500 dark:text-neutral-400">
      <Loader2 className="animate-spin" size={16} />
      {label}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl bg-red-50/80 px-4 py-3.5 text-sm font-medium text-red-800 border border-red-100 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400">
      <AlertCircle size={16} className="shrink-0" />
      <span>{message}</span>
    </div>
  );
}
