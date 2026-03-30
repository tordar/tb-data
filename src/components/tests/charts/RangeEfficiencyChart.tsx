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

export function RangeEfficiencyChart() {
  const rangeSheet = useMemo(() => getTestBySlug("range")!, []);

  const data = useMemo(() => {
    return rangeSheet.rows
      .filter((r) => r[7] === "90")
      .map((r) => {
        const wh = parseNum(r[8] ?? "");
        const km = parseNum(r[10] ?? "");
        if (wh === null || km === null) return null;
        const season = r[4] ?? "Summer";
        const color = season.toLowerCase().includes("summer") ? "#34d399" : "#60a5fa";
        return { car: r[0], wh, km, season, color };
      })
      .filter(Boolean) as { car: string; wh: number; km: number; season: string; color: string }[];
  }, [rangeSheet]);

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    return <circle cx={cx} cy={cy} r={3.5} fill={payload.color} fillOpacity={0.75} />;
  };

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
          {d.km} km · {d.wh} Wh/km · {d.season}
        </div>
      </div>
    );
  };

  return (
    <div
      className="p-6 lg:p-8 rounded-xl editorial-shadow"
      style={{ backgroundColor: "var(--surface-container-lowest)", border: "1px solid var(--border-subtle)" }}
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="font-bold text-base tracking-tight" style={{ color: "var(--foreground)" }}>
            Range vs Efficiency at 90 km/h
          </h3>
          <p
            className="text-xs mt-0.5"
            style={{
              color: "var(--on-surface-variant-muted)",
              fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
            }}
          >
            Actual range achieved vs Wh/km consumed — top-left = efficient, bottom-right = large battery
          </p>
        </div>
        <div className="flex gap-4 text-xs" style={{ color: "var(--on-surface-variant-muted)" }}>
          {(
            [
              ["Summer", "#34d399"],
              ["Winter", "#60a5fa"],
            ] as const
          ).map(([s, c]) => (
            <span key={s} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: c }}
              />
              {s}
            </span>
          ))}
        </div>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 5, right: 20, bottom: 24, left: 0 }}>
            <CartesianGrid stroke="var(--border-soft)" strokeDasharray="3 3" />
            <XAxis
              dataKey="wh"
              type="number"
              name="Wh/km"
              tick={{ fill: "var(--on-surface-variant-muted)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              label={{
                value: "Wh/km",
                position: "insideBottom",
                offset: -14,
                fill: "var(--on-surface-variant-muted)",
                fontSize: 11,
              }}
            />
            <YAxis
              dataKey="km"
              type="number"
              name="km"
              tick={{ fill: "var(--on-surface-variant-muted)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              label={{
                value: "Range (km)",
                angle: -90,
                position: "insideLeft",
                offset: 15,
                fill: "var(--on-surface-variant-muted)",
                fontSize: 11,
              }}
            />
            <Tooltip isAnimationActive={false} content={<CustomTooltip />} />
            <Scatter data={data} shape={<CustomDot />} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
