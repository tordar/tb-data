import type { Stats, ChartEntry, TestSheet, TestMeta } from "@/lib/types";
import { parseNum } from "./parsing";

export function normalizeScore(val: number, min: number, max: number, lowerIsBetter: boolean): number {
  if (max === min) return 50;
  const pct = ((val - min) / (max - min)) * 100;
  return Math.round(lowerIsBetter ? 100 - pct : pct);
}

export function colMinMax(rows: string[][], colIdx: number, filterFn?: (r: string[]) => boolean): { min: number; max: number } {
  let min = Infinity, max = -Infinity;
  for (const row of rows) {
    if (filterFn && !filterFn(row)) continue;
    const n = parseNum(row[colIdx] ?? "");
    if (n !== null) { if (n < min) min = n; if (n > max) max = n; }
  }
  return { min: min === Infinity ? 0 : min, max: max === -Infinity ? 0 : max };
}

export function computeStats(sheet: TestSheet, meta: TestMeta): Stats | null {
  const colIdx = sheet.headers.indexOf(meta.colName);
  if (colIdx < 0) return null;
  const pairs: ChartEntry[] = sheet.rows
    .map((row) => ({ name: row[0] ?? "", val: parseNum(row[colIdx] ?? "") as number }))
    .filter((p) => p.val !== null && !isNaN(p.val) && p.name !== "");
  if (pairs.length === 0) return null;
  const sorted = [...pairs].sort((a, b) => meta.lowerIsBetter ? a.val - b.val : b.val - a.val);
  const avg = Math.round((pairs.reduce((s, p) => s + p.val, 0) / pairs.length) * 10) / 10;
  const top10 = sorted.slice(0, 10).map((p) => ({
    name: p.name.length > 32 ? p.name.slice(0, 30) + "…" : p.name, val: p.val,
  }));
  return { count: pairs.length, best: sorted[0], avg, unit: meta.unit, lowerIsBetter: meta.lowerIsBetter, top10 };
}

export interface RankedVehicle {
  name: string; slug: string; scores: Record<string, number>; weightedScore: number;
}

export function computeWeightedRank(
  vehicles: { name: string; slug: string; scores: Record<string, number> }[],
  weights: Record<string, number>
): RankedVehicle[] {
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  if (totalWeight === 0) return vehicles.map((v) => ({ ...v, weightedScore: 0 }));
  return vehicles
    .map((v) => {
      let weightedSum = 0;
      for (const [key, weight] of Object.entries(weights)) {
        if (v.scores[key] !== undefined) weightedSum += v.scores[key] * weight;
      }
      return { ...v, weightedScore: Math.round(weightedSum / totalWeight) };
    })
    .sort((a, b) => b.weightedScore - a.weightedScore);
}
