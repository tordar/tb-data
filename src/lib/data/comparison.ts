import { getTests, getTestBySlug } from "@/lib/data/tests";
import { getVehicleByName } from "@/lib/data/vehicles";
import { parseNum } from "@/lib/utils/parsing";
import { normalizeScore, colMinMax } from "@/lib/utils/scoring";
import type { MetricConfig, VehicleProfile, VehicleTestResult, ComparisonMetric } from "@/lib/types";

/**
 * Find all rows in a sheet whose vehicle name starts with the given name.
 * Bjørn's data uses variants like "Tesla Model Y LR", "Tesla Model Y Performance",
 * etc. — we match by prefix so "Tesla Model Y" finds all of them.
 */
function findVehicleRows(rows: string[][], vehicleName: string): string[][] {
  // Try exact match first
  const exact = rows.filter((r) => r[0] === vehicleName);
  if (exact.length > 0) return exact;
  // Fall back to prefix match
  return rows.filter((r) => r[0]?.startsWith(vehicleName));
}

/**
 * Get the best value for a vehicle in a column, considering all variant rows.
 * "Best" means lowest for lowerIsBetter, highest otherwise.
 */
function getBestValue(
  rows: string[][],
  colIdx: number,
  lowerIsBetter: boolean,
  filterFn?: (row: string[]) => boolean
): number | null {
  let best: number | null = null;
  for (const row of rows) {
    if (filterFn && !filterFn(row)) continue;
    const n = parseNum(row[colIdx] ?? "");
    if (n === null) continue;
    if (best === null || (lowerIsBetter ? n < best : n > best)) best = n;
  }
  return best;
}

// Build set of banana van names (and pivot row) to exclude from cargo normalization
const _bananaVanNames: Set<string> = (() => {
  const sheet = getTestBySlug("banana");
  if (!sheet) return new Set();
  const pivotIdx = sheet.rows.findIndex((r) => r[0] === "Van" && r[1] === "Trunk");
  if (pivotIdx < 0) return new Set();
  const names = new Set(sheet.rows.slice(pivotIdx).map((r) => r[0]));
  return names;
})();

export const RANKING_METRICS: MetricConfig[] = [
  { key: "range", label: "Range (90 km/h)", testSlug: "range", colName: "km", lowerIsBetter: false, unit: "km", filterFn: (row, headers) => row[headers.indexOf("Speed")] === "90" },
  { key: "cargo", label: "Cargo", testSlug: "banana", colName: "Seats folded", lowerIsBetter: false, unit: "boxes", filterFn: (row) => !_bananaVanNames.has(row[0]) },
  { key: "acceleration", label: "Acceleration", testSlug: "acceleration", colName: "0-100", lowerIsBetter: true, unit: "s" },
  { key: "noise", label: "Noise", testSlug: "noise", colName: "Average", lowerIsBetter: true, unit: "dB" },
  { key: "braking", label: "Braking", testSlug: "braking", colName: "Distance", lowerIsBetter: true, unit: "m" },
  { key: "weight", label: "Weight", testSlug: "weight", colName: "Total", lowerIsBetter: true, unit: "kg" },
];

export function getVehicleProfile(vehicleName: string): VehicleProfile | null {
  const vehicle = getVehicleByName(vehicleName);
  if (!vehicle) return null;

  const allMeta = getTests();
  const results: VehicleTestResult[] = [];

  for (const meta of allMeta) {
    if (!meta.colName) continue;

    const sheet = getTestBySlug(meta.slug);
    if (!sheet) continue;

    const colIdx = sheet.headers.indexOf(meta.colName);
    if (colIdx < 0) continue;

    const matchingRows = findVehicleRows(sheet.rows, vehicleName);
    if (matchingRows.length === 0) continue;

    const value = getBestValue(matchingRows, colIdx, meta.lowerIsBetter);
    if (value === null) continue;

    // Compute rank by collecting all valid values and sorting
    const allValues: number[] = [];
    for (const row of sheet.rows) {
      const v = parseNum(row[colIdx] ?? "");
      if (v !== null) allValues.push(v);
    }

    if (meta.lowerIsBetter) {
      allValues.sort((a, b) => a - b);
    } else {
      allValues.sort((a, b) => b - a);
    }

    const rank = allValues.indexOf(value) + 1;
    const totalTested = allValues.length;

    results.push({
      testName: meta.name,
      testSlug: meta.slug,
      value,
      rank,
      totalTested,
      unit: meta.unit,
    });
  }

  return {
    name: vehicle.name,
    slug: vehicle.slug,
    type: vehicle.type,
    results,
  };
}

export function getVehiclesForComparison(
  nameA: string,
  nameB: string
): { vehicleA: string; vehicleB: string; metrics: ComparisonMetric[] } | null {
  const vehicleA = getVehicleByName(nameA);
  const vehicleB = getVehicleByName(nameB);
  if (!vehicleA || !vehicleB) return null;

  const allMeta = getTests();
  const metrics: ComparisonMetric[] = [];

  for (const meta of allMeta) {
    if (!meta.colName) continue;

    const sheet = getTestBySlug(meta.slug);
    if (!sheet) continue;

    const colIdx = sheet.headers.indexOf(meta.colName);
    if (colIdx < 0) continue;

    const rowsA = findVehicleRows(sheet.rows, nameA);
    const rowsB = findVehicleRows(sheet.rows, nameB);

    const valueA = getBestValue(rowsA, colIdx, meta.lowerIsBetter);
    const valueB = getBestValue(rowsB, colIdx, meta.lowerIsBetter);

    // Only include if at least one vehicle has data
    if (valueA === null && valueB === null) continue;

    let winner: "a" | "b" | "tie" | null = null;
    if (valueA !== null && valueB !== null) {
      if (valueA === valueB) {
        winner = "tie";
      } else if (meta.lowerIsBetter) {
        winner = valueA < valueB ? "a" : "b";
      } else {
        winner = valueA > valueB ? "a" : "b";
      }
    }

    metrics.push({
      testName: meta.name,
      testSlug: meta.slug,
      unit: meta.unit,
      lowerIsBetter: meta.lowerIsBetter,
      valueA,
      valueB,
      winner,
    });
  }

  if (metrics.length === 0) return null;

  return {
    vehicleA: nameA,
    vehicleB: nameB,
    metrics,
  };
}

export function getMetricScores(vehicleName: string): Record<string, number> | null {
  const vehicle = getVehicleByName(vehicleName);
  if (!vehicle) return null;

  const scores: Record<string, number> = {};

  for (const metric of RANKING_METRICS) {
    const sheet = getTestBySlug(metric.testSlug);
    if (!sheet) continue;

    const colIdx = sheet.headers.indexOf(metric.colName);
    if (colIdx < 0) continue;

    const filterFn = metric.filterFn
      ? (row: string[]) => metric.filterFn!(row, sheet.headers)
      : undefined;

    const matchingRows = findVehicleRows(sheet.rows, vehicleName);
    if (matchingRows.length === 0) continue;

    const value = getBestValue(matchingRows, colIdx, metric.lowerIsBetter, filterFn);
    if (value === null) continue;

    const { min, max } = colMinMax(sheet.rows, colIdx, filterFn);
    scores[metric.key] = normalizeScore(value, min, max, metric.lowerIsBetter);
  }

  if (Object.keys(scores).length === 0) return null;

  return scores;
}
