"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { getTestBySlug } from "@/lib/data/tests";
import { parseNum } from "@/lib/utils/parsing";

export function WinterPenaltyChart() {
  const sheet = useMemo(() => getTestBySlug("range")!, []);

  const data = useMemo(() => {
    // col indices: Car=0, Season=4, Speed=7, km=10
    const summer: Record<string, number> = {};
    const winter: Record<string, number> = {};

    for (const r of sheet.rows) {
      if (r[7] !== "90") continue;
      const name = r[0];
      const season = (r[4] ?? "").toLowerCase();
      const km = parseNum(r[10] ?? "");
      if (!name || km === null) continue;

      if (season.includes("summer")) {
        if (summer[name] === undefined || km > summer[name]) summer[name] = km;
      } else if (season.includes("winter")) {
        if (winter[name] === undefined || km > winter[name]) winter[name] = km;
      }
    }

    return Object.keys(summer)
      .filter((name) => winter[name] !== undefined && winter[name] < summer[name])
      .map((name) => ({
        name: name.length > 30 ? name.slice(0, 28) + "\u2026" : name,
        summer: summer[name],
        winter: winter[name],
        penalty: Math.round((1 - winter[name] / summer[name]) * 100),
        retained: Math.round((winter[name] / summer[name]) * 100),
      }))
      .sort((a, b) => b.penalty - a.penalty);
  }, [sheet]);

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
          {d.name}
        </div>
        <div style={{ color: "var(--on-surface-variant-muted)" }}>
          Summer: {d.summer} km · Winter: {d.winter} km
        </div>
        <div style={{ color: "#60a5fa", fontWeight: 600 }}>
          −{d.penalty}% in winter ({d.retained}% retained)
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
          Winter Range Penalty at 90 km/h
        </h3>
        <p
          className="text-xs mt-0.5"
          style={{ color: "var(--on-surface-variant-muted)", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}
        >
          % range lost in winter vs summer — {data.length} cars with both seasonal tests
        </p>
      </div>
      <div style={{ height: Math.max(320, data.length * 28) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 60, bottom: 4, left: 0 }}
          >
            <CartesianGrid stroke="var(--border-soft)" strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 60]}
              tick={{ fill: "var(--on-surface-variant-muted)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={200}
              tick={{ fill: "var(--on-surface-variant-muted)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip isAnimationActive={false} content={<CustomTooltip />} cursor={{ fill: "var(--surface-container)", opacity: 0.5 }} />
            <ReferenceLine x={20} stroke="var(--on-surface-variant-muted)" strokeDasharray="4 3" strokeOpacity={0.35} />
            <Bar dataKey="penalty" radius={[0, 4, 4, 0]} maxBarSize={18}>
              {data.map((d) => (
                <Cell
                  key={d.name}
                  fill={d.penalty > 40 ? "#f43f5e" : d.penalty > 25 ? "#f97316" : d.penalty > 15 ? "#60a5fa" : "#34d399"}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
