"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { findSheet } from "@/lib/chart-utils";
import { parseNum } from "@/lib/sheet-utils";

export function NoiseHistogramChart() {
  const noiseSheet = useMemo(() => findSheet("Noise"), []);

  const data = useMemo(() => {
    const buckets = new Map<number, number>();
    for (const row of noiseSheet.rows) {
      const n = parseNum(row[9] ?? "");
      if (n === null) continue;
      const bucket = Math.round(n * 2) / 2;
      buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
    }
    return Array.from(buckets.entries())
      .sort(([a], [b]) => a - b)
      .map(([db, count]) => ({ db: db.toFixed(1), count }));
  }, [noiseSheet]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div
        className="rounded-xl p-2 text-xs"
        style={{
          backgroundColor: "var(--surface-container-lowest)",
          border: "1px solid var(--outline-variant)",
          boxShadow: "0 8px 32px rgba(27,28,28,0.08)",
        }}
      >
        <div style={{ color: "var(--foreground)" }}>{label} dB</div>
        <div style={{ color: "var(--on-surface-variant-muted)" }}>
          {payload[0].value} test{payload[0].value !== 1 ? "s" : ""}
        </div>
      </div>
    );
  };

  return (
    <div
      className="p-6 lg:p-8 rounded-xl editorial-shadow"
      style={{ backgroundColor: "var(--surface-container-lowest)", border: "1px solid var(--border-subtle)" }}
    >
      <div className="mb-6">
        <h3 className="font-bold text-base tracking-tight" style={{ color: "var(--foreground)" }}>
          Cabin Noise Distribution
        </h3>
        <p
          className="text-xs mt-0.5"
          style={{
            color: "var(--on-surface-variant-muted)",
            fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
          }}
        >
          Average dB across all tests (0.5 dB buckets) — green = quieter, red = louder
        </p>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, bottom: 24, left: 0 }}>
            <CartesianGrid
              stroke="var(--border-soft)"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="db"
              tick={{ fill: "var(--on-surface-variant-muted)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              label={{
                value: "Average dB",
                position: "insideBottom",
                offset: -14,
                fill: "var(--on-surface-variant-muted)",
                fontSize: 11,
              }}
              interval={3}
            />
            <YAxis tick={{ fill: "var(--on-surface-variant-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(53,37,205,0.04)" }} />
            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fill={
                    i < data.length * 0.33
                      ? "#34d399"
                      : i < data.length * 0.66
                      ? "#3525cd"
                      : "#f87171"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
