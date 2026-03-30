"use client";

import { useState, useMemo } from "react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getVehicles } from "@/lib/data/vehicles";
import { RANKING_METRICS, getMetricScores } from "@/lib/data/comparison";

const COLORS = ["#3525cd", "#34d399", "#fb923c", "#f472b6", "#60a5fa"];

export function DashboardRadar() {
  const [selected, setSelected] = useState<string[]>([
    "Tesla Model Y",
    "BMW iX",
    "Hyundai Ioniq 5",
  ]);
  const [query, setQuery] = useState("");

  const allVehicles = useMemo(() => getVehicles().map((v) => v.name), []);

  const suggestions = useMemo(() => {
    if (!query || query.length < 2) return [];
    const lower = query.toLowerCase();
    return allVehicles
      .filter((name) => name.toLowerCase().includes(lower) && !selected.includes(name))
      .slice(0, 8);
  }, [query, allVehicles, selected]);

  function addCar(car: string) {
    if (!selected.includes(car) && selected.length < 5) setSelected([...selected, car]);
    setQuery("");
  }

  const radarData = useMemo(
    () =>
      RANKING_METRICS.map((m) => {
        const point: Record<string, string | number> = { subject: m.label };
        for (const car of selected) {
          const scores = getMetricScores(car);
          point[car] = scores?.[m.key] ?? 0;
        }
        return point;
      }),
    [selected]
  );

  return (
    <div
      className="p-6 lg:p-8 rounded-xl editorial-shadow"
      style={{ backgroundColor: "var(--surface-container-lowest)", border: "1px solid var(--border-subtle)" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h3 className="font-bold text-base tracking-tight" style={{ color: "var(--foreground)" }}>
            Car Comparison
          </h3>
          <p
            className="text-xs mt-0.5"
            style={{
              color: "var(--on-surface-variant-muted)",
              fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
            }}
          >
            Up to 5 cars across 6 metrics — normalized 0–100, higher always better
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {selected.map((car, i) => (
            <span
              key={car}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: COLORS[i] + "18",
                color: COLORS[i],
                border: `1px solid ${COLORS[i]}44`,
              }}
            >
              {car}
              <button
                onClick={() => setSelected(selected.filter((c) => c !== car))}
                className="opacity-50 hover:opacity-100"
              >
                ×
              </button>
            </span>
          ))}
          {selected.length < 5 && (
            <div className="relative">
              <input
                type="text"
                placeholder="Add car…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="rounded-full py-1.5 px-4 text-sm outline-none"
                style={{
                  backgroundColor: "var(--surface-container-low)",
                  color: "var(--foreground)",
                  border: "1px solid var(--outline-variant)",
                  width: "160px",
                }}
              />
              {suggestions.length > 0 && (
                <div
                  className="absolute top-full mt-1 left-0 w-72 rounded-xl shadow-xl z-50 overflow-hidden"
                  style={{ backgroundColor: "var(--surface-container-lowest)", border: "1px solid var(--outline-variant)" }}
                >
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => addCar(s)}
                      className="w-full text-left px-4 py-2 text-sm truncate hover:bg-[#f5f3f3]"
                      style={{ color: "var(--foreground)" }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} outerRadius="70%">
            <PolarGrid stroke="var(--border-strong)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--on-surface-variant)", fontSize: 12 }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
            {selected.map((car, i) => (
              <Radar
                key={car}
                name={car}
                dataKey={car}
                stroke={COLORS[i]}
                fill={COLORS[i]}
                fillOpacity={0.1}
                strokeWidth={2}
              />
            ))}
            <Legend
              formatter={(v) => (
                <span style={{ color: "var(--on-surface-variant)", fontSize: 11 }}>{v}</span>
              )}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid var(--outline-variant)",
                backgroundColor: "var(--surface-container-lowest)",
                boxShadow: "0 8px 32px rgba(27,28,28,0.08)",
              }}
              formatter={(value: unknown, name: unknown) => {
                return [`${value} pts`, String(name)];
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
