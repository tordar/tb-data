"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getVehiclesForComparison } from "@/lib/data/comparison";
import { getVehicles, getVehicleByName } from "@/lib/data/vehicles";
import { vehicleSlug } from "@/lib/utils/formatting";

interface Props {
  initialA: string;
  initialB: string;
}

function getSuggestions(query: string, exclude: string): string[] {
  if (!query || query.length < 1) return [];
  const lower = query.toLowerCase();
  const terms = lower.split(/\s+/).filter(Boolean);
  return getVehicles()
    .filter((v) => v.name !== exclude && terms.every((t) => v.name.toLowerCase().includes(t)))
    .map((v) => v.name)
    .slice(0, 8);
}

function formatValue(value: number | null, unit: string): string {
  if (value === null) return "—";
  if (unit === "banana") return `${value} 🍌`;
  if (value % 1 === 0) return `${value} ${unit}`;
  return `${value.toFixed(1)} ${unit}`;
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

export function HeadToHeadView({ initialA, initialB }: Props) {
  const router = useRouter();

  const [nameA, setNameA] = useState(initialA);
  const [nameB, setNameB] = useState(initialB);
  const [queryA, setQueryA] = useState("");
  const [queryB, setQueryB] = useState("");

  const comparison = useMemo(
    () => getVehiclesForComparison(nameA, nameB),
    [nameA, nameB]
  );

  const suggestionsA = useMemo(() => getSuggestions(queryA, nameB), [queryA, nameB]);
  const suggestionsB = useMemo(() => getSuggestions(queryB, nameA), [queryB, nameA]);

  function selectA(name: string) {
    setNameA(name);
    setQueryA("");
    router.replace(`/compare/${vehicleSlug(name)}/${vehicleSlug(nameB)}`);
  }

  function selectB(name: string) {
    setNameB(name);
    setQueryB("");
    router.replace(`/compare/${vehicleSlug(nameA)}/${vehicleSlug(name)}`);
  }

  const labelStyle = {
    fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
    fontSize: "0.6875rem",
    textTransform: "uppercase" as const,
    letterSpacing: "0.18em",
    fontWeight: 700,
    color: "var(--on-surface-variant-muted)",
  };

  const inputStyle = {
    backgroundColor: "var(--surface-container)",
    border: "1px solid var(--border-subtle)",
    color: "var(--foreground)",
    borderRadius: "0.5rem",
    padding: "0.5rem 0.75rem",
    fontSize: "0.875rem",
    width: "100%",
    outline: "none",
  };

  const dropdownStyle = {
    position: "absolute" as const,
    top: "100%",
    left: 0,
    right: 0,
    zIndex: 50,
    backgroundColor: "var(--surface-container-low)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "0.5rem",
    marginTop: "0.25rem",
    overflow: "hidden",
    boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
  };

  const dropdownItemStyle = {
    padding: "0.5rem 0.75rem",
    fontSize: "0.875rem",
    cursor: "pointer",
    color: "var(--foreground)",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <section>
        <h2
          data-page-headline
          className="text-3xl font-extrabold tracking-tight"
          style={{ color: "var(--foreground)" }}
        >
          Head-to-Head
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--on-surface-variant-muted)" }}>
          Side-by-side comparison across all shared test metrics.
        </p>
      </section>

      {/* Vehicle pickers */}
      <section
        className="rounded-xl p-6 editorial-shadow"
        style={{
          backgroundColor: "var(--surface-container-lowest)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Vehicle A picker */}
          <div className="flex flex-col gap-2">
            <label style={labelStyle}>Vehicle A</label>
            <div className="relative">
              <input
                style={inputStyle}
                value={queryA !== "" ? queryA : nameA}
                placeholder="Search vehicles…"
                onFocus={() => setQueryA("")}
                onChange={(e) => setQueryA(e.target.value)}
                onBlur={() => {
                  // Delay to allow click on suggestion
                  setTimeout(() => setQueryA(""), 200);
                }}
              />
              {suggestionsA.length > 0 && queryA !== "" && (
                <div style={dropdownStyle}>
                  {suggestionsA.map((name) => (
                    <div
                      key={name}
                      style={dropdownItemStyle}
                      onMouseDown={() => selectA(name)}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.backgroundColor =
                          "var(--row-hover)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent";
                      }}
                    >
                      {name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Vehicle B picker */}
          <div className="flex flex-col gap-2">
            <label style={labelStyle}>Vehicle B</label>
            <div className="relative">
              <input
                style={inputStyle}
                value={queryB !== "" ? queryB : nameB}
                placeholder="Search vehicles…"
                onFocus={() => setQueryB("")}
                onChange={(e) => setQueryB(e.target.value)}
                onBlur={() => {
                  setTimeout(() => setQueryB(""), 200);
                }}
              />
              {suggestionsB.length > 0 && queryB !== "" && (
                <div style={dropdownStyle}>
                  {suggestionsB.map((name) => (
                    <div
                      key={name}
                      style={dropdownItemStyle}
                      onMouseDown={() => selectB(name)}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.backgroundColor =
                          "var(--row-hover)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent";
                      }}
                    >
                      {name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section>
        {!comparison ? (
          <p
            className="text-center py-12 text-sm"
            style={{ color: "var(--on-surface-variant-muted)" }}
          >
            No shared test metrics found for these two vehicles.
          </p>
        ) : (
          <div
            className="rounded-xl overflow-hidden editorial-shadow"
            style={{
              backgroundColor: "var(--surface-container-lowest)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead style={{ backgroundColor: "var(--surface-container-high)" }}>
                  <tr>
                    <th
                      className="py-3.5 pl-6 pr-4 text-right"
                      style={{
                        ...labelStyle,
                        color: "var(--primary)",
                        fontSize: "0.8125rem",
                        fontWeight: 700,
                        maxWidth: "12rem",
                      }}
                    >
                      {truncate(nameA, 25)}
                    </th>
                    <th
                      className="py-3.5 px-4 text-center"
                      style={labelStyle}
                    >
                      Test
                    </th>
                    <th
                      className="py-3.5 pr-6 pl-4 text-left"
                      style={{
                        ...labelStyle,
                        color: "var(--primary)",
                        fontSize: "0.8125rem",
                        fontWeight: 700,
                        maxWidth: "12rem",
                      }}
                    >
                      {truncate(nameB, 25)}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.metrics.map((metric) => {
                    const aIsWinner = metric.winner === "a";
                    const bIsWinner = metric.winner === "b";

                    return (
                      <tr
                        key={metric.testSlug}
                        style={{ borderTop: "1px solid var(--row-border)" }}
                      >
                        {/* Value A */}
                        <td
                          className="py-3 pl-6 pr-4 text-right tabular-nums"
                          style={{
                            fontWeight: aIsWinner ? 700 : 400,
                            color: aIsWinner
                              ? "var(--foreground)"
                              : "var(--on-surface-variant-muted)",
                          }}
                        >
                          <span className="inline-flex items-center justify-end gap-1.5">
                            {formatValue(metric.valueA, metric.unit)}
                            {aIsWinner && (
                              <span style={{ color: "#34d399", fontSize: "0.75rem" }}>●</span>
                            )}
                          </span>
                        </td>

                        {/* Test name */}
                        <td
                          className="py-3 px-4 text-center whitespace-nowrap"
                          style={{
                            color: "var(--on-surface-variant-muted)",
                            fontSize: "0.75rem",
                            fontFamily:
                              "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                          }}
                        >
                          {metric.testName}
                        </td>

                        {/* Value B */}
                        <td
                          className="py-3 pr-6 pl-4 text-left tabular-nums"
                          style={{
                            fontWeight: bIsWinner ? 700 : 400,
                            color: bIsWinner
                              ? "var(--foreground)"
                              : "var(--on-surface-variant-muted)",
                          }}
                        >
                          <span className="inline-flex items-center gap-1.5">
                            {bIsWinner && (
                              <span style={{ color: "#34d399", fontSize: "0.75rem" }}>●</span>
                            )}
                            {formatValue(metric.valueB, metric.unit)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
