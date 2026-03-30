"use client";

import { useState, useMemo } from "react";
import type { TestSheet, TestMeta, SortDir } from "@/lib/types";
import { parseNum, isNumericCol, colMax } from "@/lib/utils/parsing";
import { computeStats } from "@/lib/utils/scoring";
import { StatsBento } from "@/components/tests/StatsBento";
import { DataTable } from "@/components/tests/DataTable";
import { AccelScatterChart } from "@/components/tests/charts/AccelScatterChart";
import { NoiseHistogramChart } from "@/components/tests/charts/NoiseHistogramChart";
import { RangeEfficiencyChart } from "@/components/tests/charts/RangeEfficiencyChart";
import { WinterPenaltyChart } from "@/components/tests/charts/WinterPenaltyChart";
import { DegradationScatterChart } from "@/components/tests/charts/DegradationScatterChart";
import { WltpRealityChart } from "@/components/tests/charts/WltpRealityChart";

const SHEET_CHARTS: Record<string, React.ComponentType[]> = {
  acceleration: [AccelScatterChart],
  noise: [NoiseHistogramChart],
  range: [RangeEfficiencyChart, WinterPenaltyChart],
  degradation: [DegradationScatterChart],
  sunday: [WltpRealityChart],
};

const BAR_COLS: Record<string, string[]> = {
  Banana: ["Trunk", "Seats folded"],
  Weight: ["Total"],
  Acceleration: ["0-100"],
  Noise: ["Average"],
  Braking: ["Distance"],
  Range: ["km"],
  Sunday: ["Range"],
  "1000 km": ["km/h"],
  "500 km": ["km/h"],
  "Arctic Circle": ["km/h"],
  Bangkok: ["Wh/km"],
};


interface TestSheetViewProps {
  sheet: TestSheet;
  meta: TestMeta;
}

export function TestSheetView({ sheet, meta }: TestSheetViewProps) {
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState(0);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [bananaFilter, setBananaFilter] = useState<"all" | "car" | "van">("all");

  const stats = useMemo(() => computeStats(sheet, meta), [sheet, meta]);

  const isBanana = sheet.slug === "banana";

  // Determine which rows are vans (only for Banana sheet)
  // The data has a pivot row ["Van", "Trunk", "Seats folded"] — everything after it is a van
  const bananaVanNames = useMemo(() => {
    if (!isBanana) return null;
    const pivotIdx = sheet.rows.findIndex((r) => r[0] === "Van" && r[1] === "Trunk");
    if (pivotIdx < 0) return new Set<string>();
    return new Set(sheet.rows.slice(pivotIdx + 1).map((r) => r[0]));
  }, [isBanana, sheet.rows]);

  // Filter + sort rows
  const filtered = useMemo(() => {
    let rows = sheet.rows;

    // Banana: filter out the pivot row, then apply car/van filter
    if (isBanana) {
      rows = rows.filter((r) => !(r[0] === "Van" && r[1] === "Trunk"));
      if (bananaFilter !== "all" && bananaVanNames) {
        rows = rows.filter((r) => {
          const isVan = bananaVanNames.has(r[0] ?? "");
          return bananaFilter === "van" ? isVan : !isVan;
        });
      }
    }

    // Search
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        r.some((cell) => cell.toLowerCase().includes(q))
      );
    }

    // Sort
    const sorted = [...rows].sort((a, b) => {
      const av = a[sortCol] ?? "";
      const bv = b[sortCol] ?? "";
      const an = parseNum(av);
      const bn = parseNum(bv);
      if (an !== null && bn !== null) {
        return sortDir === "asc" ? an - bn : bn - an;
      }
      return sortDir === "asc"
        ? av.localeCompare(bv)
        : bv.localeCompare(av);
    });

    return sorted;
  }, [sheet.rows, search, sortCol, sortDir, bananaFilter, isBanana, bananaVanNames]);

  // Column metadata for DataTable — computed from filtered rows so bars reflect current filter
  const colMeta = useMemo(() => {
    const barColNames = BAR_COLS[sheet.name] ?? [];
    return sheet.headers.map((h, i) => {
      const isNum = isNumericCol(filtered, i);
      const isBar = barColNames.includes(h);
      return {
        isNumeric: isNum,
        max: isBar ? colMax(filtered, i) : 0,
        isBar,
      };
    });
  }, [sheet.headers, sheet.name, filtered]);

  function handleSort(colIdx: number) {
    if (colIdx === sortCol) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(colIdx);
      setSortDir("asc");
    }
  }

  const charts = SHEET_CHARTS[sheet.slug] ?? [];

  return (
    <>
      {/* Header */}
      <section>
        <div className="flex items-center gap-3 mb-1">
          <span className="material-symbols-outlined" style={{ fontSize: "28px", color: "var(--primary)" }}>
            {meta.icon}
          </span>
          <h2
            className="text-3xl font-extrabold tracking-tight"
            style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}
          >
            {sheet.name}
          </h2>
        </div>
        {meta.description && (
          <p className="mt-1 text-sm" style={{ color: "var(--on-surface-variant-muted)" }}>
            {meta.description}
          </p>
        )}
      </section>

      {/* Stats bento */}
      {stats && (
        <StatsBento
          stats={stats}
          colName={meta.colName}
          filteredCount={filtered.length}
          search={search}
        />
      )}

      {/* Charts */}
      {charts.length > 0 && (
        <section className="space-y-6">
          {charts.map((Chart, i) => (
            <Chart key={i} />
          ))}
        </section>
      )}

      {/* Search bar + Banana filter */}
      <section className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <span
            className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2"
            style={{ fontSize: "18px", color: "var(--on-surface-variant-muted)" }}
          >
            search
          </span>
          <input
            type="text"
            placeholder="Search vehicles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full py-2.5 pl-10 pr-4 text-sm outline-none"
            style={{
              backgroundColor: "var(--surface-container-low)",
              color: "var(--foreground)",
              border: "1px solid var(--border-subtle)",
            }}
          />
        </div>

        {isBanana && (
          <div className="flex gap-1 rounded-full p-1" style={{ backgroundColor: "var(--surface-container-low)" }}>
            {(["all", "car", "van"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setBananaFilter(f)}
                className="px-4 py-1.5 text-xs font-semibold rounded-full transition-colors capitalize"
                style={
                  bananaFilter === f
                    ? { backgroundColor: "var(--primary)", color: "white" }
                    : { color: "var(--on-surface-variant-muted)" }
                }
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Data table */}
      <DataTable
        sheetName={sheet.name}
        headers={sheet.headers}
        filtered={filtered}
        totalRows={sheet.rows.length}
        colMeta={colMeta}
        bananaVanNames={bananaVanNames}
        sortCol={sortCol}
        sortDir={sortDir}
        search={search}
        onSearch={setSearch}
        onSort={handleSort}
      />
    </>
  );
}
