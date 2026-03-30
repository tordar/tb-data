"use client";

import Link from "next/link";
import type { VehicleProfile } from "@/lib/types";
import videoLinks from "@/data/video-links.json";

interface VehicleProfileViewProps {
  profile: VehicleProfile;
}

const SUMMARY_TEST_NAMES = ["Range", "Acceleration", "Noise", "Weight", "Banana", "Braking"];

function fmtValue(n: number): string {
  if (n % 1 === 0) return String(n);
  return n.toFixed(1);
}

function getPercentileColor(percentile: number): string {
  if (percentile >= 75) return "#34d399";
  if (percentile >= 50) return "#3525cd";
  if (percentile >= 25) return "#fb923c";
  return "#f43f5e";
}

function calcPercentile(rank: number, totalTested: number): number {
  return Math.round((1 - (rank - 1) / totalTested) * 100);
}

export function VehicleProfileView({ profile }: VehicleProfileViewProps) {
  const summaryResults = profile.results.filter((r) =>
    SUMMARY_TEST_NAMES.includes(r.testName)
  );

  const isVan = profile.type === "van";
  const videoId = (videoLinks as Record<string, string>)[profile.slug];

  return (
    <div className="space-y-8">
      {/* Header */}
      <section>
        <div className="flex items-center gap-3 flex-wrap">
          <h2
            className="text-3xl font-extrabold tracking-tight"
            style={{ fontFamily: "var(--font-inter), Inter, sans-serif", color: "var(--foreground)" }}
          >
            {profile.name}
          </h2>
          <span
            className="text-[11px] font-bold uppercase tracking-[0.12em] px-2.5 py-1 rounded-full"
            style={{
              backgroundColor: isVan ? "#e2dfff" : "#f0fdf4",
              color: isVan ? "#3323cc" : "#15803d",
            }}
          >
            {isVan ? "Van" : "Car"}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-3 flex-wrap">
          <p className="text-sm" style={{ color: "var(--on-surface-variant-muted)" }}>
            {profile.results.length} test{profile.results.length !== 1 ? "s" : ""} with recorded data
          </p>
          {videoId && (
            <a
              href={`https://www.youtube.com/watch?v=${videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-opacity hover:opacity-80"
              style={{ backgroundColor: "#ff0000", color: "white" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>play_arrow</span>
              Watch test video
            </a>
          )}
        </div>
      </section>

      {/* Summary cards */}
      {summaryResults.length > 0 && (
        <section>
          <h3
            className="text-xs font-bold uppercase tracking-[0.18em] mb-4"
            style={{
              color: "var(--on-surface-variant-muted)",
              fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
            }}
          >
            Key Metrics
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {summaryResults.map((result) => {
              const percentile = calcPercentile(result.rank, result.totalTested);
              const color = getPercentileColor(percentile);
              return (
                <div
                  key={result.testSlug}
                  className="p-4 rounded-xl editorial-shadow flex flex-col gap-2"
                  style={{
                    backgroundColor: "var(--surface-container-lowest)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <span
                    className="text-[10px] font-bold uppercase tracking-[0.14em]"
                    style={{
                      color: "var(--on-surface-variant-muted)",
                      fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                    }}
                  >
                    {result.testName}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span
                      className="text-2xl font-extrabold tabular-nums"
                      style={{ color: "var(--foreground)" }}
                    >
                      {fmtValue(result.value)}
                    </span>
                    <span className="text-xs" style={{ color: "var(--on-surface-variant-muted)" }}>
                      {result.unit === "banana" ? "🍌" : result.unit}
                    </span>
                  </div>
                  <span
                    className="text-[11px] font-semibold"
                    style={{ color }}
                  >
                    #{result.rank} of {result.totalTested}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Full results table */}
      <section>
        <h3
          className="text-xs font-bold uppercase tracking-[0.18em] mb-4"
          style={{
            color: "var(--on-surface-variant-muted)",
            fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
          }}
        >
          All Test Results
        </h3>
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
                  {["Test", "Value", "Rank", "Percentile"].map((h) => (
                    <th
                      key={h}
                      className={`py-3.5 ${h === "Test" ? "text-left px-6" : h === "Percentile" ? "text-left px-6" : "text-right pr-6"}`}
                      style={{
                        fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                        fontSize: "0.6875rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        fontWeight: 600,
                        color: "var(--on-surface-variant-muted)",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {profile.results.map((result) => {
                  const percentile = calcPercentile(result.rank, result.totalTested);
                  const barColor = getPercentileColor(percentile);
                  return (
                    <tr
                      key={result.testSlug}
                      style={{ borderTop: "1px solid var(--row-border)" }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLTableRowElement).style.backgroundColor = "var(--row-hover)")
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLTableRowElement).style.backgroundColor = "transparent")
                      }
                    >
                      {/* Test name */}
                      <td className="py-3.5 px-6 font-semibold whitespace-nowrap">
                        <Link
                          href={`/tests/${result.testSlug}`}
                          className="hover:underline"
                          style={{ color: "var(--primary)" }}
                        >
                          {result.testName}
                        </Link>
                      </td>

                      {/* Value */}
                      <td
                        className="py-3.5 pr-6 tabular-nums whitespace-nowrap text-right font-medium"
                        style={{ color: "var(--foreground)" }}
                      >
                        {fmtValue(result.value)}{" "}
                        <span style={{ color: "var(--on-surface-variant-muted)", fontWeight: 400 }}>
                          {result.unit === "banana" ? "🍌" : result.unit}
                        </span>
                      </td>

                      {/* Rank */}
                      <td
                        className="py-3.5 pr-6 tabular-nums whitespace-nowrap text-right"
                        style={{ color: "var(--on-surface-variant)" }}
                      >
                        {result.rank} / {result.totalTested}
                      </td>

                      {/* Percentile bar */}
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3 min-w-[160px]">
                          <div
                            className="flex-1 h-1.5 rounded-full overflow-hidden"
                            style={{ backgroundColor: "var(--surface-container)" }}
                          >
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${percentile}%`, backgroundColor: barColor }}
                            />
                          </div>
                          <span
                            className="tabular-nums text-xs w-10 text-right shrink-0 font-semibold"
                            style={{ color: barColor }}
                          >
                            {percentile}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Compare button */}
      <section>
        <Link
          href={`/compare?a=${profile.slug}`}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm text-white transition-opacity hover:opacity-90"
          style={{
            background: "linear-gradient(135deg, #3525cd 0%, #6366f1 100%)",
            boxShadow: "0 4px 16px 0 rgba(53,37,205,0.25)",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
            compare_arrows
          </span>
          Compare {profile.name}
        </Link>
      </section>
    </div>
  );
}
