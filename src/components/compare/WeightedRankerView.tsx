"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { getVehicles } from "@/lib/data/vehicles";
import { RANKING_METRICS, getMetricScores } from "@/lib/data/comparison";
import { computeWeightedRank } from "@/lib/utils/scoring";

const initialWeights = Object.fromEntries(RANKING_METRICS.map((m) => [m.key, 50]));

export function WeightedRankerView() {
  const [weights, setWeights] = useState<Record<string, number>>(initialWeights);

  const vehiclesWithScores = useMemo(() => {
    return getVehicles()
      .map((v) => {
        const scores = getMetricScores(v.name);
        return scores ? { name: v.name, slug: v.slug, scores } : null;
      })
      .filter(
        (v): v is { name: string; slug: string; scores: Record<string, number> } =>
          v !== null && Object.keys(v.scores).length >= 3
      );
  }, []);

  const ranked = useMemo(
    () => computeWeightedRank(vehiclesWithScores, weights),
    [vehiclesWithScores, weights]
  );

  const top50 = ranked.slice(0, 50);

  return (
    <div className="space-y-8">
      {/* Header */}
      <section>
        <h2
          className="text-3xl font-extrabold tracking-tight"
          style={{ color: "var(--foreground)" }}
        >
          Find Your EV
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--on-surface-variant-muted)" }}>
          Adjust the sliders to match your priorities — we&apos;ll rank all tested vehicles accordingly.
        </p>
      </section>

      {/* Sliders card */}
      <section
        className="rounded-xl p-6 editorial-shadow"
        style={{
          backgroundColor: "var(--surface-container-lowest)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <h3
          className="text-xs font-bold uppercase tracking-[0.18em] mb-6"
          style={{
            color: "var(--on-surface-variant-muted)",
            fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
          }}
        >
          What matters to you?
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
          {RANKING_METRICS.map((metric) => (
            <div key={metric.key} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label
                  className="text-sm font-semibold"
                  style={{ color: "var(--foreground)" }}
                  htmlFor={`slider-${metric.key}`}
                >
                  {metric.label}
                </label>
                <span
                  className="text-xs font-bold tabular-nums"
                  style={{ color: "var(--primary)" }}
                >
                  {weights[metric.key]}%
                </span>
              </div>
              <input
                id={`slider-${metric.key}`}
                type="range"
                min={0}
                max={100}
                value={weights[metric.key]}
                onChange={(e) =>
                  setWeights((prev) => ({ ...prev, [metric.key]: Number(e.target.value) }))
                }
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: "var(--primary)" }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Ranked results */}
      <section>
        <h3
          className="text-xs font-bold uppercase tracking-[0.18em] mb-4"
          style={{
            color: "var(--on-surface-variant-muted)",
            fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
          }}
        >
          Top matches ({ranked.length} vehicles)
        </h3>
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
                  {/* # */}
                  <th
                    className="py-3.5 pl-6 pr-3 text-left"
                    style={{
                      fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                      fontSize: "0.6875rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      fontWeight: 600,
                      color: "var(--on-surface-variant-muted)",
                    }}
                  >
                    #
                  </th>
                  {/* Vehicle */}
                  <th
                    className="py-3.5 px-3 text-left"
                    style={{
                      fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                      fontSize: "0.6875rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      fontWeight: 600,
                      color: "var(--on-surface-variant-muted)",
                    }}
                  >
                    Vehicle
                  </th>
                  {/* Metric columns — hidden on mobile */}
                  {RANKING_METRICS.map((metric) => (
                    <th
                      key={metric.key}
                      className="py-3.5 px-3 text-right hidden sm:table-cell"
                      style={{
                        fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                        fontSize: "0.6875rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        fontWeight: 600,
                        color:
                          weights[metric.key] === 0
                            ? "var(--outline-variant)"
                            : "var(--on-surface-variant-muted)",
                      }}
                    >
                      {metric.label}
                    </th>
                  ))}
                  {/* Score */}
                  <th
                    className="py-3.5 pl-3 pr-6 text-right"
                    style={{
                      fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                      fontSize: "0.6875rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      fontWeight: 600,
                      color: "var(--on-surface-variant-muted)",
                    }}
                  >
                    Score
                  </th>
                </tr>
              </thead>
              <tbody>
                {top50.map((vehicle, idx) => (
                  <tr
                    key={vehicle.slug}
                    style={{ borderTop: "1px solid var(--row-border)" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                        "var(--row-hover)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                        "transparent";
                    }}
                  >
                    {/* Rank number */}
                    <td
                      className="py-3 pl-6 pr-3 tabular-nums text-sm font-semibold"
                      style={{ color: "var(--on-surface-variant-muted)" }}
                    >
                      {idx + 1}
                    </td>
                    {/* Vehicle name */}
                    <td className="py-3 px-3 font-semibold whitespace-nowrap">
                      <Link
                        href={`/vehicles/${vehicle.slug}`}
                        className="hover:underline"
                        style={{ color: "var(--primary)" }}
                      >
                        {vehicle.name}
                      </Link>
                    </td>
                    {/* Metric scores */}
                    {RANKING_METRICS.map((metric) => (
                      <td
                        key={metric.key}
                        className="py-3 px-3 tabular-nums text-right hidden sm:table-cell"
                        style={{
                          color:
                            vehicle.scores[metric.key] !== undefined
                              ? "var(--on-surface-variant)"
                              : "var(--outline-variant)",
                        }}
                      >
                        {vehicle.scores[metric.key] !== undefined
                          ? vehicle.scores[metric.key]
                          : "—"}
                      </td>
                    ))}
                    {/* Weighted score badge */}
                    <td className="py-3 pl-3 pr-6 text-right">
                      <span
                        className="inline-block tabular-nums text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{
                          backgroundColor: "var(--primary-container)",
                          color: "var(--on-primary-container)",
                        }}
                      >
                        {vehicle.weightedScore}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
