import type { RiskLevel } from "../types";

// Fixed status palette (validated, colorblind-safe) -- never themed, never
// reused for anything but state. See dataviz skill references/palette.md.
export const STATUS_COLOR = {
  good: "#0ca30c",
  warning: "#fab219",
  critical: "#d03b3b",
} as const;

export const RISK_COLOR: Record<Exclude<RiskLevel, "NOT_YET_PREDICTED">, string> = {
  LOW: STATUS_COLOR.good,
  MEDIUM: STATUS_COLOR.warning,
  HIGH: STATUS_COLOR.critical,
};

export const RISK_LABEL: Record<RiskLevel, string> = {
  LOW: "Low risk",
  MEDIUM: "Medium risk",
  HIGH: "High risk",
  NOT_YET_PREDICTED: "Not yet predicted",
};
