"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { type Stats } from "@/lib/sheet-utils";

export function TopChart({ stats }: { stats: Stats }) {
  const data = [...stats.top10].reverse();

  return (
    <ResponsiveContainer width="100%" height={360}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 4, right: 48, left: 0, bottom: 4 }}
      >
        <XAxis
          type="number"
          tick={{ fontSize: 10, fill: "var(--on-surface-variant-muted)", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={210}
          tick={{ fontSize: 11, fill: "var(--on-surface-variant)", fontFamily: "var(--font-inter), Inter, sans-serif" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(value: unknown) => [
            `${value} ${stats.unit === "banana" ? "🍌" : stats.unit}`,
            "",
          ]}
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: "1px solid var(--outline-variant)",
            backgroundColor: "var(--surface-container-lowest)",
            boxShadow: "0 8px 32px rgba(27,28,28,0.08)",
          }}
          cursor={{ fill: "rgba(53,37,205,0.04)" }}
        />
        <Bar dataKey="val" radius={[0, 4, 4, 0]}>
          {data.map((_, idx) => (
            <Cell
              key={idx}
              fill={
                idx === data.length - 1
                  ? "#3525cd"
                  : `rgba(53,37,205,${0.25 + (idx / data.length) * 0.65})`
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
