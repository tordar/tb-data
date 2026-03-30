"use client";

import { useMemo } from "react";
import {
  ComposedChart,
  Scatter,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { getTestBySlug } from "@/lib/data/tests";
import { parseNum } from "@/lib/utils/parsing";

export function WltpRealityChart() {
  const sheet = useMemo(() => getTestBySlug("sunday")!, []);

  const data = useMemo(() => {
    return sheet.rows
      .map((r) => {
        const wltp = parseNum(r[9] ?? "");
        const actual = parseNum(r[8] ?? "");
        if (wltp === null || actual === null || wltp === 0) return null;
        const diff = actual - wltp;
        return { car: r[0], wltp, actual, diff };
      })
      .filter(Boolean) as { car: string; wltp: number; actual: number; diff: number }[];
  }, [sheet]);

  const { min, max } = useMemo(() => {
    const wltps = data.map((d) => d.wltp);
    const actuals = data.map((d) => d.actual);
    return {
      min: Math.min(...wltps, ...actuals) - 20,
      max: Math.max(...wltps, ...actuals) + 20,
    };
  }, [data]);

  const parityLine = useMemo(
    () => [{ wltp: min, actual: min }, { wltp: max, actual: max }],
    [min, max]
  );

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    const color = payload.diff >= 0 ? "#34d399" : "#f43f5e";
    return <circle cx={cx} cy={cy} r={3.5} fill={color} fillOpacity={0.8} />;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    if (!d?.car) return null;
    const pct = ((d.actual / d.wltp - 1) * 100).toFixed(1);
    const sign = d.diff >= 0 ? "+" : "";
    return (
      <div
        className="rounded-xl p-2 text-xs"
        style={{
          backgroundColor: "var(--surface-container-lowest)",
          border: "1px solid var(--outline-variant)",
          boxShadow: "0 8px 32px rgba(27,28,28,0.08)",
          maxWidth: 220,
        }}
      >
        <div className="font-semibold" style={{ color: "var(--foreground)" }}>
          {d.car}
        </div>
        <div style={{ color: "var(--on-surface-variant-muted)" }}>
          WLTP: {d.wltp} km · Actual: {d.actual} km
        </div>
        <div style={{ color: d.diff >= 0 ? "#34d399" : "#f43f5e", fontWeight: 600 }}>
          {sign}{pct}% vs WLTP
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
            WLTP vs Reality
          </h3>
          <p
            className="text-xs mt-0.5"
            style={{ color: "var(--on-surface-variant-muted)", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}
          >
            Claimed range vs measured — points above the line beat their WLTP rating
          </p>
        </div>
        <div className="flex gap-4 text-xs shrink-0" style={{ color: "var(--on-surface-variant-muted)" }}>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: "#34d399" }} />
            Beats WLTP
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: "#f43f5e" }} />
            Falls short
          </span>
        </div>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart margin={{ top: 5, right: 20, bottom: 24, left: 0 }}>
            <CartesianGrid stroke="var(--border-soft)" strokeDasharray="3 3" />
            <XAxis
              dataKey="wltp"
              type="number"
              domain={[min, max]}
              tick={{ fill: "var(--on-surface-variant-muted)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              label={{ value: "WLTP claimed (km)", position: "insideBottom", offset: -14, fill: "var(--on-surface-variant-muted)", fontSize: 11 }}
            />
            <YAxis
              dataKey="actual"
              type="number"
              domain={[min, max]}
              tick={{ fill: "var(--on-surface-variant-muted)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              label={{ value: "Actual (km)", angle: -90, position: "insideLeft", offset: 15, fill: "var(--on-surface-variant-muted)", fontSize: 11 }}
            />
            <Tooltip isAnimationActive={false} content={<CustomTooltip />} />
            <Line
              data={parityLine}
              dataKey="actual"
              dot={false}
              activeDot={false}
              strokeDasharray="5 4"
              stroke="var(--on-surface-variant-muted)"
              strokeWidth={1}
              strokeOpacity={0.4}
            />
            <Scatter data={data} shape={<CustomDot />} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
