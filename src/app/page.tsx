"use client";

import { useState, useMemo } from "react";
import { useTheme } from "next-themes";
import { sheets } from "@/data/sheets";
import { BAR_COLS, SHEET_ICONS, SHEET_CONFIG, parseNum, isNumericCol, colMax, computeStats, fmt, type SortDir } from "@/lib/sheet-utils";
import { TopChart } from "@/components/TopChart";
import { AccelScatterChart } from "@/components/AccelScatterChart";
import { NoiseHistogramChart } from "@/components/NoiseHistogramChart";
import { RangeEfficiencyChart } from "@/components/RangeEfficiencyChart";
import { DegradationScatterChart } from "@/components/DegradationScatterChart";
import { DashboardView } from "@/components/DashboardView";

export default function Home() {
  const { resolvedTheme, setTheme } = useTheme();
  const [activeSheet, setActiveSheet] = useState(-1); // -1 = dashboard
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState<number>(0);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bananaFilter, setBananaFilter] = useState<"all" | "car" | "van">("all");

  const isDashboard = activeSheet === -1;
  const sheet = isDashboard ? sheets[0] : sheets[activeSheet];
  const config = SHEET_CONFIG[sheet.name];
  const icon = isDashboard ? "dashboard" : (SHEET_ICONS[sheet.name] ?? "table_chart");

  function switchSheet(idx: number) {
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
          if (an !== null && bn !== null)
            return sortDir === "asc" ? an - bn : bn - an;
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

  const stats = useMemo(
    () => computeStats({ ...sheet, rows: activeRows }),
    [sheet, activeRows]
  );

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ backgroundColor: "rgba(0,0,0,0.15)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 flex flex-col py-8 px-4 z-50 transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{ backgroundColor: "var(--surface-container-low)" }}
      >
        {/* Brand */}
        <div className="mb-8 px-2">
          <h1 className="font-bold text-xl tracking-tight" style={{ color: "var(--primary)" }}>
            EV Curator
          </h1>
          <p
            className="text-xs mt-0.5 uppercase tracking-[0.18em]"
            style={{
              color: "var(--on-surface-variant)",
              opacity: 0.6,
              fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
              fontSize: "0.625rem",
            }}
          >
            Intelligence Report
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto">
          {/* Dashboard */}
          <button
            onClick={() => {
              setActiveSheet(-1);
              setSearch("");
              setSortCol(0);
              setSortDir("asc");
              setSidebarOpen(false);
              setBananaFilter("all");
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors rounded-lg text-left"
            style={
              isDashboard
                ? { color: "var(--primary)", backgroundColor: "var(--nav-active-bg)", fontWeight: 600, borderRight: "3px solid var(--primary)", borderRadius: "0.375rem 0 0 0.375rem" }
                : { color: "var(--on-surface-variant)" }
            }
            onMouseEnter={(e) => {
              if (!isDashboard) {
                e.currentTarget.style.backgroundColor = "var(--surface-container)";
                e.currentTarget.style.color = "var(--foreground)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isDashboard) {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--on-surface-variant)";
              }
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>dashboard</span>
            <span>Dashboard</span>
          </button>
          {sheets.map((s, i) => {
            const navIcon = SHEET_ICONS[s.name] ?? "table_chart";
            const isActive = i === activeSheet;
            return (
              <button
                key={s.name}
                onClick={() => switchSheet(i)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors rounded-lg text-left group"
                style={
                  isActive
                    ? {
                        color: "var(--primary)",
                        backgroundColor: "rgba(255,255,255,0.6)",
                        fontWeight: 600,
                        borderRight: "3px solid var(--primary)",
                        borderRadius: "0.375rem 0 0 0.375rem",
                      }
                    : { color: "var(--on-surface-variant)" }
                }
                onMouseEnter={(e) => {
                  if (!isActive) {
                    const el = e.currentTarget;
                    el.style.backgroundColor = "var(--surface-container)";
                    el.style.color = "var(--foreground)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    const el = e.currentTarget;
                    el.style.backgroundColor = "transparent";
                    el.style.color = "var(--on-surface-variant)";
                  }
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                  {navIcon}
                </span>
                <span>{s.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Export button */}
        <div className="pt-6 border-t" style={{ borderColor: "var(--border-subtle)" }}>
          <button
            className="w-full py-2.5 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #3525cd, #4f46e5)" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
              file_download
            </span>
            Export Dataset
          </button>
        </div>
      </aside>

      {/* ─── Main ─────────────────────────────────────────────────────────── */}
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen min-w-0 overflow-hidden">
        {/* Top bar */}
        <header
          className="fixed top-0 right-0 left-0 lg:left-64 z-40 flex items-center justify-between px-6 lg:px-10 h-16"
          style={{
            backgroundColor: "var(--header-bg)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(199,196,216,0.18)",
            boxShadow: "0 8px 32px 0 rgba(27,28,28,0.04)",
          }}
        >
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-1.5 rounded-lg"
              style={{ color: "var(--on-surface-variant)" }}
              onClick={() => setSidebarOpen(true)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>

            <div className="flex items-center gap-2.5">
              <span
                className="material-symbols-outlined"
                style={{ color: "var(--primary)", fontSize: "20px" }}
              >
                {icon}
              </span>
              <span className="font-bold text-base tracking-tight" style={{ color: "var(--foreground)" }}>
                {isDashboard ? "Dashboard" : sheet.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg transition-colors"
              style={{ color: "var(--on-surface-variant)", backgroundColor: "var(--surface-container-low)" }}
              aria-label="Toggle dark mode"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                {resolvedTheme === "dark" ? "light_mode" : "dark_mode"}
              </span>
            </button>
            {!isDashboard && (
              <div className="relative hidden sm:block">
                <span
                  className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--on-surface-variant-muted)", fontSize: "16px" }}
                >
                  search
                </span>
                <input
                  type="text"
                  placeholder={`Search ${sheet.name}…`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="rounded-full py-2 pl-9 pr-4 text-sm w-56 transition-all outline-none"
                  style={{ backgroundColor: "var(--surface-container-low)", border: "none", color: "var(--foreground)" }}
                  onFocus={(e) => {
                    (e.target as HTMLInputElement).style.boxShadow = "0 0 0 2px rgba(53,37,205,0.2)";
                  }}
                  onBlur={(e) => {
                    (e.target as HTMLInputElement).style.boxShadow = "none";
                  }}
                />
              </div>
            )}
          </div>
        </header>

        {/* ─── Content ──────────────────────────────────────────────────── */}
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
              {/* Page heading */}
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

              {/* ─── Bento: stats + chart ──────────────────────────────── */}
              {stats && (
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Stats column */}
                  <div className="lg:col-span-4 space-y-4">
                    {/* Total vehicles */}
                    <div
                      className="p-6 rounded-xl editorial-shadow"
                      style={{
                        backgroundColor: "var(--surface-container-lowest)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <span
                        className="text-xs font-bold uppercase tracking-[0.18em]"
                        style={{
                          color: "var(--primary)",
                          fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                        }}
                      >
                        Vehicles Tested
                      </span>
                      <div className="mt-3 flex items-baseline gap-2">
                        <span
                          className="text-5xl font-extrabold"
                          style={{
                            fontFamily: "var(--font-inter), Inter, sans-serif",
                            color: "var(--foreground)",
                          }}
                        >
                          {stats.count}
                        </span>
                        <span className="text-sm" style={{ color: "var(--on-surface-variant-muted)" }}>
                          models
                        </span>
                      </div>
                      {search && (
                        <p className="mt-1 text-xs" style={{ color: "var(--on-surface-variant-muted)" }}>
                          {filtered.length} matching search
                        </p>
                      )}
                    </div>

                    {/* Best */}
                    <div
                      className="p-6 rounded-xl editorial-shadow"
                      style={{
                        backgroundColor: "#3525cd",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <span
                        className="text-xs font-bold uppercase tracking-[0.18em]"
                        style={{
                          color: "rgba(255,255,255,0.65)",
                          fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                        }}
                      >
                        {stats.lowerIsBetter ? "Best (Lowest)" : "Best (Highest)"}
                      </span>
                      <div className="mt-2">
                        <p
                          className="text-lg font-bold leading-snug text-white"
                          title={stats.best.name}
                        >
                          {stats.best.name.length > 28
                            ? stats.best.name.slice(0, 26) + "…"
                            : stats.best.name}
                        </p>
                        <p className="text-2xl font-extrabold mt-1" style={{ color: "var(--primary-accent)" }}>
                          {fmt(stats.best.val, stats.unit)}
                        </p>
                      </div>
                    </div>

                    {/* Average */}
                    <div
                      className="p-6 rounded-xl editorial-shadow"
                      style={{
                        backgroundColor: "var(--surface-container-lowest)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <span
                        className="text-xs font-bold uppercase tracking-[0.18em]"
                        style={{
                          color: "var(--on-surface-variant-muted)",
                          fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                        }}
                      >
                        Average
                      </span>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold" style={{ color: "var(--foreground)" }}>
                          {stats.avg}
                        </span>
                        <span className="text-sm" style={{ color: "var(--on-surface-variant-muted)" }}>
                          {stats.unit === "banana" ? "🍌" : stats.unit}
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
                    style={{
                      backgroundColor: "var(--surface-container-lowest)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3
                          className="font-bold text-base tracking-tight"
                          style={{ color: "var(--foreground)" }}
                        >
                          Top 10 — {config.colName}
                        </h3>
                        <p
                          className="text-xs mt-0.5"
                          style={{
                            color: "var(--on-surface-variant-muted)",
                            fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                          }}
                        >
                          {stats.lowerIsBetter ? "Lower is better" : "Higher is better"}
                        </p>
                      </div>
                      <span
                        className="text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: "var(--primary-container)", color: "var(--on-primary-container)" }}
                      >
                        {stats.unit === "banana" ? "🍌 banana" : stats.unit}
                      </span>
                    </div>
                    <TopChart stats={stats} />
                  </div>
                </section>
              )}

              {/* ─── Sheet-specific charts ──────────────────────────────── */}
              {sheet.name === "Acceleration" && <AccelScatterChart />}
              {sheet.name === "Noise" && <NoiseHistogramChart />}
              {sheet.name === "Range" && <RangeEfficiencyChart />}
              {sheet.name === "Degradation" && <DegradationScatterChart />}

              {/* ─── Full data table ────────────────────────────────────── */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3
                      className="font-bold text-lg tracking-tight"
                      style={{ color: "var(--foreground)" }}
                    >
                      Full Dataset
                    </h3>
                    <p className="text-xs mt-0.5" style={{ color: "var(--on-surface-variant-muted)" }}>
                      {filtered.length} of {sheet.rows.length} entries
                      {search && ` matching "${search}"`}
                    </p>
                  </div>
                  {/* Mobile search */}
                  <div className="sm:hidden">
                    <input
                      type="text"
                      placeholder="Search…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="rounded-full py-1.5 px-4 text-sm outline-none"
                      style={{ backgroundColor: "var(--surface-container-low)", color: "var(--foreground)" }}
                    />
                  </div>
                </div>

                <div
                  className="rounded-xl overflow-hidden editorial-shadow"
                  style={{
                    backgroundColor: "var(--surface-container-lowest)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse min-w-max text-sm">
                      <thead style={{ backgroundColor: "var(--surface-container-high)" }}>
                        <tr>
                          {sheet.headers.map((h, i) => (
                            <th
                              key={i}
                              className={`py-3.5 ${
                                i === 0
                                  ? "text-left px-6 sticky left-0"
                                  : colMeta[i].isBar
                                  ? "text-left pl-4 min-w-[200px] pr-4"
                                  : "text-right pr-6"
                              }`}
                              style={{ backgroundColor: "var(--surface-container-high)" }}
                            >
                              <button
                                onClick={() => handleSort(i)}
                                className="flex items-center gap-1 transition-colors"
                                style={{
                                  fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                                  fontSize: "0.6875rem",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.08em",
                                  fontWeight: 600,
                                  color: sortCol === i ? "var(--foreground)" : "var(--on-surface-variant-muted)",
                                  marginLeft: i !== 0 && !colMeta[i].isBar ? "auto" : undefined,
                                }}
                              >
                                {h}
                                {sortCol === i ? (
                                  <span style={{ color: "var(--primary)", fontSize: "0.75rem" }}>
                                    {sortDir === "asc" ? "↑" : "↓"}
                                  </span>
                                ) : (
                                  <span style={{ opacity: 0.25, fontSize: "0.75rem" }}>↕</span>
                                )}
                              </button>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.length === 0 ? (
                          <tr>
                            <td
                              colSpan={sheet.headers.length}
                              className="py-16 text-center text-sm"
                              style={{ color: "var(--on-surface-variant-muted)" }}
                            >
                              No rows match your search.
                            </td>
                          </tr>
                        ) : (
                          filtered.map((row, ri) => (
                            <tr
                              key={ri}
                              className="group transition-colors cursor-pointer"
                              style={{ borderTop: "1px solid var(--row-border)" }}
                              onMouseEnter={(e) =>
                                ((e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                                  "var(--row-hover)")
                              }
                              onMouseLeave={(e) =>
                                ((e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                                  "transparent")
                              }
                            >
                              {sheet.headers.map((_, ci) => {
                                const val = row[ci] ?? "";
                                const meta = colMeta[ci];

                                if (ci === 0) {
                                  const vehicleType = bananaVanNames
                                    ? bananaVanNames.has(val)
                                      ? "Van"
                                      : "Car"
                                    : null;
                                  return (
                                    <td
                                      key={ci}
                                      className="py-3.5 px-6 font-semibold whitespace-nowrap sticky left-0"
                                      title={val}
                                      style={{
                                        color: "var(--foreground)",
                                        backgroundColor: "inherit",
                                      }}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="truncate max-w-[260px]">{val}</span>
                                        {vehicleType && (
                                          <span
                                            className="shrink-0 text-[10px] font-bold uppercase tracking-[0.12em] px-1.5 py-0.5 rounded"
                                            style={{
                                              backgroundColor: vehicleType === "Van" ? "#e2dfff" : "#f0fdf4",
                                              color: vehicleType === "Van" ? "#3323cc" : "#15803d",
                                            }}
                                          >
                                            {vehicleType}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                  );
                                }

                                if (meta.isBar && meta.max > 0) {
                                  const n = parseNum(val);
                                  const pct = n !== null ? (n / meta.max) * 100 : 0;
                                  const barColor =
                                    sheet.name === "Banana"
                                      ? pct > 65
                                        ? "#10b981"
                                        : pct > 40
                                        ? "#3b82f6"
                                        : pct > 20
                                        ? "#6366f1"
                                        : "#c7c4d8"
                                      : sheet.name === "Acceleration" || sheet.name === "Braking"
                                      ? "#f43f5e"
                                      : "#3525cd";

                                  return (
                                    <td key={ci} className="py-3.5 pl-4 pr-4">
                                      <div className="flex items-center gap-3 min-w-[180px]">
                                        <div
                                          className="flex-1 h-1.5 rounded-full overflow-hidden"
                                          style={{ backgroundColor: "var(--surface-container)" }}
                                        >
                                          <div
                                            className="h-full rounded-full transition-all"
                                            style={{ width: `${pct}%`, backgroundColor: barColor }}
                                          />
                                        </div>
                                        <span
                                          className="tabular-nums text-xs w-12 text-right shrink-0 font-medium"
                                          style={{ color: "var(--on-surface-variant)" }}
                                        >
                                          {val || "—"}
                                        </span>
                                      </div>
                                    </td>
                                  );
                                }

                                return (
                                  <td
                                    key={ci}
                                    className="py-3.5 pr-6 tabular-nums whitespace-nowrap text-right"
                                    style={{
                                      color: meta.isNumeric
                                        ? "var(--foreground)"
                                        : val
                                        ? "var(--on-surface-variant-muted)"
                                        : "var(--outline-variant)",
                                      fontSize: meta.isNumeric ? "0.875rem" : "0.8125rem",
                                    }}
                                  >
                                    {val || "—"}
                                  </td>
                                );
                              })}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
