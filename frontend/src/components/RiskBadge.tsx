import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from "lucide-react";
import type { RiskLevel } from "../types";
import { RISK_LABEL } from "../lib/risk";

const CONFIG: Record<RiskLevel, { icon: typeof CheckCircle2; classes: string }> = {
  LOW: {
    icon: CheckCircle2,
    classes:
      "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/30",
  },
  MEDIUM: {
    icon: AlertTriangle,
    classes:
      "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30",
  },
  HIGH: {
    icon: XCircle,
    classes:
      "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/30",
  },
  NOT_YET_PREDICTED: {
    icon: HelpCircle,
    classes:
      "bg-neutral-100 text-neutral-600 ring-neutral-500/20 dark:bg-neutral-500/10 dark:text-neutral-400 dark:ring-neutral-500/30",
  },
};

export function RiskBadge({ level, size = "md" }: { level: RiskLevel; size?: "sm" | "md" }) {
  const { icon: Icon, classes } = CONFIG[level];
  const padding = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm";
  const iconSize = size === "sm" ? 12 : 14;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset ${padding} ${classes}`}
    >
      <Icon size={iconSize} strokeWidth={2.5} />
      {RISK_LABEL[level]}
    </span>
  );
}
