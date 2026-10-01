import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { STATUS_COLOR } from "../lib/risk";

export interface RiskBarDatum {
  name: string;
  low: number;
  medium: number;
  high: number;
}

const LEGEND_LABELS: Record<string, string> = {
  low: "Low risk",
  medium: "Medium risk",
  high: "High risk",
};

export function RiskStackedBar({ data, height = 320 }: { data: RiskBarDatum[]; height?: number }) {
  if (data.length === 0) {
    return <p className="text-sm text-neutral-500 dark:text-neutral-400">No data yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke="#e1e0d9" strokeDasharray="0" />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "#898781" }} axisLine={{ stroke: "#c3c2b7" }} tickLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          width={140}
          tick={{ fontSize: 12, fill: "#52514e" }}
          axisLine={{ stroke: "#c3c2b7" }}
          tickLine={false}
        />
        <Tooltip
          formatter={(value, key) => [value, LEGEND_LABELS[key as string] ?? key]}
          contentStyle={{ borderRadius: 8, borderColor: "#e1e0d9", fontSize: 13 }}
        />
        <Legend
          formatter={(key) => LEGEND_LABELS[key as string] ?? key}
          wrapperStyle={{ fontSize: 13 }}
        />
        <Bar dataKey="low" stackId="risk" fill={STATUS_COLOR.good} radius={[0, 0, 0, 0]} />
        <Bar dataKey="medium" stackId="risk" fill={STATUS_COLOR.warning} />
        <Bar dataKey="high" stackId="risk" fill={STATUS_COLOR.critical} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
