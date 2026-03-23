import { sheets } from "@/data/sheets";
import { parseNum } from "./sheet-utils";

export function findSheet(name: string) {
  return sheets.find((s) => s.name === name)!;
}

export function fuzzyMatch(candidate: string, query: string): boolean {
  const lc = candidate.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => lc.includes(word));
}

export function colMinMax(
  sheetName: string,
  colIdx: number,
  filterFn?: (r: string[]) => boolean
): { min: number; max: number } {
  const sheet = findSheet(sheetName);
  let min = Infinity,
    max = -Infinity;
  for (const row of sheet.rows) {
    if (filterFn && !filterFn(row)) continue;
    const n = parseNum(row[colIdx] ?? "");
    if (n !== null) {
      if (n < min) min = n;
      if (n > max) max = n;
    }
  }
  return { min: min === Infinity ? 0 : min, max: max === -Infinity ? 0 : max };
}

export function normalizeScore(
  val: number,
  min: number,
  max: number,
  lowerIsBetter: boolean
): number {
  if (max === min) return 50;
  const pct = ((val - min) / (max - min)) * 100;
  return lowerIsBetter ? 100 - pct : pct;
}

export type Metric = {
  key: string;
  label: string;
  sheetName: string;
  colIdx: number;
  lowerIsBetter: boolean;
  unit: string;
  filterFn?: (r: string[]) => boolean;
};

export const METRICS: Metric[] = [
  { key: "range", label: "Range", sheetName: "Range", colIdx: 10, lowerIsBetter: false, unit: "km", filterFn: (r) => r[7] === "90" },
  { key: "trunk", label: "Trunk", sheetName: "Banana", colIdx: 2, lowerIsBetter: false, unit: "L" },
  { key: "accel", label: "Acceleration", sheetName: "Acceleration", colIdx: 15, lowerIsBetter: true, unit: "s" },
  { key: "noise", label: "Silence", sheetName: "Noise", colIdx: 9, lowerIsBetter: true, unit: "dB" },
  { key: "braking", label: "Braking", sheetName: "Braking", colIdx: 8, lowerIsBetter: true, unit: "m" },
  { key: "weight", label: "Light", sheetName: "Weight", colIdx: 1, lowerIsBetter: true, unit: "kg" },
];

export const METRIC_RANGES = Object.fromEntries(
  METRICS.map((m) => [m.key, colMinMax(m.sheetName, m.colIdx, m.filterFn)])
) as Record<string, { min: number; max: number }>;

export const RADAR_COLORS = ["#3525cd", "#34d399", "#fb923c", "#f472b6", "#60a5fa"];

export function getMetricValue(
  carQuery: string,
  metric: Metric
): { raw: number; normalized: number } | null {
  const sheet = findSheet(metric.sheetName);
  if (!sheet) return null;
  const matching = sheet.rows.filter(
    (r) => fuzzyMatch(r[0], carQuery) || fuzzyMatch(carQuery, r[0])
  );
  if (matching.length === 0) return null;
  const filtered = metric.filterFn ? matching.filter(metric.filterFn) : matching;
  const rows = filtered.length > 0 ? filtered : matching;
  let best: number | null = null;
  for (const row of rows) {
    const n = parseNum(row[metric.colIdx] ?? "");
    if (n === null) continue;
    if (best === null || (metric.lowerIsBetter ? n < best : n > best)) best = n;
  }
  if (best === null) return null;
  const range = METRIC_RANGES[metric.key];
  return {
    raw: best,
    normalized: Math.round(
      normalizeScore(best, range.min, range.max, metric.lowerIsBetter)
    ),
  };
}

export const ALL_RADAR_CARS = Array.from(
  new Set(
    sheets
      .filter((s) =>
        ["Banana", "Acceleration", "Weight", "Noise", "Braking"].includes(s.name)
      )
      .flatMap((s) => s.rows.map((r) => r[0]))
  )
).sort();
