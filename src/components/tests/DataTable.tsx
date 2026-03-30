"use client";

import { parseNum } from "@/lib/utils/parsing";
import { type SortDir } from "@/lib/types";

interface ColMeta {
  isNumeric: boolean;
  max: number;
  isBar: boolean;
}

interface DataTableProps {
  sheetName: string;
  headers: string[];
  filtered: string[][];
  totalRows: number;
  colMeta: ColMeta[];
  bananaVanNames: Set<string> | null;
  sortCol: number;
  sortDir: SortDir;
  search: string;
  onSearch: (v: string) => void;
  onSort: (colIdx: number) => void;
}

export function DataTable({
  sheetName,
  headers,
  filtered,
  totalRows,
  colMeta,
  bananaVanNames,
  sortCol,
  sortDir,
  search,
  onSearch,
  onSort,
}: DataTableProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-lg tracking-tight" style={{ color: "var(--foreground)" }}>
            Full Dataset
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--on-surface-variant-muted)" }}>
            {filtered.length} of {totalRows} entries
            {search && ` matching "${search}"`}
          </p>
        </div>
        {/* Mobile search */}
        <div className="sm:hidden">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="rounded-full py-1.5 px-4 text-sm outline-none"
            style={{ backgroundColor: "var(--surface-container-low)", color: "var(--foreground)" }}
          />
        </div>
      </div>

      <div
        className="rounded-xl overflow-hidden editorial-shadow"
        style={{ backgroundColor: "var(--surface-container-lowest)", border: "1px solid var(--border-subtle)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-max text-sm">
            <thead style={{ backgroundColor: "var(--surface-container-high)" }}>
              <tr>
                {headers.map((h, i) => (
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
                      onClick={() => onSort(i)}
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
                          {sortDir === "asc" ? "\u2191" : "\u2193"}
                        </span>
                      ) : (
                        <span style={{ opacity: 0.25, fontSize: "0.75rem" }}>{"\u2195"}</span>
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
                    colSpan={headers.length}
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
                      ((e.currentTarget as HTMLTableRowElement).style.backgroundColor = "var(--row-hover)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLTableRowElement).style.backgroundColor = "transparent")
                    }
                  >
                    {headers.map((_, ci) => {
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
                            style={{ color: "var(--foreground)", backgroundColor: "inherit" }}
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
                          sheetName === "Banana"
                            ? pct > 65
                              ? "#10b981"
                              : pct > 40
                              ? "#3b82f6"
                              : pct > 20
                              ? "#6366f1"
                              : "#c7c4d8"
                            : sheetName === "Acceleration" || sheetName === "Braking"
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
                                {val || "\u2014"}
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
                          {val || "\u2014"}
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
  );
}
