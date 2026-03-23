"use client";

import { useState, useMemo } from "react";
import { sheets, type Sheet } from "@/data/sheets";
import Charts from "@/components/Charts";

type SortDir = "asc" | "desc";

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

const SHEET_ICONS: Record<string, string> = {
  Banana: "luggage",
  Weight: "monitor_weight",
  Acceleration: "speed",
  Noise: "volume_up",
  Braking: "emergency_brake",
  Range: "ev_station",
  Sunday: "wb_sunny",
  "1000 km": "route",
  "500 km": "route",
  "Arctic Circle": "ac_unit",
  Bangkok: "travel_explore",
  Degradation: "battery_alert",
};

function parseNum(s: string): number | null {
  if (!s || s === "") return null;
  if (s.includes("+")) {
    return s.split("+").reduce((a, b) => a + (parseFloat(b) || 0), 0);
  }
  if (/^\d+:\d+$/.test(s)) {
    const [h, m] = s.split(":").map(Number);
    return h * 60 + m;
  }
  const n = parseFloat(s.replace(/[^0-9.\-]/g, ""));
  return isNaN(n) ? null : n;
}

function isNumericCol(sheet: Sheet, colIdx: number): boolean {
  if (colIdx === 0) return false;
  const vals = sheet.rows.slice(0, 20).map((r) => r[colIdx] ?? "");
  const nonEmpty = vals.filter((v) => v !== "");
  if (nonEmpty.length === 0) return false;
  return nonEmpty.filter((v) => parseNum(v) !== null).length / nonEmpty.length > 0.7;
}

function colMax(sheet: Sheet, colIdx: number): number {
  let max = 0;
  for (const row of sheet.rows) {
    const n = parseNum(row[colIdx] ?? "");
    if (n !== null && n > max) max = n;
  }
  return max;
}

export default function Home() {
  const [activeSheet, setActiveSheet] = useState(0);
  const [view, setView] = useState<"table" | "charts">("table");
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState<number>(0);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sheet = sheets[activeSheet];

  function switchSheet(idx: number) {
    setActiveSheet(idx);
    setSearch("");
    setSortCol(0);
    setSortDir("asc");
    setSidebarOpen(false);
  }

  function handleSort(colIdx: number) {
    if (sortCol === colIdx) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(colIdx);
      setSortDir("asc");
    }
  }

  const filtered = useMemo(() => {
    return sheet.rows
      .filter((row) => {
        if (!search) return true;
        return row.some((cell) => cell.toLowerCase().includes(search.toLowerCase()));
      })
      .sort((a, b) => {
        const av = a[sortCol] ?? "";
        const bv = b[sortCol] ?? "";
        const an = parseNum(av);
        const bn = parseNum(bv);
        if (an !== null && bn !== null) {
          return sortDir === "asc" ? an - bn : bn - an;
        }
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      });
  }, [sheet, search, sortCol, sortDir]);

  const colMeta = useMemo(
    () =>
      sheet.headers.map((_, i) => ({
        isNumeric: isNumericCol(sheet, i),
        max: colMax(sheet, i),
        isBar: (BAR_COLS[sheet.name] ?? []).includes(sheet.headers[i]),
      })),
    [sheet]
  );

  const icon = SHEET_ICONS[sheet.name] ?? "table_chart";

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#fbf9f8", color: "#1b1c1c" }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 flex flex-col py-8 px-4 z-50 transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{ backgroundColor: "#f5f3f3" }}
      >
        {/* Brand */}
        <div className="mb-8 px-4">
          <h1
            className="font-bold text-xl tracking-tight"
            style={{ color: "#3525cd", fontFamily: "var(--font-inter), Inter, sans-serif" }}
          >
            EV Curator
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "#464555", opacity: 0.6 }}>
            Intelligence Report
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto">
          {sheets.map((s, i) => {
            const navIcon = SHEET_ICONS[s.name] ?? "table_chart";
            const isActive = i === activeSheet;
            return (
              <button
                key={s.name}
                onClick={() => switchSheet(i)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors rounded-lg text-left"
                style={
                  isActive
                    ? {
                        color: "#3525cd",
                        backgroundColor: "rgba(255,255,255,0.7)",
                        fontWeight: 600,
                        borderRight: "3px solid #3525cd",
                        borderRadius: "0.375rem 0 0 0.375rem",
                      }
                    : {
                        color: "#464555",
                      }
                }
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#efeded";
                    (e.currentTarget as HTMLButtonElement).style.color = "#1b1c1c";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                    (e.currentTarget as HTMLButtonElement).style.color = "#464555";
                  }
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                  {navIcon}
                </span>
                <span style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>{s.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="pt-6 border-t space-y-1" style={{ borderColor: "rgba(199,196,216,0.2)" }}>
          <div className="flex bg-[#eae8e7] rounded-lg p-1 gap-1">
            <button
              onClick={() => setView("table")}
              className="flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors"
              style={
                view === "table"
                  ? { backgroundColor: "white", color: "#3525cd" }
                  : { color: "#464555" }
              }
            >
              Table
            </button>
            <button
              onClick={() => setView("charts")}
              className="flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors"
              style={
                view === "charts"
                  ? { backgroundColor: "white", color: "#3525cd" }
                  : { color: "#464555" }
              }
            >
              Charts
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header
          className="fixed top-0 right-0 left-0 lg:left-64 z-40 flex items-center justify-between px-6 lg:px-10 h-16"
          style={{
            backgroundColor: "rgba(251,249,248,0.85)",
            backdropFilter: "blur(16px)",
            borderBottom: "1px solid rgba(199,196,216,0.2)",
            boxShadow: "0 8px 32px 0 rgba(27,28,28,0.04)",
          }}
        >
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              className="lg:hidden p-1.5 rounded-lg"
              style={{ color: "#464555" }}
              onClick={() => setSidebarOpen(true)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>

            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined" style={{ color: "#3525cd", fontSize: "20px" }}>
                {icon}
              </span>
              <span
                className="font-bold text-base tracking-tight"
                style={{ color: "#1b1c1c", fontFamily: "var(--font-inter), Inter, sans-serif" }}
              >
                {sheet.name}
              </span>
              {view === "table" && (
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: "#e2dfff", color: "#3323cc" }}
                >
                  {filtered.length} / {sheet.rows.length}
                </span>
              )}
            </div>
          </div>

          {/* Search — only in table view */}
          {view === "table" && (
            <div className="relative hidden sm:block">
              <span
                className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "#777587", fontSize: "16px" }}
              >
                search
              </span>
              <input
                type="text"
                placeholder={`Search ${sheet.name}…`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-full py-2 pl-9 pr-4 text-sm w-56 transition-all outline-none"
                style={{
                  backgroundColor: "#f5f3f3",
                  border: "none",
                  color: "#1b1c1c",
                }}
                onFocus={(e) =>
                  ((e.target as HTMLInputElement).style.boxShadow = "0 0 0 2px rgba(53,37,205,0.2)")
                }
                onBlur={(e) =>
                  ((e.target as HTMLInputElement).style.boxShadow = "none")
                }
              />
            </div>
          )}
        </header>

        {/* Content */}
        <div className="mt-16 flex-1 overflow-auto">
          {view === "charts" && <Charts />}

          {view === "table" && (
            <div className="p-6 lg:p-10">
              {/* Mobile search */}
              <div className="sm:hidden mb-4">
                <div className="relative">
                  <span
                    className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: "#777587", fontSize: "16px" }}
                  >
                    search
                  </span>
                  <input
                    type="text"
                    placeholder={`Search ${sheet.name}…`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-full py-2 pl-9 pr-4 text-sm outline-none"
                    style={{ backgroundColor: "#f5f3f3", border: "none", color: "#1b1c1c" }}
                  />
                </div>
              </div>

              {/* Table card */}
              <div
                className="rounded-xl overflow-hidden editorial-shadow"
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid rgba(199,196,216,0.15)",
                }}
              >
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse min-w-max text-sm">
                    <thead style={{ backgroundColor: "#eae8e7" }}>
                      <tr>
                        {sheet.headers.map((h, i) => (
                          <th
                            key={i}
                            className={`py-3.5 ${
                              i === 0 ? "text-left px-6 sticky left-0" : colMeta[i].isBar ? "text-left pl-4 min-w-[180px] pr-4" : "text-right pr-6"
                            }`}
                            style={{
                              backgroundColor: "#eae8e7",
                            }}
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
                                color: sortCol === i ? "#1b1c1c" : "#777587",
                                marginLeft: i !== 0 && !colMeta[i].isBar ? "auto" : undefined,
                              }}
                            >
                              {h}
                              {sortCol === i ? (
                                <span style={{ color: "#3525cd", fontSize: "0.75rem" }}>
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
                            style={{ color: "#777587" }}
                          >
                            No rows match your search.
                          </td>
                        </tr>
                      ) : (
                        filtered.map((row, ri) => (
                          <tr
                            key={ri}
                            className="group transition-colors cursor-pointer"
                            style={{ borderTop: "1px solid #efeded" }}
                            onMouseEnter={(e) =>
                              ((e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                                "#fafafa")
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
                                return (
                                  <td
                                    key={ci}
                                    className="py-3.5 px-6 font-semibold whitespace-nowrap max-w-[280px] truncate sticky left-0"
                                    title={val}
                                    style={{
                                      color: "#1b1c1c",
                                      backgroundColor: "inherit",
                                    }}
                                  >
                                    {val}
                                  </td>
                                );
                              }

                              if (meta.isBar && meta.max > 0) {
                                const n = parseNum(val);
                                const pct = n !== null ? (n / meta.max) * 100 : 0;
                                const barColor =
                                  sheet.name === "Banana"
                                    ? pct > 70
                                      ? "#10b981"
                                      : pct > 45
                                      ? "#3b82f6"
                                      : pct > 25
                                      ? "#6366f1"
                                      : "#d1d5db"
                                    : sheet.name === "Acceleration" || sheet.name === "Braking"
                                    ? "#f43f5e"
                                    : "#3525cd";

                                return (
                                  <td key={ci} className="py-3.5 pl-4 pr-4">
                                    <div className="flex items-center gap-3 min-w-[160px]">
                                      <div
                                        className="flex-1 h-1.5 rounded-full overflow-hidden"
                                        style={{ backgroundColor: "#efeded" }}
                                      >
                                        <div
                                          className="h-full rounded-full transition-all"
                                          style={{ width: `${pct}%`, backgroundColor: barColor }}
                                        />
                                      </div>
                                      <span
                                        className="tabular-nums text-xs w-10 text-right shrink-0 font-medium"
                                        style={{ color: "#464555" }}
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
                                      ? "#1b1c1c"
                                      : val
                                      ? "#777587"
                                      : "#c7c4d8",
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
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
