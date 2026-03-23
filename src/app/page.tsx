"use client";

import { useState, useMemo } from "react";
import { sheets, type Sheet } from "@/data/sheets";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  CartesianGrid,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────────────

type SortDir = "asc" | "desc";

// ─── Config ──────────────────────────────────────────────────────────────────

const BAR_COLS: Record<string, string[]> = {
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

const SHEET_ICONS: Record<string, string> = {
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

type SheetConfig = {
  colName: string;
  lowerIsBetter: boolean;
  unit: string;
  description: string;
};

const SHEET_CONFIG: Record<string, SheetConfig> = {
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

function parseNum(s: string): number | null {
  if (!s || s === "") return null;
  if (s.includes("+")) {
    return s.split("+").reduce((a, b) => a + (parseFloat(b) || 0), 0);
  }
  if (/^\d+:\d+$/.test(s)) {
    const [h, m] = s.split(":").map(Number);
    return h * 60 + m;
  }
  // Handle European decimals (1,5 → 1.5) before stripping non-numeric chars
  const normalised = s.replace(",", ".");
  const n = parseFloat(normalised.replace(/[^0-9.\-]/g, ""));
  return isNaN(n) ? null : n;
}

function isNumericCol(sheet: Sheet, colIdx: number): boolean {
  if (colIdx === 0) return false;
  const vals = sheet.rows.slice(0, 20).map((r) => r[colIdx] ?? "");
  const nonEmpty = vals.filter((v) => v !== "");
  if (nonEmpty.length === 0) return false;
  return nonEmpty.filter((v) => parseNum(v) !== null).length / nonEmpty.length > 0.7;
}

function colMax(sheet: Sheet, colIdx: number): number {
  let max = 0;
  for (const row of sheet.rows) {
    const n = parseNum(row[colIdx] ?? "");
    if (n !== null && n > max) max = n;
  }
  return max;
}

function fmt(n: number, unit: string): string {
  if (unit === "banana") return `${n} 🍌`;
  if (n % 1 === 0) return `${n} ${unit}`;
  return `${n.toFixed(1)} ${unit}`;
}

// ─── Stats computation ───────────────────────────────────────────────────────

type ChartEntry = { name: string; val: number };

type Stats = {
  count: number;
  best: { name: string; val: number };
  avg: number;
  unit: string;
  lowerIsBetter: boolean;
  top10: ChartEntry[];
};

function computeStats(sheet: Sheet): Stats | null {
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

// ─── Top-10 Chart ─────────────────────────────────────────────────────────────

function TopChart({ stats }: { stats: Stats }) {
  // recharts BarChart layout="vertical" renders bottom-to-top,
  // so we reverse so best appears at the top visually.
  const data = [...stats.top10].reverse();

  return (
    <ResponsiveContainer width="100%" height={360}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 4, right: 48, left: 0, bottom: 4 }}
      >
        <XAxis
          type="number"
          tick={{ fontSize: 10, fill: "#777587", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={210}
          tick={{ fontSize: 11, fill: "#464555", fontFamily: "var(--font-inter), Inter, sans-serif" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(value: unknown) => [
            `${value} ${stats.unit === "banana" ? "🍌" : stats.unit}`,
            "",
          ]}
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: "1px solid #c7c4d8",
            backgroundColor: "#fff",
            boxShadow: "0 8px 32px rgba(27,28,28,0.08)",
          }}
          cursor={{ fill: "rgba(53,37,205,0.04)" }}
        />
        <Bar dataKey="val" radius={[0, 4, 4, 0]}>
          {data.map((_, idx) => (
            <Cell
              key={idx}
              fill={
                idx === data.length - 1
                  ? "#3525cd"
                  : `rgba(53,37,205,${0.25 + (idx / data.length) * 0.65})`
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Chart helpers ────────────────────────────────────────────────────────────

function findSheet(name: string) {
  return sheets.find((s) => s.name === name)!;
}

function fuzzyMatch(candidate: string, query: string): boolean {
  const lc = candidate.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => lc.includes(word));
}

function colMinMax(
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

function normalizeScore(
  val: number,
  min: number,
  max: number,
  lowerIsBetter: boolean
): number {
  if (max === min) return 50;
  const pct = ((val - min) / (max - min)) * 100;
  return lowerIsBetter ? 100 - pct : pct;
}

type Metric = {
  key: string;
  label: string;
  sheetName: string;
  colIdx: number;
  lowerIsBetter: boolean;
  unit: string;
  filterFn?: (r: string[]) => boolean;
};

const METRICS: Metric[] = [
  { key: "range", label: "Range", sheetName: "Range", colIdx: 10, lowerIsBetter: false, unit: "km", filterFn: (r) => r[7] === "90" },
  { key: "trunk", label: "Trunk", sheetName: "Banana", colIdx: 2, lowerIsBetter: false, unit: "L" },
  { key: "accel", label: "Acceleration", sheetName: "Acceleration", colIdx: 15, lowerIsBetter: true, unit: "s" },
  { key: "noise", label: "Silence", sheetName: "Noise", colIdx: 9, lowerIsBetter: true, unit: "dB" },
  { key: "braking", label: "Braking", sheetName: "Braking", colIdx: 8, lowerIsBetter: true, unit: "m" },
  { key: "weight", label: "Light", sheetName: "Weight", colIdx: 1, lowerIsBetter: true, unit: "kg" },
];

const METRIC_RANGES = Object.fromEntries(
  METRICS.map((m) => [m.key, colMinMax(m.sheetName, m.colIdx, m.filterFn)])
) as Record<string, { min: number; max: number }>;

const RADAR_COLORS = ["#3525cd", "#34d399", "#fb923c", "#f472b6", "#60a5fa"];

function getMetricValue(
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

const ALL_RADAR_CARS = Array.from(
  new Set(
    sheets
      .filter((s) =>
        ["Banana", "Acceleration", "Weight", "Noise", "Braking"].includes(s.name)
      )
      .flatMap((s) => s.rows.map((r) => r[0]))
  )
).sort();

// ─── Radar comparison (shown on Banana sheet) ─────────────────────────────────

function RadarSection() {
  const [selected, setSelected] = useState<string[]>([
    "Tesla Model Y",
    "BMW iX",
    "Hyundai Ioniq 5",
  ]);
  const [query, setQuery] = useState("");

  const suggestions = useMemo(() => {
    if (!query || query.length < 2) return [];
    return ALL_RADAR_CARS.filter((c) => fuzzyMatch(c, query)).slice(0, 8);
  }, [query]);

  function addCar(car: string) {
    if (!selected.includes(car) && selected.length < 5) setSelected([...selected, car]);
    setQuery("");
  }

  const radarData = useMemo(
    () =>
      METRICS.map((m) => {
        const point: Record<string, string | number> = { subject: m.label };
        for (const car of selected) {
          const v = getMetricValue(car, m);
          point[car] = v?.normalized ?? 0;
          point[`${car}_raw`] = v?.raw ?? "N/A";
          point[`${car}_unit`] = m.unit;
        }
        return point;
      }),
    [selected]
  );

  return (
    <div
      className="p-6 lg:p-8 rounded-xl editorial-shadow"
      style={{ backgroundColor: "#ffffff", border: "1px solid rgba(199,196,216,0.15)" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h3 className="font-bold text-base tracking-tight" style={{ color: "#1b1c1c" }}>
            Car Comparison
          </h3>
          <p
            className="text-xs mt-0.5"
            style={{
              color: "#777587",
              fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
            }}
          >
            Up to 5 cars across 6 metrics — normalized 0–100, higher always better
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {selected.map((car, i) => (
            <span
              key={car}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: RADAR_COLORS[i] + "18",
                color: RADAR_COLORS[i],
                border: `1px solid ${RADAR_COLORS[i]}44`,
              }}
            >
              {car}
              <button
                onClick={() => setSelected(selected.filter((c) => c !== car))}
                className="opacity-50 hover:opacity-100"
              >
                ×
              </button>
            </span>
          ))}
          {selected.length < 5 && (
            <div className="relative">
              <input
                type="text"
                placeholder="Add car…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="rounded-full py-1.5 px-4 text-sm outline-none"
                style={{
                  backgroundColor: "#f5f3f3",
                  color: "#1b1c1c",
                  border: "1px solid #c7c4d8",
                  width: "160px",
                }}
              />
              {suggestions.length > 0 && (
                <div
                  className="absolute top-full mt-1 left-0 w-72 rounded-xl shadow-xl z-50 overflow-hidden"
                  style={{ backgroundColor: "#ffffff", border: "1px solid #c7c4d8" }}
                >
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => addCar(s)}
                      className="w-full text-left px-4 py-2 text-sm truncate hover:bg-[#f5f3f3]"
                      style={{ color: "#1b1c1c" }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} outerRadius="70%">
            <PolarGrid stroke="rgba(199,196,216,0.5)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: "#464555", fontSize: 12 }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
            {selected.map((car, i) => (
              <Radar
                key={car}
                name={car}
                dataKey={car}
                stroke={RADAR_COLORS[i]}
                fill={RADAR_COLORS[i]}
                fillOpacity={0.1}
                strokeWidth={2}
              />
            ))}
            <Legend
              formatter={(v) => (
                <span style={{ color: "#464555", fontSize: 11 }}>{v}</span>
              )}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid #c7c4d8",
                backgroundColor: "#fff",
                boxShadow: "0 8px 32px rgba(27,28,28,0.08)",
              }}
              formatter={(value: unknown, name: unknown, props: any) => {
                const raw = props.payload[`${name}_raw`];
                const unit = props.payload[`${name}_unit`];
                return [`${value} pts (${raw} ${unit})`, String(name)];
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Acceleration scatter (Acceleration sheet) ────────────────────────────────

function AccelScatterChart() {
  const accelSheet = useMemo(() => findSheet("Acceleration"), []);

  const data = useMemo(() => {
    const driveColors: Record<string, string> = {
      AWD: "#3525cd",
      RWD: "#34d399",
      FWD: "#fb923c",
    };
    return accelSheet.rows
      .map((r) => {
        const accel = parseNum(r[15] ?? "");
        const hpw = parseNum(r[21] ?? "");
        const drive = r[1] || "AWD";
        if (accel === null || hpw === null || hpw === 0) return null;
        return { car: r[0], accel, hpw, drive, color: driveColors[drive] ?? "#777587" };
      })
      .filter(Boolean) as { car: string; accel: number; hpw: number; drive: string; color: string }[];
  }, [accelSheet]);

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    return <circle cx={cx} cy={cy} r={4} fill={payload.color} fillOpacity={0.7} />;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div
        className="rounded-xl p-2 text-xs"
        style={{
          backgroundColor: "#fff",
          border: "1px solid #c7c4d8",
          boxShadow: "0 8px 32px rgba(27,28,28,0.08)",
        }}
      >
        <div className="font-semibold" style={{ color: "#1b1c1c" }}>
          {d.car}
        </div>
        <div style={{ color: "#777587" }}>
          {d.drive} · {d.accel}s · {d.hpw.toFixed(3)} hp/kg
        </div>
      </div>
    );
  };

  return (
    <div
      className="p-6 lg:p-8 rounded-xl editorial-shadow"
      style={{ backgroundColor: "#ffffff", border: "1px solid rgba(199,196,216,0.15)" }}
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="font-bold text-base tracking-tight" style={{ color: "#1b1c1c" }}>
            Acceleration vs Power-to-Weight
          </h3>
          <p
            className="text-xs mt-0.5"
            style={{
              color: "#777587",
              fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
            }}
          >
            0–100 km/h time vs hp/kg — lower-left = fastest relative to weight
          </p>
        </div>
        <div className="flex gap-4 text-xs" style={{ color: "#777587" }}>
          {(
            [
              ["AWD", "#3525cd"],
              ["RWD", "#34d399"],
              ["FWD", "#fb923c"],
            ] as const
          ).map(([d, c]) => (
            <span key={d} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: c }}
              />
              {d}
            </span>
          ))}
        </div>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 5, right: 20, bottom: 24, left: 0 }}>
            <CartesianGrid stroke="rgba(199,196,216,0.3)" strokeDasharray="3 3" />
            <XAxis
              dataKey="hpw"
              type="number"
              name="hp/kg"
              tick={{ fill: "#777587", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              label={{
                value: "hp / kg",
                position: "insideBottom",
                offset: -14,
                fill: "#777587",
                fontSize: 11,
              }}
            />
            <YAxis
              dataKey="accel"
              type="number"
              name="0-100s"
              reversed
              tick={{ fill: "#777587", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              label={{
                value: "0-100 (s)",
                angle: -90,
                position: "insideLeft",
                offset: 15,
                fill: "#777587",
                fontSize: 11,
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter data={data} shape={<CustomDot />} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Noise histogram (Noise sheet) ────────────────────────────────────────────

function NoiseHistogramChart() {
  const noiseSheet = useMemo(() => findSheet("Noise"), []);

  const data = useMemo(() => {
    const buckets = new Map<number, number>();
    for (const row of noiseSheet.rows) {
      const n = parseNum(row[9] ?? "");
      if (n === null) continue;
      const bucket = Math.round(n * 2) / 2;
      buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
    }
    return Array.from(buckets.entries())
      .sort(([a], [b]) => a - b)
      .map(([db, count]) => ({ db: db.toFixed(1), count }));
  }, [noiseSheet]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div
        className="rounded-xl p-2 text-xs"
        style={{
          backgroundColor: "#fff",
          border: "1px solid #c7c4d8",
          boxShadow: "0 8px 32px rgba(27,28,28,0.08)",
        }}
      >
        <div style={{ color: "#1b1c1c" }}>{label} dB</div>
        <div style={{ color: "#777587" }}>
          {payload[0].value} test{payload[0].value !== 1 ? "s" : ""}
        </div>
      </div>
    );
  };

  return (
    <div
      className="p-6 lg:p-8 rounded-xl editorial-shadow"
      style={{ backgroundColor: "#ffffff", border: "1px solid rgba(199,196,216,0.15)" }}
    >
      <div className="mb-6">
        <h3 className="font-bold text-base tracking-tight" style={{ color: "#1b1c1c" }}>
          Cabin Noise Distribution
        </h3>
        <p
          className="text-xs mt-0.5"
          style={{
            color: "#777587",
            fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
          }}
        >
          Average dB across all tests (0.5 dB buckets) — green = quieter, red = louder
        </p>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, bottom: 24, left: 0 }}>
            <CartesianGrid
              stroke="rgba(199,196,216,0.3)"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="db"
              tick={{ fill: "#777587", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              label={{
                value: "Average dB",
                position: "insideBottom",
                offset: -14,
                fill: "#777587",
                fontSize: 11,
              }}
              interval={3}
            />
            <YAxis tick={{ fill: "#777587", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(53,37,205,0.04)" }} />
            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fill={
                    i < data.length * 0.33
                      ? "#34d399"
                      : i < data.length * 0.66
                      ? "#3525cd"
                      : "#f87171"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Range efficiency scatter (Range sheet) ───────────────────────────────────

function RangeEfficiencyChart() {
  const rangeSheet = useMemo(() => findSheet("Range"), []);

  const data = useMemo(() => {
    return rangeSheet.rows
      .filter((r) => r[7] === "90")
      .map((r) => {
        const wh = parseNum(r[8] ?? "");
        const km = parseNum(r[10] ?? "");
        if (wh === null || km === null) return null;
        const season = r[4] ?? "Summer";
        const color = season.toLowerCase().includes("summer") ? "#34d399" : "#60a5fa";
        return { car: r[0], wh, km, season, color };
      })
      .filter(Boolean) as { car: string; wh: number; km: number; season: string; color: string }[];
  }, [rangeSheet]);

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    return <circle cx={cx} cy={cy} r={3.5} fill={payload.color} fillOpacity={0.75} />;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div
        className="rounded-xl p-2 text-xs"
        style={{
          backgroundColor: "#fff",
          border: "1px solid #c7c4d8",
          boxShadow: "0 8px 32px rgba(27,28,28,0.08)",
        }}
      >
        <div className="font-semibold" style={{ color: "#1b1c1c" }}>
          {d.car}
        </div>
        <div style={{ color: "#777587" }}>
          {d.km} km · {d.wh} Wh/km · {d.season}
        </div>
      </div>
    );
  };

  return (
    <div
      className="p-6 lg:p-8 rounded-xl editorial-shadow"
      style={{ backgroundColor: "#ffffff", border: "1px solid rgba(199,196,216,0.15)" }}
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="font-bold text-base tracking-tight" style={{ color: "#1b1c1c" }}>
            Range vs Efficiency at 90 km/h
          </h3>
          <p
            className="text-xs mt-0.5"
            style={{
              color: "#777587",
              fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
            }}
          >
            Actual range achieved vs Wh/km consumed — top-left = efficient, bottom-right = large battery
          </p>
        </div>
        <div className="flex gap-4 text-xs" style={{ color: "#777587" }}>
          {(
            [
              ["Summer", "#34d399"],
              ["Winter", "#60a5fa"],
            ] as const
          ).map(([s, c]) => (
            <span key={s} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: c }}
              />
              {s}
            </span>
          ))}
        </div>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 5, right: 20, bottom: 24, left: 0 }}>
            <CartesianGrid stroke="rgba(199,196,216,0.3)" strokeDasharray="3 3" />
            <XAxis
              dataKey="wh"
              type="number"
              name="Wh/km"
              tick={{ fill: "#777587", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              label={{
                value: "Wh/km",
                position: "insideBottom",
                offset: -14,
                fill: "#777587",
                fontSize: 11,
              }}
            />
            <YAxis
              dataKey="km"
              type="number"
              name="km"
              tick={{ fill: "#777587", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              label={{
                value: "Range (km)",
                angle: -90,
                position: "insideLeft",
                offset: 15,
                fill: "#777587",
                fontSize: 11,
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter data={data} shape={<CustomDot />} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Degradation scatter (Degradation sheet) ──────────────────────────────────

function DegradationScatterChart() {
  const degSheet = useMemo(() => findSheet("Degradation"), []);

  const data = useMemo(() => {
    return degSheet.rows
      .map((r) => {
        const odo = parseNum(r[3] ?? "");
        const degr = parseNum(r[8] ?? "");
        if (odo === null || degr === null) return null;
        return { car: r[0], odo, degr };
      })
      .filter(Boolean) as { car: string; odo: number; degr: number }[];
  }, [degSheet]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div
        className="rounded-xl p-2 text-xs"
        style={{
          backgroundColor: "#fff",
          border: "1px solid #c7c4d8",
          boxShadow: "0 8px 32px rgba(27,28,28,0.08)",
        }}
      >
        <div className="font-semibold" style={{ color: "#1b1c1c" }}>
          {d.car}
        </div>
        <div style={{ color: "#777587" }}>
          {d.odo}k km · {d.degr.toFixed(1)}% degradation
        </div>
      </div>
    );
  };

  return (
    <div
      className="p-6 lg:p-8 rounded-xl editorial-shadow"
      style={{ backgroundColor: "#ffffff", border: "1px solid rgba(199,196,216,0.15)" }}
    >
      <div className="mb-6">
        <h3 className="font-bold text-base tracking-tight" style={{ color: "#1b1c1c" }}>
          Battery Degradation
        </h3>
        <p
          className="text-xs mt-0.5"
          style={{
            color: "#777587",
            fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
          }}
        >
          Odometer (thousands of km) vs measured capacity loss
        </p>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 5, right: 20, bottom: 24, left: 0 }}>
            <CartesianGrid stroke="rgba(199,196,216,0.3)" strokeDasharray="3 3" />
            <XAxis
              dataKey="odo"
              type="number"
              name="Odo"
              tick={{ fill: "#777587", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              label={{
                value: "Odometer (1000 km)",
                position: "insideBottom",
                offset: -14,
                fill: "#777587",
                fontSize: 11,
              }}
            />
            <YAxis
              dataKey="degr"
              type="number"
              name="Degradation %"
              tick={{ fill: "#777587", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              label={{
                value: "Degradation %",
                angle: -90,
                position: "insideLeft",
                offset: 15,
                fill: "#777587",
                fontSize: 11,
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter data={data} fill="#3525cd" fillOpacity={0.65} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Home() {
  const [activeSheet, setActiveSheet] = useState(0);
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState<number>(0);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bananaFilter, setBananaFilter] = useState<"all" | "car" | "van">("all");

  const sheet = sheets[activeSheet];
  const config = SHEET_CONFIG[sheet.name];
  const icon = SHEET_ICONS[sheet.name] ?? "table_chart";

  function switchSheet(idx: number) {
    setActiveSheet(idx);
    setSearch("");
    setSortCol(0);
    setSortDir("asc");
    setSidebarOpen(false);
    setBananaFilter("all");
  }

  function handleSort(colIdx: number) {
    if (sortCol === colIdx) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(colIdx);
      setSortDir("asc");
    }
  }

  // For Banana sheet: identify the embedded "Van" section header and van rows
  const bananaVanNames = useMemo(() => {
    if (sheet.name !== "Banana") return null;
    const pivotIdx = sheet.rows.findIndex((r) => r[0] === "Van" && r[1] === "Trunk");
    if (pivotIdx < 0) return new Set<string>();
    return new Set(sheet.rows.slice(pivotIdx + 1).map((r) => r[0]));
  }, [sheet]);

  // Rows after applying banana type filter (used by both stats/chart and table)
  const activeRows = useMemo(() => {
    if (!bananaVanNames || bananaFilter === "all") return sheet.rows;
    return sheet.rows.filter((r) => {
      if (r[0] === "Van" && r[1] === "Trunk") return false;
      const isVan = bananaVanNames.has(r[0]);
      return bananaFilter === "van" ? isVan : !isVan;
    });
  }, [sheet, bananaVanNames, bananaFilter]);

  const filtered = useMemo(
    () =>
      activeRows
        .filter((row) => {
          // Remove the embedded "Van / Trunk / Seats folded" section header
          if (sheet.name === "Banana" && row[0] === "Van" && row[1] === "Trunk") return false;
          if (!search) return true;
          return row.some((cell) => cell.toLowerCase().includes(search.toLowerCase()));
        })
        .sort((a, b) => {
          const av = a[sortCol] ?? "";
          const bv = b[sortCol] ?? "";
          const an = parseNum(av);
          const bn = parseNum(bv);
          if (an !== null && bn !== null)
            return sortDir === "asc" ? an - bn : bn - an;
          return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
        }),
    [activeRows, sheet, search, sortCol, sortDir]
  );

  const colMeta = useMemo(
    () =>
      sheet.headers.map((_, i) => ({
        isNumeric: isNumericCol(sheet, i),
        max: colMax(sheet, i),
        isBar: (BAR_COLS[sheet.name] ?? []).includes(sheet.headers[i]),
      })),
    [sheet]
  );

  const stats = useMemo(
    () => computeStats({ ...sheet, rows: activeRows }),
    [sheet, activeRows]
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#fbf9f8", color: "#1b1c1c" }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ backgroundColor: "rgba(0,0,0,0.15)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 flex flex-col py-8 px-4 z-50 transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{ backgroundColor: "#f5f3f3" }}
      >
        {/* Brand */}
        <div className="mb-8 px-2">
          <h1 className="font-bold text-xl tracking-tight" style={{ color: "#3525cd" }}>
            EV Curator
          </h1>
          <p
            className="text-xs mt-0.5 uppercase tracking-[0.18em]"
            style={{
              color: "#464555",
              opacity: 0.6,
              fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
              fontSize: "0.625rem",
            }}
          >
            Intelligence Report
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto">
          {sheets.map((s, i) => {
            const navIcon = SHEET_ICONS[s.name] ?? "table_chart";
            const isActive = i === activeSheet;
            return (
              <button
                key={s.name}
                onClick={() => switchSheet(i)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors rounded-lg text-left group"
                style={
                  isActive
                    ? {
                        color: "#3525cd",
                        backgroundColor: "rgba(255,255,255,0.6)",
                        fontWeight: 600,
                        borderRight: "3px solid #3525cd",
                        borderRadius: "0.375rem 0 0 0.375rem",
                      }
                    : { color: "#464555" }
                }
                onMouseEnter={(e) => {
                  if (!isActive) {
                    const el = e.currentTarget;
                    el.style.backgroundColor = "#efeded";
                    el.style.color = "#1b1c1c";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    const el = e.currentTarget;
                    el.style.backgroundColor = "transparent";
                    el.style.color = "#464555";
                  }
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                  {navIcon}
                </span>
                <span>{s.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Export button */}
        <div className="pt-6 border-t" style={{ borderColor: "rgba(199,196,216,0.15)" }}>
          <button
            className="w-full py-2.5 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #3525cd, #4f46e5)" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
              file_download
            </span>
            Export Dataset
          </button>
        </div>
      </aside>

      {/* ─── Main ─────────────────────────────────────────────────────────── */}
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen min-w-0 overflow-hidden">
        {/* Top bar */}
        <header
          className="fixed top-0 right-0 left-0 lg:left-64 z-40 flex items-center justify-between px-6 lg:px-10 h-16"
          style={{
            backgroundColor: "rgba(251,249,248,0.85)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(199,196,216,0.18)",
            boxShadow: "0 8px 32px 0 rgba(27,28,28,0.04)",
          }}
        >
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-1.5 rounded-lg"
              style={{ color: "#464555" }}
              onClick={() => setSidebarOpen(true)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>

            <div className="flex items-center gap-2.5">
              <span
                className="material-symbols-outlined"
                style={{ color: "#3525cd", fontSize: "20px" }}
              >
                {icon}
              </span>
              <span className="font-bold text-base tracking-tight" style={{ color: "#1b1c1c" }}>
                {sheet.name}
              </span>
            </div>
          </div>

          <div className="relative hidden sm:block">
            <span
              className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "#777587", fontSize: "16px" }}
            >
              search
            </span>
            <input
              type="text"
              placeholder={`Search ${sheet.name}…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-full py-2 pl-9 pr-4 text-sm w-56 transition-all outline-none"
              style={{ backgroundColor: "#f5f3f3", border: "none", color: "#1b1c1c" }}
              onFocus={(e) => {
                (e.target as HTMLInputElement).style.boxShadow =
                  "0 0 0 2px rgba(53,37,205,0.2)";
              }}
              onBlur={(e) => {
                (e.target as HTMLInputElement).style.boxShadow = "none";
              }}
            />
          </div>
        </header>

        {/* ─── Content ──────────────────────────────────────────────────── */}
        <div className="mt-16 flex-1 p-6 lg:p-10 space-y-8">
          {/* Page heading */}
          <section>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  className="text-3xl font-extrabold tracking-tight"
                  style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}
                >
                  {sheet.name}
                </h2>
                {config && (
                  <p className="mt-1 text-sm" style={{ color: "#777587" }}>
                    {config.description}
                  </p>
                )}
              </div>
              {bananaVanNames && (
                <div
                  className="flex items-center gap-0.5 p-0.5 rounded-lg shrink-0"
                  style={{ backgroundColor: "#efeded" }}
                >
                  {(["all", "car", "van"] as const).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setBananaFilter(opt)}
                      className="px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors"
                      style={{
                        backgroundColor: bananaFilter === opt ? "#ffffff" : "transparent",
                        color: bananaFilter === opt ? "#1b1c1c" : "#777587",
                        boxShadow: bananaFilter === opt ? "0 1px 3px rgba(27,28,28,0.08)" : "none",
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ─── Bento: stats + chart ──────────────────────────────────── */}
          {stats && (
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Stats column */}
              <div className="lg:col-span-4 space-y-4">
                {/* Total vehicles */}
                <div
                  className="p-6 rounded-xl editorial-shadow"
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid rgba(199,196,216,0.15)",
                  }}
                >
                  <span
                    className="text-xs font-bold uppercase tracking-[0.18em]"
                    style={{
                      color: "#3525cd",
                      fontFamily:
                        "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                    }}
                  >
                    Vehicles Tested
                  </span>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span
                      className="text-5xl font-extrabold"
                      style={{
                        fontFamily: "var(--font-inter), Inter, sans-serif",
                        color: "#1b1c1c",
                      }}
                    >
                      {stats.count}
                    </span>
                    <span className="text-sm" style={{ color: "#777587" }}>
                      models
                    </span>
                  </div>
                  {search && (
                    <p className="mt-1 text-xs" style={{ color: "#777587" }}>
                      {filtered.length} matching search
                    </p>
                  )}
                </div>

                {/* Best */}
                <div
                  className="p-6 rounded-xl editorial-shadow"
                  style={{
                    backgroundColor: "#3525cd",
                    border: "1px solid rgba(199,196,216,0.15)",
                  }}
                >
                  <span
                    className="text-xs font-bold uppercase tracking-[0.18em]"
                    style={{
                      color: "rgba(255,255,255,0.65)",
                      fontFamily:
                        "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                    }}
                  >
                    {stats.lowerIsBetter ? "Best (Lowest)" : "Best (Highest)"}
                  </span>
                  <div className="mt-2">
                    <p
                      className="text-lg font-bold leading-snug text-white"
                      title={stats.best.name}
                    >
                      {stats.best.name.length > 28
                        ? stats.best.name.slice(0, 26) + "…"
                        : stats.best.name}
                    </p>
                    <p className="text-2xl font-extrabold mt-1" style={{ color: "#dad7ff" }}>
                      {fmt(stats.best.val, stats.unit)}
                    </p>
                  </div>
                </div>

                {/* Average */}
                <div
                  className="p-6 rounded-xl editorial-shadow"
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid rgba(199,196,216,0.15)",
                  }}
                >
                  <span
                    className="text-xs font-bold uppercase tracking-[0.18em]"
                    style={{
                      color: "#777587",
                      fontFamily:
                        "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                    }}
                  >
                    Average
                  </span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold" style={{ color: "#1b1c1c" }}>
                      {stats.unit === "banana"
                        ? stats.avg
                        : stats.avg}
                    </span>
                    <span className="text-sm" style={{ color: "#777587" }}>
                      {stats.unit === "banana" ? "🍌" : stats.unit}
                    </span>
                  </div>
                  {/* Progress relative to best */}
                  <div
                    className="mt-4 h-1.5 rounded-full overflow-hidden"
                    style={{ backgroundColor: "#efeded" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: "#3525cd",
                        width: stats.lowerIsBetter
                          ? `${(stats.best.val / stats.avg) * 100}%`
                          : `${(stats.avg / stats.best.val) * 100}%`,
                        maxWidth: "100%",
                        opacity: 0.5,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div
                className="lg:col-span-8 p-6 lg:p-8 rounded-xl editorial-shadow"
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid rgba(199,196,216,0.15)",
                }}
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3
                      className="font-bold text-base tracking-tight"
                      style={{ color: "#1b1c1c" }}
                    >
                      Top 10 — {config.colName}
                    </h3>
                    <p
                      className="text-xs mt-0.5"
                      style={{
                        color: "#777587",
                        fontFamily:
                          "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                      }}
                    >
                      {stats.lowerIsBetter ? "Lower is better" : "Higher is better"}
                    </p>
                  </div>
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: "#e2dfff", color: "#3323cc" }}
                  >
                    {stats.unit === "banana" ? "🍌 banana" : stats.unit}
                  </span>
                </div>
                <TopChart stats={stats} />
              </div>
            </section>
          )}

          {/* ─── Sheet-specific charts ──────────────────────────────────── */}
          {sheet.name === "Banana" && <RadarSection />}
          {sheet.name === "Acceleration" && <AccelScatterChart />}
          {sheet.name === "Noise" && <NoiseHistogramChart />}
          {sheet.name === "Range" && <RangeEfficiencyChart />}
          {sheet.name === "Degradation" && <DegradationScatterChart />}

          {/* ─── Full data table ────────────────────────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3
                  className="font-bold text-lg tracking-tight"
                  style={{ color: "#1b1c1c" }}
                >
                  Full Dataset
                </h3>
                <p className="text-xs mt-0.5" style={{ color: "#777587" }}>
                  {filtered.length} of {sheet.rows.length} entries
                  {search && ` matching "${search}"`}
                </p>
              </div>
              {/* Mobile search */}
              <div className="sm:hidden">
                <input
                  type="text"
                  placeholder="Search…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="rounded-full py-1.5 px-4 text-sm outline-none"
                  style={{ backgroundColor: "#f5f3f3", color: "#1b1c1c" }}
                />
              </div>
            </div>

            <div
              className="rounded-xl overflow-hidden editorial-shadow"
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid rgba(199,196,216,0.15)",
              }}
            >
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-max text-sm">
                  <thead style={{ backgroundColor: "#eae8e7" }}>
                    <tr>
                      {sheet.headers.map((h, i) => (
                        <th
                          key={i}
                          className={`py-3.5 ${
                            i === 0
                              ? "text-left px-6 sticky left-0"
                              : colMeta[i].isBar
                              ? "text-left pl-4 min-w-[200px] pr-4"
                              : "text-right pr-6"
                          }`}
                          style={{ backgroundColor: "#eae8e7" }}
                        >
                          <button
                            onClick={() => handleSort(i)}
                            className="flex items-center gap-1 transition-colors"
                            style={{
                              fontFamily:
                                "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                              fontSize: "0.6875rem",
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                              fontWeight: 600,
                              color: sortCol === i ? "#1b1c1c" : "#777587",
                              marginLeft: i !== 0 && !colMeta[i].isBar ? "auto" : undefined,
                            }}
                          >
                            {h}
                            {sortCol === i ? (
                              <span style={{ color: "#3525cd", fontSize: "0.75rem" }}>
                                {sortDir === "asc" ? "↑" : "↓"}
                              </span>
                            ) : (
                              <span style={{ opacity: 0.25, fontSize: "0.75rem" }}>↕</span>
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
                          colSpan={sheet.headers.length}
                          className="py-16 text-center text-sm"
                          style={{ color: "#777587" }}
                        >
                          No rows match your search.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((row, ri) => (
                        <tr
                          key={ri}
                          className="group transition-colors cursor-pointer"
                          style={{ borderTop: "1px solid #f0eeee" }}
                          onMouseEnter={(e) =>
                            ((e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                              "#fafafa")
                          }
                          onMouseLeave={(e) =>
                            ((e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                              "transparent")
                          }
                        >
                          {sheet.headers.map((_, ci) => {
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
                                  style={{
                                    color: "#1b1c1c",
                                    backgroundColor: "inherit",
                                  }}
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
                                sheet.name === "Banana"
                                  ? pct > 65
                                    ? "#10b981"
                                    : pct > 40
                                    ? "#3b82f6"
                                    : pct > 20
                                    ? "#6366f1"
                                    : "#c7c4d8"
                                  : sheet.name === "Acceleration" || sheet.name === "Braking"
                                  ? "#f43f5e"
                                  : "#3525cd";

                              return (
                                <td key={ci} className="py-3.5 pl-4 pr-4">
                                  <div className="flex items-center gap-3 min-w-[180px]">
                                    <div
                                      className="flex-1 h-1.5 rounded-full overflow-hidden"
                                      style={{ backgroundColor: "#efeded" }}
                                    >
                                      <div
                                        className="h-full rounded-full transition-all"
                                        style={{ width: `${pct}%`, backgroundColor: barColor }}
                                      />
                                    </div>
                                    <span
                                      className="tabular-nums text-xs w-12 text-right shrink-0 font-medium"
                                      style={{ color: "#464555" }}
                                    >
                                      {val || "—"}
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
                                    ? "#1b1c1c"
                                    : val
                                    ? "#777587"
                                    : "#c7c4d8",
                                  fontSize: meta.isNumeric ? "0.875rem" : "0.8125rem",
                                }}
                              >
                                {val || "—"}
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
        </div>
      </main>
    </div>
  );
}
