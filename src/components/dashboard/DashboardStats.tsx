"use client";

import { useMemo } from "react";
import { getAllTestSheets } from "@/lib/data/tests";
import { parseNum } from "@/lib/utils/parsing";

export function DashboardStats() {
  const sheets = useMemo(() => getAllTestSheets(), []);

  const totalRows = useMemo(() => sheets.reduce((sum, s) => sum + s.rows.length, 0), [sheets]);

  const uniqueCars = useMemo(
    () => new Set(sheets.flatMap((s) => s.rows.map((r) => r[0]).filter(Boolean))).size,
    [sheets]
  );

  const bestRange = useMemo(() => {
    const rangeSheet = sheets.find((s) => s.slug === "range");
    if (!rangeSheet) return null;
    const speedIdx = rangeSheet.headers.indexOf("Speed");
    const kmIdx = rangeSheet.headers.indexOf("km");
    if (speedIdx < 0 || kmIdx < 0) return null;
    let best: { name: string; val: number } | null = null;
    for (const row of rangeSheet.rows) {
      if (row[speedIdx] !== "90") continue;
      const n = parseNum(row[kmIdx] ?? "");
      if (n !== null && (best === null || n > best.val)) best = { name: row[0], val: n };
    }
    return best;
  }, [sheets]);

  const fastestAccel = useMemo(() => {
    const accelSheet = sheets.find((s) => s.slug === "acceleration");
    if (!accelSheet) return null;
    const colIdx = accelSheet.headers.indexOf("0-100");
    if (colIdx < 0) return null;
    let best: { name: string; val: number } | null = null;
    for (const row of accelSheet.rows) {
      const n = parseNum(row[colIdx] ?? "");
      if (n !== null && n > 0 && (best === null || n < best.val)) best = { name: row[0], val: n };
    }
    return best;
  }, [sheets]);

  const quietest = useMemo(() => {
    const noiseSheet = sheets.find((s) => s.slug === "noise");
    if (!noiseSheet) return null;
    const colIdx = noiseSheet.headers.indexOf("Average");
    if (colIdx < 0) return null;
    let best: { name: string; val: number } | null = null;
    for (const row of noiseSheet.rows) {
      const n = parseNum(row[colIdx] ?? "");
      if (n !== null && (best === null || n < best.val)) best = { name: row[0], val: n };
    }
    return best;
  }, [sheets]);

  const bestBraking = useMemo(() => {
    const brakingSheet = sheets.find((s) => s.slug === "braking");
    if (!brakingSheet) return null;
    const colIdx = brakingSheet.headers.indexOf("Distance");
    if (colIdx < 0) return null;
    let best: { name: string; val: number } | null = null;
    for (const row of brakingSheet.rows) {
      const n = parseNum(row[colIdx] ?? "");
      if (n !== null && n > 0 && (best === null || n < best.val)) best = { name: row[0], val: n };
    }
    return best;
  }, [sheets]);

  return (
    <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {/* Total test entries */}
      <div
        className="p-6 rounded-xl editorial-shadow"
        style={{ backgroundColor: "var(--surface-container-lowest)", border: "1px solid var(--border-subtle)" }}
      >
        <span
          className="text-xs font-bold uppercase tracking-[0.18em]"
          style={{ color: "var(--primary)", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}
        >
          Test Entries
        </span>
        <div className="mt-3">
          <span
            className="text-4xl font-extrabold"
            style={{ fontFamily: "var(--font-inter), Inter, sans-serif", color: "var(--foreground)" }}
          >
            {totalRows.toLocaleString()}
          </span>
        </div>
        <p className="mt-1 text-xs" style={{ color: "var(--on-surface-variant-muted)" }}>
          across {sheets.length} test categories
        </p>
      </div>

      {/* Unique EVs */}
      <div
        className="p-6 rounded-xl editorial-shadow"
        style={{ backgroundColor: "var(--surface-container-lowest)", border: "1px solid var(--border-subtle)" }}
      >
        <span
          className="text-xs font-bold uppercase tracking-[0.18em]"
          style={{ color: "var(--primary)", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}
        >
          Unique EVs
        </span>
        <div className="mt-3 flex items-baseline gap-2">
          <span
            className="text-4xl font-extrabold"
            style={{ fontFamily: "var(--font-inter), Inter, sans-serif", color: "var(--foreground)" }}
          >
            {uniqueCars}
          </span>
          <span className="text-sm" style={{ color: "var(--on-surface-variant-muted)" }}>models</span>
        </div>
        <p className="mt-1 text-xs" style={{ color: "var(--on-surface-variant-muted)" }}>
          distinct vehicles in the dataset
        </p>
      </div>

      {/* Best range */}
      {bestRange && (
        <div
          className="p-6 rounded-xl editorial-shadow"
          style={{ backgroundColor: "#3525cd", border: "1px solid var(--border-subtle)" }}
        >
          <span
            className="text-xs font-bold uppercase tracking-[0.18em]"
            style={{ color: "rgba(255,255,255,0.65)", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}
          >
            Best Range · 90 km/h
          </span>
          <div className="mt-3">
            <span className="text-3xl font-extrabold" style={{ color: "var(--primary-accent)" }}>
              {bestRange.val} km
            </span>
            <p className="text-sm font-semibold text-white mt-1">{bestRange.name}</p>
          </div>
          <p className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
            summer, 90 km/h highway
          </p>
        </div>
      )}

      {/* Fastest 0-100 */}
      {fastestAccel && (
        <div
          className="p-6 rounded-xl editorial-shadow"
          style={{ backgroundColor: "var(--surface-container-lowest)", border: "1px solid var(--border-subtle)" }}
        >
          <span
            className="text-xs font-bold uppercase tracking-[0.18em]"
            style={{ color: "var(--on-surface-variant-muted)", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}
          >
            Fastest 0–100
          </span>
          <div className="mt-3 flex items-baseline gap-1">
            <span
              className="text-3xl font-extrabold"
              style={{ fontFamily: "var(--font-inter), Inter, sans-serif", color: "var(--foreground)" }}
            >
              {fastestAccel.val}
            </span>
            <span className="text-sm" style={{ color: "var(--on-surface-variant-muted)" }}>s</span>
          </div>
          <p className="mt-1 text-xs truncate" style={{ color: "var(--on-surface-variant-muted)" }} title={fastestAccel.name}>
            {fastestAccel.name}
          </p>
        </div>
      )}

      {/* Quietest cabin */}
      {quietest && (
        <div
          className="p-6 rounded-xl editorial-shadow"
          style={{ backgroundColor: "var(--surface-container-lowest)", border: "1px solid var(--border-subtle)" }}
        >
          <span
            className="text-xs font-bold uppercase tracking-[0.18em]"
            style={{ color: "var(--on-surface-variant-muted)", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}
          >
            Quietest Cabin
          </span>
          <div className="mt-3 flex items-baseline gap-1">
            <span
              className="text-3xl font-extrabold"
              style={{ fontFamily: "var(--font-inter), Inter, sans-serif", color: "var(--foreground)" }}
            >
              {Math.round(quietest.val * 10) / 10}
            </span>
            <span className="text-sm" style={{ color: "var(--on-surface-variant-muted)" }}>dB</span>
          </div>
          <p className="mt-1 text-xs truncate" style={{ color: "var(--on-surface-variant-muted)" }} title={quietest.name}>
            {quietest.name}
          </p>
        </div>
      )}

      {/* Best braking */}
      {bestBraking && (
        <div
          className="p-6 rounded-xl editorial-shadow"
          style={{ backgroundColor: "var(--surface-container-lowest)", border: "1px solid var(--border-subtle)" }}
        >
          <span
            className="text-xs font-bold uppercase tracking-[0.18em]"
            style={{ color: "var(--on-surface-variant-muted)", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}
          >
            Best Braking
          </span>
          <div className="mt-3 flex items-baseline gap-1">
            <span
              className="text-3xl font-extrabold"
              style={{ fontFamily: "var(--font-inter), Inter, sans-serif", color: "var(--foreground)" }}
            >
              {bestBraking.val}
            </span>
            <span className="text-sm" style={{ color: "var(--on-surface-variant-muted)" }}>m</span>
          </div>
          <p className="mt-1 text-xs truncate" style={{ color: "var(--on-surface-variant-muted)" }} title={bestBraking.name}>
            {bestBraking.name}
          </p>
        </div>
      )}
    </section>
  );
}
