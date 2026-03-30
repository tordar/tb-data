import { getTests, getTestBySlug } from "@/lib/data/tests";
import { getVehicleByName } from "@/lib/data/vehicles";
import { parseNum } from "@/lib/utils/parsing";
import { normalizeScore, colMinMax } from "@/lib/utils/scoring";
import type { MetricConfig, VehicleProfile, VehicleTestResult, ComparisonMetric } from "@/lib/types";

export const RANKING_METRICS: MetricConfig[] = [
  { key: "range", label: "Range (90 km/h)", testSlug: "range", colName: "km", lowerIsBetter: false, unit: "km", filterFn: (row, headers) => row[headers.indexOf("Speed")] === "90" },
  { key: "cargo", label: "Cargo", testSlug: "banana", colName: "Seats folded", lowerIsBetter: false, unit: "boxes" },
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

    const vehicleRow = sheet.rows.find((r) => r[0] === vehicleName);
    if (!vehicleRow) continue;

    const rawValue = vehicleRow[colIdx] ?? "";
    const value = parseNum(rawValue);
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

    const rowA = sheet.rows.find((r) => r[0] === nameA);
    const rowB = sheet.rows.find((r) => r[0] === nameB);

    const valueA = rowA ? parseNum(rowA[colIdx] ?? "") : null;
    const valueB = rowB ? parseNum(rowB[colIdx] ?? "") : null;

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

    const vehicleRow = sheet.rows.find(
      (r) => r[0] === vehicleName && (!filterFn || filterFn(r))
    );
    if (!vehicleRow) continue;

    const value = parseNum(vehicleRow[colIdx] ?? "");
    if (value === null) continue;

    const { min, max } = colMinMax(sheet.rows, colIdx, filterFn);
    scores[metric.key] = normalizeScore(value, min, max, metric.lowerIsBetter);
  }

  if (Object.keys(scores).length === 0) return null;

  return scores;
}
