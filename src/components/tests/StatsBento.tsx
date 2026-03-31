"use client";

import { type Stats } from "@/lib/types";
import { fmt } from "@/lib/utils/formatting";
import dynamic from "next/dynamic";
const TopChart = dynamic(() => import("@/components/tests/TopChart").then(m => m.TopChart), { ssr: false });

interface StatsBentoProps {
  stats: Stats;
  colName: string;
  filteredCount: number;
  search: string;
}

export function StatsBento({ stats, colName, filteredCount, search }: StatsBentoProps) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Stats column */}
      <div className="lg:col-span-4 space-y-4">
        {/* Total vehicles */}
        <div
          className="p-6 rounded-xl editorial-shadow"
          style={{ backgroundColor: "var(--surface-container-lowest)", border: "1px solid var(--border-subtle)" }}
        >
          <span
            className="text-xs font-bold uppercase tracking-[0.18em]"
            style={{ color: "var(--primary)", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}
          >
            Vehicles Tested
          </span>
          <div className="mt-3 flex items-baseline gap-2">
            <span
              className="text-5xl font-extrabold"
              style={{ fontFamily: "var(--font-inter), Inter, sans-serif", color: "var(--foreground)" }}
            >
              {stats.count}
            </span>
            <span className="text-sm" style={{ color: "var(--on-surface-variant-muted)" }}>models</span>
          </div>
          {search && (
            <p className="mt-1 text-xs" style={{ color: "var(--on-surface-variant-muted)" }}>
              {filteredCount} matching search
            </p>
          )}
        </div>

        {/* Best */}
        <div
          className="p-6 rounded-xl editorial-shadow"
          style={{ backgroundColor: "#3525cd", border: "1px solid var(--border-subtle)" }}
        >
          <span
            className="text-xs font-bold uppercase tracking-[0.18em]"
            style={{ color: "rgba(255,255,255,0.65)", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}
          >
            {stats.lowerIsBetter ? "Best (Lowest)" : "Best (Highest)"}
          </span>
          <div className="mt-2">
            <p className="text-lg font-bold leading-snug text-white" title={stats.best.name}>
              {stats.best.name.length > 28 ? stats.best.name.slice(0, 26) + "\u2026" : stats.best.name}
            </p>
            <p className="text-2xl font-extrabold mt-1" style={{ color: "var(--primary-accent)" }}>
              {fmt(stats.best.val, stats.unit)}
            </p>
          </div>
        </div>

        {/* Average */}
        <div
          className="p-6 rounded-xl editorial-shadow"
          style={{ backgroundColor: "var(--surface-container-lowest)", border: "1px solid var(--border-subtle)" }}
        >
          <span
            className="text-xs font-bold uppercase tracking-[0.18em]"
            style={{ color: "var(--on-surface-variant-muted)", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}
          >
            Average
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold" style={{ color: "var(--foreground)" }}>
              {stats.avg}
            </span>
            <span className="text-sm" style={{ color: "var(--on-surface-variant-muted)" }}>
              {stats.unit === "banana" ? "\ud83c\udf4c" : stats.unit}
            </span>
          </div>
          <div
            className="mt-4 h-1.5 rounded-full overflow-hidden"
            style={{ backgroundColor: "var(--surface-container)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                backgroundColor: "var(--primary)",
                width: stats.lowerIsBetter
                  ? `${(stats.best.val / stats.avg) * 100}%`
                  : `${(stats.avg / stats.best.val) * 100}%`,
                maxWidth: "100%",
                opacity: 0.5,
              }}
            />
          </div>
        </div>
      </div>

      {/* Chart */}
      <div
        className="lg:col-span-8 p-6 lg:p-8 rounded-xl editorial-shadow"
        style={{ backgroundColor: "var(--surface-container-lowest)", border: "1px solid var(--border-subtle)" }}
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="font-bold text-base tracking-tight" style={{ color: "var(--foreground)" }}>
              Top 10 — {colName}
            </h3>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--on-surface-variant-muted)", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}
            >
              {stats.lowerIsBetter ? "Lower is better" : "Higher is better"}
            </p>
          </div>
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: "var(--primary-container)", color: "var(--on-primary-container)" }}
          >
            {stats.unit === "banana" ? "\ud83c\udf4c banana" : stats.unit}
          </span>
        </div>
        <TopChart stats={stats} />
      </div>
    </section>
  );
}
