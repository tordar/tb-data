"use client";

import { useRef, useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { type Stats } from "@/lib/types";

export function TopChart({ stats }: { stats: Stats }) {
  const data = stats.top10;
  const containerRef = useRef<HTMLDivElement>(null);
  const [labelWidth, setLabelWidth] = useState(210);

  useEffect(() => {
    function updateWidth() {
      if (!containerRef.current) return;
      const w = containerRef.current.offsetWidth;
      // On small screens, use ~40% for labels; on large screens, fixed 210
      setLabelWidth(w < 500 ? Math.max(80, Math.floor(w * 0.35)) : 210);
    }
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  return (
    <div ref={containerRef}>
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
            width={labelWidth}
            tick={{ fontSize: labelWidth < 150 ? 10 : 11, fill: "var(--on-surface-variant)", fontFamily: "var(--font-inter), Inter, sans-serif" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            isAnimationActive={false}
            formatter={(value: unknown) => [
              `${value} ${stats.unit === "banana" ? "\ud83c\udf4c" : stats.unit}`,
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
                  idx === 0
                    ? "#3525cd"
                    : `rgba(53,37,205,${0.9 - (idx / data.length) * 0.65})`
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
