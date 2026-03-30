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

export function AccelScatterChart() {
  const accelSheet = useMemo(() => getTestBySlug("acceleration")!, []);

  const data = useMemo(() => {
    const driveColors: Record<string, string> = {
      AWD: "#3525cd",
      RWD: "#34d399",
      FWD: "#fb923c",
    };
    return accelSheet.rows
      .map((r) => {
        const accel = parseNum(r[15] ?? "");
        const hpw = parseNum(r[21] ?? "");
        const drive = r[1] || "AWD";
        if (accel === null || hpw === null || hpw === 0) return null;
        return { car: r[0], accel, hpw, drive, color: driveColors[drive] ?? "#777587" };
      })
      .filter(Boolean) as { car: string; accel: number; hpw: number; drive: string; color: string }[];
  }, [accelSheet]);

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    return <circle cx={cx} cy={cy} r={4} fill={payload.color} fillOpacity={0.7} />;
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
          {d.drive} · {d.accel}s · {d.hpw.toFixed(3)} hp/kg
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
            Acceleration vs Power-to-Weight
          </h3>
          <p
            className="text-xs mt-0.5"
            style={{
              color: "var(--on-surface-variant-muted)",
              fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
            }}
          >
            0–100 km/h time vs hp/kg — lower-left = fastest relative to weight
          </p>
        </div>
        <div className="flex gap-4 text-xs" style={{ color: "var(--on-surface-variant-muted)" }}>
          {(
            [
              ["AWD", "#3525cd"],
              ["RWD", "#34d399"],
              ["FWD", "#fb923c"],
            ] as const
          ).map(([d, c]) => (
            <span key={d} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: c }}
              />
              {d}
            </span>
          ))}
        </div>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 5, right: 20, bottom: 24, left: 0 }}>
            <CartesianGrid stroke="var(--border-soft)" strokeDasharray="3 3" />
            <XAxis
              dataKey="hpw"
              type="number"
              name="hp/kg"
              tick={{ fill: "var(--on-surface-variant-muted)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              label={{
                value: "hp / kg",
                position: "insideBottom",
                offset: -14,
                fill: "var(--on-surface-variant-muted)",
                fontSize: 11,
              }}
            />
            <YAxis
              dataKey="accel"
              type="number"
              name="0-100s"
              reversed
              tick={{ fill: "var(--on-surface-variant-muted)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              label={{
                value: "0-100 (s)",
                angle: -90,
                position: "insideLeft",
                offset: 15,
                fill: "var(--on-surface-variant-muted)",
                fontSize: 11,
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter data={data} shape={<CustomDot />} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
