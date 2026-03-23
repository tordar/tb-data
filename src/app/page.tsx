"use client";

import { useState, useMemo } from "react";
import { useTheme } from "next-themes";
import { sheets } from "@/data/sheets";
import { BAR_COLS, SHEET_ICONS, SHEET_CONFIG, parseNum, isNumericCol, colMax, computeStats, type SortDir } from "@/lib/sheet-utils";
import { AccelScatterChart } from "@/components/AccelScatterChart";
import { NoiseHistogramChart } from "@/components/NoiseHistogramChart";
import { RangeEfficiencyChart } from "@/components/RangeEfficiencyChart";
import { DegradationScatterChart } from "@/components/DegradationScatterChart";
import { DashboardView } from "@/components/DashboardView";
import { WltpRealityChart } from "@/components/WltpRealityChart";
import { WinterPenaltyChart } from "@/components/WinterPenaltyChart";
import { Sidebar } from "@/components/Sidebar";
import { AppHeader } from "@/components/AppHeader";
import { StatsBento } from "@/components/StatsBento";
import { DataTable } from "@/components/DataTable";

export default function Home() {
  const { resolvedTheme, setTheme } = useTheme();
  const [activeSheet, setActiveSheet] = useState(-1);
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState<number>(0);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bananaFilter, setBananaFilter] = useState<"all" | "car" | "van">("all");

  const isDashboard = activeSheet === -1;
  const sheet = isDashboard ? sheets[0] : sheets[activeSheet];
  const config = SHEET_CONFIG[sheet.name];
  const icon = isDashboard ? "dashboard" : (SHEET_ICONS[sheet.name] ?? "table_chart");

  function navigate(idx: number) {
    setActiveSheet(idx);
    setSearch("");
    setSortCol(0);
    setSortDir("asc");
    setSidebarOpen(false);
    setBananaFilter("all");
  }

  function handleSort(colIdx: number) {
    if (sortCol === colIdx) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(colIdx);
      setSortDir("asc");
    }
  }

  const bananaVanNames = useMemo(() => {
    if (sheet.name !== "Banana") return null;
    const pivotIdx = sheet.rows.findIndex((r) => r[0] === "Van" && r[1] === "Trunk");
    if (pivotIdx < 0) return new Set<string>();
    return new Set(sheet.rows.slice(pivotIdx + 1).map((r) => r[0]));
  }, [sheet]);

  const activeRows = useMemo(() => {
    if (!bananaVanNames || bananaFilter === "all") return sheet.rows;
    return sheet.rows.filter((r) => {
      if (r[0] === "Van" && r[1] === "Trunk") return false;
      const isVan = bananaVanNames.has(r[0]);
      return bananaFilter === "van" ? isVan : !isVan;
    });
  }, [sheet, bananaVanNames, bananaFilter]);

  const filtered = useMemo(
    () =>
      activeRows
        .filter((row) => {
          if (sheet.name === "Banana" && row[0] === "Van" && row[1] === "Trunk") return false;
          if (!search) return true;
          return row.some((cell) => cell.toLowerCase().includes(search.toLowerCase()));
        })
        .sort((a, b) => {
          const av = a[sortCol] ?? "";
          const bv = b[sortCol] ?? "";
          const an = parseNum(av);
          const bn = parseNum(bv);
          if (an !== null && bn !== null) return sortDir === "asc" ? an - bn : bn - an;
          return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
        }),
    [activeRows, sheet, search, sortCol, sortDir]
  );

  const colMeta = useMemo(
    () =>
      sheet.headers.map((_, i) => ({
        isNumeric: isNumericCol(sheet, i),
        max: colMax(sheet, i),
        isBar: (BAR_COLS[sheet.name] ?? []).includes(sheet.headers[i]),
      })),
    [sheet]
  );

  const stats = useMemo(() => computeStats({ ...sheet, rows: activeRows }), [sheet, activeRows]);

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ backgroundColor: "rgba(0,0,0,0.15)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        activeSheet={activeSheet}
        isDashboard={isDashboard}
        sidebarOpen={sidebarOpen}
        onNavigate={navigate}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen min-w-0 overflow-hidden">
        <AppHeader
          icon={icon}
          title={isDashboard ? "Dashboard" : sheet.name}
          isDashboard={isDashboard}
          search={search}
          sheetName={sheet.name}
          resolvedTheme={resolvedTheme}
          onSearch={setSearch}
          onThemeToggle={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          onMenuOpen={() => setSidebarOpen(true)}
        />

        <div className="mt-16 flex-1 p-6 lg:p-10 space-y-8">
          {isDashboard ? (
            <>
              <section>
                <h2
                  className="text-3xl font-extrabold tracking-tight"
                  style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}
                >
                  Dashboard
                </h2>
                <p className="mt-1 text-sm" style={{ color: "var(--on-surface-variant-muted)" }}>
                  Overview across all {sheets.length} test categories
                </p>
              </section>
              <DashboardView />
            </>
          ) : (
            <>
              <section>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2
                      className="text-3xl font-extrabold tracking-tight"
                      style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}
                    >
                      {sheet.name}
                    </h2>
                    {config && (
                      <p className="mt-1 text-sm" style={{ color: "var(--on-surface-variant-muted)" }}>
                        {config.description}
                      </p>
                    )}
                  </div>
                  {bananaVanNames && (
                    <div
                      className="flex items-center gap-0.5 p-0.5 rounded-lg shrink-0"
                      style={{ backgroundColor: "var(--surface-container)" }}
                    >
                      {(["all", "car", "van"] as const).map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setBananaFilter(opt)}
                          className="px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors"
                          style={{
                            backgroundColor: bananaFilter === opt ? "var(--surface-container-lowest)" : "transparent",
                            color: bananaFilter === opt ? "var(--foreground)" : "var(--on-surface-variant-muted)",
                            boxShadow: bananaFilter === opt ? "0 1px 3px rgba(27,28,28,0.08)" : "none",
                          }}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {stats && (
                <StatsBento
                  stats={stats}
                  colName={config.colName}
                  filteredCount={filtered.length}
                  search={search}
                />
              )}

              {sheet.name === "Acceleration" && <AccelScatterChart />}
              {sheet.name === "Noise" && <NoiseHistogramChart />}
              {sheet.name === "Range" && <RangeEfficiencyChart />}
              {sheet.name === "Range" && <WinterPenaltyChart />}
              {sheet.name === "Degradation" && <DegradationScatterChart />}
              {sheet.name === "Sunday" && <WltpRealityChart />}

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
          )}
        </div>
      </main>
    </div>
  );
}
