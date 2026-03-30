"use client";

import { useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { getTestBySlug } from "@/lib/data/tests";
import { parseNum } from "@/lib/utils/parsing";

export function DegradationScatterChart() {
  const degSheet = useMemo(() => getTestBySlug("degradation")!, []);

  const data = useMemo(() => {
    return degSheet.rows
      .map((r) => {
        const odo = parseNum(r[3] ?? "");
        const degr = parseNum(r[8] ?? "");
        if (odo === null || degr === null) return null;
        return { car: r[0], odo, degr };
      })
      .filter(Boolean) as { car: string; odo: number; degr: number }[];
  }, [degSheet]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div
        className="rounded-xl p-2 text-xs"
        style={{
          backgroundColor: "var(--surface-container-lowest)",
          border: "1px solid var(--outline-variant)",
          boxShadow: "0 8px 32px rgba(27,28,28,0.08)",
        }}
      >
        <div className="font-semibold" style={{ color: "var(--foreground)" }}>
          {d.car}
        </div>
        <div style={{ color: "var(--on-surface-variant-muted)" }}>
          {d.odo}k km · {d.degr.toFixed(1)}% degradation
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
          Battery Degradation
        </h3>
        <p
          className="text-xs mt-0.5"
          style={{
            color: "var(--on-surface-variant-muted)",
            fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
          }}
        >
          Odometer (thousands of km) vs measured capacity loss
        </p>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 5, right: 20, bottom: 24, left: 0 }}>
            <CartesianGrid stroke="var(--border-soft)" strokeDasharray="3 3" />
            <XAxis
              dataKey="odo"
              type="number"
              name="Odo"
              tick={{ fill: "var(--on-surface-variant-muted)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              label={{
                value: "Odometer (1000 km)",
                position: "insideBottom",
                offset: -14,
                fill: "var(--on-surface-variant-muted)",
                fontSize: 11,
              }}
            />
            <YAxis
              dataKey="degr"
              type="number"
              name="Degradation %"
              tick={{ fill: "var(--on-surface-variant-muted)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              label={{
                value: "Degradation %",
                angle: -90,
                position: "insideLeft",
                offset: 15,
                fill: "var(--on-surface-variant-muted)",
                fontSize: 11,
              }}
            />
            <Tooltip isAnimationActive={false} content={<CustomTooltip />} />
            <Scatter data={data} fill="#3525cd" fillOpacity={0.65} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
