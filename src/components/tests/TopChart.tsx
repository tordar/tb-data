"use client";

import { useRef, useState, useEffect, useMemo } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);

  useEffect(() => {
    function updateWidth() {
      if (!containerRef.current) return;
      setContainerWidth(containerRef.current.offsetWidth);
    }
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const isSmall = containerWidth < 500;
  const data = stats.top10;

  const labelWidth = isSmall ? Math.max(120, Math.floor(containerWidth * 0.45)) : 210;
  const chartHeight = isSmall ? 480 : 360;

  return (
    <div ref={containerRef}>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 4, right: isSmall ? 16 : 48, left: 0, bottom: 4 }}
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
            tick={{ fontSize: isSmall ? 10 : 11, fill: "var(--on-surface-variant)", fontFamily: "var(--font-inter), Inter, sans-serif" }}
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
