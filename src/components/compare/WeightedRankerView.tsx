"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { getVehicles } from "@/lib/data/vehicles";
import { RANKING_METRICS, getMetricScores } from "@/lib/data/comparison";
import { computeWeightedRank } from "@/lib/utils/scoring";

const PRIORITY_LEVELS = [
  { label: "Don't care", value: 0 },
  { label: "Nice to have", value: 25 },
  { label: "Important", value: 60 },
  { label: "Essential", value: 100 },
] as const;

const METRIC_DESCRIPTIONS: Record<string, string> = {
  range: "How far can it go on a single charge at highway speed?",
  cargo: "How much stuff fits in the trunk?",
  acceleration: "How fast does it get to 100 km/h?",
  noise: "How quiet is the cabin at highway speed?",
  braking: "How quickly does it stop from 100 km/h?",
  weight: "How light is the vehicle?",
};

const initialWeights = Object.fromEntries(RANKING_METRICS.map((m) => [m.key, 25]));

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

  function getPriorityIndex(value: number): number {
    return PRIORITY_LEVELS.findIndex((p) => p.value === value);
  }

  function setPriority(key: string, value: number) {
    setWeights((prev) => ({ ...prev, [key]: value }));
  }

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
          Tell us what matters to you and we&apos;ll rank the best matches from real test data.
        </p>
      </section>

      {/* Priority cards */}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {RANKING_METRICS.map((metric) => {
            const currentIdx = getPriorityIndex(weights[metric.key]);
            return (
              <div
                key={metric.key}
                className="rounded-lg p-4"
                style={{
                  backgroundColor: weights[metric.key] === 0 ? "transparent" : "var(--surface-container-lowest)",
                  border: weights[metric.key] === 0 ? "1px solid var(--border-subtle)" : "1px solid var(--outline-variant)",
                  opacity: weights[metric.key] === 0 ? 0.6 : 1,
                }}
              >
                <div className="mb-1">
                  <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                    {metric.label}
                  </span>
                </div>
                <p
                  className="text-xs mb-3"
                  style={{ color: "var(--on-surface-variant-muted)" }}
                >
                  {METRIC_DESCRIPTIONS[metric.key]}
                </p>
                <div className="flex gap-1">
                  {PRIORITY_LEVELS.map((level, i) => (
                    <button
                      key={level.value}
                      onClick={() => setPriority(metric.key, level.value)}
                      className="flex-1 py-1.5 text-xs font-medium rounded-md transition-colors"
                      style={
                        i === currentIdx
                          ? {
                              backgroundColor: "var(--primary)",
                              color: "white",
                            }
                          : {
                              backgroundColor: "transparent",
                              color: "var(--on-surface-variant-muted)",
                            }
                      }
                      onMouseEnter={(e) => {
                        if (i !== currentIdx) {
                          e.currentTarget.style.backgroundColor = "var(--surface-container)";
                          e.currentTarget.style.color = "var(--foreground)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (i !== currentIdx) {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "var(--on-surface-variant-muted)";
                        }
                      }}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
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
                    <td
                      className="py-3 pl-6 pr-3 tabular-nums text-sm font-semibold"
                      style={{ color: "var(--on-surface-variant-muted)" }}
                    >
                      {idx + 1}
                    </td>
                    <td className="py-3 px-3 font-semibold whitespace-nowrap">
                      <Link
                        href={`/vehicles/${vehicle.slug}`}
                        className="hover:underline"
                        style={{ color: "var(--primary)" }}
                      >
                        {vehicle.name}
                      </Link>
                    </td>
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
