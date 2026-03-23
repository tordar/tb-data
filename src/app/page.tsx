"use client";

import { useState, useMemo } from "react";
import { sheets, type Sheet } from "@/data/sheets";
import Charts from "@/components/Charts";

type SortDir = "asc" | "desc";

// Columns we always show as visual bar (value sheet, col)
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

// Columns to highlight / pin left (always "Car" is first)
const HIGHLIGHT_COLS = ["Car"];

function parseNum(s: string): number | null {
  if (!s || s === "") return null;
  // Handle values like "17+4" (trunk)
  if (s.includes("+")) {
    return s.split("+").reduce((a, b) => a + (parseFloat(b) || 0), 0);
  }
  // Handle time strings like "08:35"
  if (/^\d+:\d+$/.test(s)) {
    const [h, m] = s.split(":").map(Number);
    return h * 60 + m; // minutes
  }
  const n = parseFloat(s.replace(/[^0-9.\-]/g, ""));
  return isNaN(n) ? null : n;
}

function isNumericCol(sheet: Sheet, colIdx: number): boolean {
  if (colIdx === 0) return false; // Car name
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

  const sheet = sheets[activeSheet];

  // Reset sort when sheet changes
  function switchSheet(idx: number) {
    setActiveSheet(idx);
    setSearch("");
    setSortCol(0);
    setSortDir("asc");
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

  // Precompute column metadata
  const colMeta = useMemo(
    () =>
      sheet.headers.map((_, i) => ({
        isNumeric: isNumericCol(sheet, i),
        max: colMax(sheet, i),
        isBar: (BAR_COLS[sheet.name] ?? []).includes(sheet.headers[i]),
      })),
    [sheet]
  );

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased">
      {/* Top bar */}
      <div className="border-b border-zinc-800/60 bg-zinc-950/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-zinc-200">
              TB Test Results
            </h1>
            <p className="text-xs text-zinc-600 mt-0.5">EV performance database</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-600 tabular-nums">
              {view === "table" ? `${filtered.length} / ${sheet.rows.length} rows` : ""}
            </span>
            <div className="flex rounded-lg border border-zinc-800 overflow-hidden text-xs">
              <button
                onClick={() => setView("table")}
                className={`px-3 py-1.5 font-medium transition-colors ${
                  view === "table" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setView("charts")}
                className={`px-3 py-1.5 font-medium transition-colors ${
                  view === "charts" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Charts
              </button>
            </div>
          </div>
        </div>

        {/* Sheet tabs */}
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 overflow-x-auto">
          <div className="flex gap-0.5 pb-0">
            {sheets.map((s, i) => (
              <button
                key={s.name}
                onClick={() => switchSheet(i)}
                className={`px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                  i === activeSheet
                    ? "border-indigo-500 text-indigo-400"
                    : "border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === "charts" && <Charts />}

      {view === "table" && <>
      {/* Search */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-3">
        <div className="relative max-w-xs">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1 0 6.5 6.5a7.5 7.5 0 0 0 10.15 10.15z"
            />
          </svg>
          <input
            type="text"
            placeholder={`Search ${sheet.name}…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition"
          />
        </div>
      </div>

      {/* Table */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 pb-20 overflow-x-auto">
        <table className="w-full text-sm border-collapse min-w-max">
          <thead>
            <tr className="border-b border-zinc-800">
              {sheet.headers.map((h, i) => (
                <th
                  key={i}
                  className={`pb-2 text-xs font-medium uppercase tracking-wider whitespace-nowrap ${
                    i === 0 ? "text-left pr-4 sticky left-0 bg-zinc-950 z-10" : colMeta[i].isBar ? "text-left pl-3 min-w-[160px]" : "text-right pr-4"
                  }`}
                >
                  <button
                    onClick={() => handleSort(i)}
                    className={`flex items-center gap-0.5 transition-colors ${
                      i !== 0 && !colMeta[i].isBar ? "ml-auto" : ""
                    } ${
                      sortCol === i
                        ? "text-zinc-100"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {h}
                    {sortCol === i ? (
                      <span className="text-indigo-400 ml-0.5">{sortDir === "asc" ? "↑" : "↓"}</span>
                    ) : (
                      <span className="opacity-20 ml-0.5">↕</span>
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
                  className="py-16 text-center text-zinc-600 text-sm"
                >
                  No rows match your search.
                </td>
              </tr>
            ) : (
              filtered.map((row, ri) => (
                <tr
                  key={ri}
                  className="border-b border-zinc-900 hover:bg-zinc-900/40 transition-colors group"
                >
                  {sheet.headers.map((_, ci) => {
                    const val = row[ci] ?? "";
                    const meta = colMeta[ci];

                    if (ci === 0) {
                      return (
                        <td
                          key={ci}
                          className="py-2.5 pr-4 font-medium text-zinc-200 group-hover:text-zinc-50 transition-colors sticky left-0 bg-zinc-950 group-hover:bg-zinc-900 z-10 whitespace-nowrap max-w-[280px] truncate"
                          title={val}
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
                          ? pct > 70 ? "bg-emerald-500" : pct > 45 ? "bg-sky-500" : pct > 25 ? "bg-indigo-500" : "bg-zinc-600"
                          : sheet.name === "Acceleration" || sheet.name === "Braking"
                          ? "bg-rose-500"
                          : "bg-indigo-500";

                      return (
                        <td key={ci} className="py-2.5 pl-3 pr-4">
                          <div className="flex items-center gap-2 min-w-[140px]">
                            <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${barColor}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="tabular-nums text-zinc-300 text-xs w-10 text-right shrink-0">
                              {val || "—"}
                            </span>
                          </div>
                        </td>
                      );
                    }

                    return (
                      <td
                        key={ci}
                        className={`py-2.5 pr-4 tabular-nums whitespace-nowrap ${
                          meta.isNumeric ? "text-right text-zinc-300" : "text-right text-zinc-400 text-xs"
                        } ${!val ? "text-zinc-700" : ""}`}
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
      </>}
    </main>
  );
}
