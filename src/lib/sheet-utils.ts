import { type Sheet } from "@/data/sheets";

// ─── Types ───────────────────────────────────────────────────────────────────

export type SortDir = "asc" | "desc";

// ─── Config ──────────────────────────────────────────────────────────────────

export const BAR_COLS: Record<string, string[]> = {
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

export const SHEET_ICONS: Record<string, string> = {
  Banana: "luggage",
  Weight: "monitor_weight",
  Acceleration: "speed",
  Noise: "volume_up",
  Braking: "tire_repair",
  Range: "ev_station",
  Sunday: "wb_sunny",
  "1000 km": "route",
  "500 km": "route",
  "Arctic Circle": "ac_unit",
  Bangkok: "travel_explore",
  Degradation: "battery_alert",
};

export type SheetConfig = {
  colName: string;
  lowerIsBetter: boolean;
  unit: string;
  description: string;
};

export const SHEET_CONFIG: Record<string, SheetConfig> = {
  Banana: {
    colName: "Seats folded",
    lowerIsBetter: false,
    unit: "banana",
    description: "Cargo volume with rear seats flat — the Bjørn Nyland banana box test",
  },
  Weight: {
    colName: "Total",
    lowerIsBetter: true,
    unit: "kg",
    description: "Curb weight distribution across the EV segment",
  },
  Acceleration: {
    colName: "0-100",
    lowerIsBetter: true,
    unit: "s",
    description: "0–100 km/h acceleration benchmarks",
  },
  Noise: {
    colName: "Average",
    lowerIsBetter: true,
    unit: "dB",
    description: "Interior noise levels at highway speeds",
  },
  Braking: {
    colName: "Distance",
    lowerIsBetter: true,
    unit: "m",
    description: "Emergency braking distance from 100 km/h",
  },
  Range: {
    colName: "km",
    lowerIsBetter: false,
    unit: "km",
    description: "Real-world range at 90 km/h",
  },
  Sunday: {
    colName: "Range",
    lowerIsBetter: false,
    unit: "km",
    description: "Sunday drive range estimates",
  },
  "1000 km": {
    colName: "km/h",
    lowerIsBetter: false,
    unit: "km/h",
    description: "1 000 km challenge — average speed including charging stops",
  },
  "500 km": {
    colName: "km/h",
    lowerIsBetter: false,
    unit: "km/h",
    description: "500 km challenge — average speed including charging stops",
  },
  "Arctic Circle": {
    colName: "km/h",
    lowerIsBetter: false,
    unit: "km/h",
    description: "Arctic Circle cold-weather challenge average speed",
  },
  Bangkok: {
    colName: "Wh/km",
    lowerIsBetter: true,
    unit: "Wh/km",
    description: "Bangkok heat test — energy consumption in tropical conditions",
  },
  Degradation: {
    colName: "Degradation",
    lowerIsBetter: true,
    unit: "%",
    description: "Battery capacity degradation vs. odometer reading",
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function parseNum(s: string): number | null {
  if (!s || s === "") return null;
  if (s.includes("+")) {
    return s.split("+").reduce((a, b) => a + (parseFloat(b) || 0), 0);
  }
  if (/^\d+:\d+$/.test(s)) {
    const [h, m] = s.split(":").map(Number);
    return h * 60 + m;
  }
  const normalised = s.replace(",", ".");
  const n = parseFloat(normalised.replace(/[^0-9.\-]/g, ""));
  return isNaN(n) ? null : n;
}

export function isNumericCol(sheet: Sheet, colIdx: number): boolean {
  if (colIdx === 0) return false;
  const vals = sheet.rows.slice(0, 20).map((r) => r[colIdx] ?? "");
  const nonEmpty = vals.filter((v) => v !== "");
  if (nonEmpty.length === 0) return false;
  return nonEmpty.filter((v) => parseNum(v) !== null).length / nonEmpty.length > 0.7;
}

export function colMax(sheet: Sheet, colIdx: number): number {
  let max = 0;
  for (const row of sheet.rows) {
    const n = parseNum(row[colIdx] ?? "");
    if (n !== null && n > max) max = n;
  }
  return max;
}

export function fmt(n: number, unit: string): string {
  if (unit === "banana") return `${n} 🍌`;
  if (n % 1 === 0) return `${n} ${unit}`;
  return `${n.toFixed(1)} ${unit}`;
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export type ChartEntry = { name: string; val: number };

export type Stats = {
  count: number;
  best: { name: string; val: number };
  avg: number;
  unit: string;
  lowerIsBetter: boolean;
  top10: ChartEntry[];
};

export function computeStats(sheet: Sheet): Stats | null {
  const config = SHEET_CONFIG[sheet.name];
  if (!config) return null;

  const colIdx = sheet.headers.indexOf(config.colName);
  if (colIdx < 0) return null;

  const pairs: ChartEntry[] = sheet.rows
    .map((row) => ({ name: row[0] ?? "", val: parseNum(row[colIdx] ?? "") as number }))
    .filter((p) => p.val !== null && !isNaN(p.val) && p.name !== "");

  if (pairs.length === 0) return null;

  const sorted = [...pairs].sort((a, b) =>
    config.lowerIsBetter ? a.val - b.val : b.val - a.val
  );

  const avg =
    Math.round((pairs.reduce((s, p) => s + p.val, 0) / pairs.length) * 10) / 10;

  const top10 = sorted.slice(0, 10).map((p) => ({
    name: p.name.length > 32 ? p.name.slice(0, 30) + "…" : p.name,
    val: p.val,
  }));

  return {
    count: pairs.length,
    best: sorted[0],
    avg,
    unit: config.unit,
    lowerIsBetter: config.lowerIsBetter,
    top10,
  };
}
