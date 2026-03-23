"use client";

import { useMemo, useState } from "react";
import { sheets } from "@/data/sheets";
import {
  RadarChart as ReRadar,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
  Legend,
} from "recharts";

// ── helpers ──────────────────────────────────────────────────────────────────

function parseNum(s: string | undefined): number | null {
  if (!s || s === "") return null;
  if (s.includes("+")) return s.split("+").reduce((a, b) => a + (parseFloat(b) || 0), 0);
  const cleaned = s.replace(",", ".").replace(/[^0-9.\-]/g, "");
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

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
  let min = Infinity;
  let max = -Infinity;
  for (const row of sheet.rows) {
    if (filterFn && !filterFn(row)) continue;
    const n = parseNum(row[colIdx]);
    if (n !== null) {
      if (n < min) min = n;
      if (n > max) max = n;
    }
  }
  return { min: min === Infinity ? 0 : min, max: max === -Infinity ? 0 : max };
}

function normalize(val: number, min: number, max: number, lowerIsBetter: boolean): number {
  if (max === min) return 50;
  const pct = ((val - min) / (max - min)) * 100;
  return lowerIsBetter ? 100 - pct : pct;
}

// ── metrics config ───────────────────────────────────────────────────────────

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

const CAR_COLORS = ["#818cf8", "#34d399", "#fb923c", "#f472b6", "#60a5fa"];

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
    const n = parseNum(row[metric.colIdx]);
    if (n === null) continue;
    if (best === null || (metric.lowerIsBetter ? n < best : n > best)) best = n;
  }
  if (best === null) return null;
  const range = METRIC_RANGES[metric.key];
  return { raw: best, normalized: Math.round(normalize(best, range.min, range.max, metric.lowerIsBetter)) };
}

const ALL_CARS = Array.from(
  new Set(
    sheets
      .filter((s) => ["Banana", "Acceleration", "Weight", "Noise", "Braking"].includes(s.name))
      .flatMap((s) => s.rows.map((r) => r[0]))
  )
).sort();

// ── Radar ────────────────────────────────────────────────────────────────────

function RadarSection() {
  const [selected, setSelected] = useState<string[]>(["Tesla Model Y", "BMW iX", "Hyundai Ioniq 5"]);
  const [query, setQuery] = useState("");

  const suggestions = useMemo(() => {
    if (!query || query.length < 2) return [];
    return ALL_CARS.filter((c) => fuzzyMatch(c, query)).slice(0, 8);
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
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-zinc-200">Car Comparison Radar</h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Up to 5 cars across 6 metrics — normalized 0–100, higher always better
        </p>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        {selected.map((car, i) => (
          <span
            key={car}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: CAR_COLORS[i] + "22",
              color: CAR_COLORS[i],
              border: `1px solid ${CAR_COLORS[i]}55`,
            }}
          >
            {car}
            <button
              onClick={() => setSelected(selected.filter((c) => c !== car))}
              className="opacity-60 hover:opacity-100 leading-none"
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
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 w-44"
            />
            {suggestions.length > 0 && (
              <div className="absolute top-full mt-1 left-0 w-72 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => addCar(s)}
                    className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 truncate"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ReRadar data={radarData} outerRadius="70%">
            <PolarGrid stroke="#3f3f46" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
            {selected.map((car, i) => (
              <Radar
                key={car}
                name={car}
                dataKey={car}
                stroke={CAR_COLORS[i]}
                fill={CAR_COLORS[i]}
                fillOpacity={0.12}
                strokeWidth={2}
              />
            ))}
            <Legend formatter={(v) => <span style={{ color: "#a1a1aa", fontSize: 11 }}>{v}</span>} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value: unknown, name: unknown, props: any) => {
                const raw = props.payload[`${name}_raw`];
                const unit = props.payload[`${name}_unit`];
                return [`${value} pts (${raw} ${unit})`, String(name)];
              }}
            />
          </ReRadar>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Acceleration vs Hp/Weight ─────────────────────────────────────────────────

function AccelScatter() {
  const accelSheet = useMemo(() => findSheet("Acceleration"), []);

  const data = useMemo(() => {
    const driveColors: Record<string, string> = { AWD: "#818cf8", RWD: "#34d399", FWD: "#fb923c" };
    return accelSheet.rows
      .map((r) => {
        const accel = parseNum(r[15]);
        const hpw = parseNum(r[21]);
        const drive = r[1] || "AWD";
        if (accel === null || hpw === null || hpw === 0) return null;
        return { car: r[0], accel, hpw, drive, color: driveColors[drive] ?? "#71717a" };
      })
      .filter(Boolean) as { car: string; accel: number; hpw: number; drive: string; color: string }[];
  }, [accelSheet]);

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    return <circle cx={cx} cy={cy} r={4} fill={payload.color} fillOpacity={0.8} />;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-xs space-y-0.5">
        <div className="font-medium text-zinc-100">{d.car}</div>
        <div className="text-zinc-400">
          {d.drive} · {d.accel}s · {d.hpw.toFixed(3)} hp/kg
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-zinc-200">Acceleration vs Power-to-Weight</h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          0–100 km/h time vs hp/kg — top-right = efficient power delivery
        </p>
      </div>
      <div className="flex gap-4 text-xs text-zinc-400">
        {[["AWD", "#818cf8"], ["RWD", "#34d399"], ["FWD", "#fb923c"]].map(([d, c]) => (
          <span key={d} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
            {d}
          </span>
        ))}
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
            <XAxis
              dataKey="hpw"
              type="number"
              name="hp/kg"
              tick={{ fill: "#71717a", fontSize: 11 }}
              label={{ value: "hp / kg", position: "insideBottom", offset: -10, fill: "#71717a", fontSize: 11 }}
            />
            <YAxis
              dataKey="accel"
              type="number"
              name="0-100s"
              reversed
              tick={{ fill: "#71717a", fontSize: 11 }}
              label={{ value: "0-100 (s)", angle: -90, position: "insideLeft", offset: 15, fill: "#71717a", fontSize: 11 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter data={data} shape={<CustomDot />} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Degradation scatter ───────────────────────────────────────────────────────

function DegradationChart() {
  const degSheet = useMemo(() => findSheet("Degradation"), []);

  const data = useMemo(() => {
    return degSheet.rows
      .map((r) => {
        const odo = parseNum(r[3]);
        const degr = parseNum(r[8]);
        if (odo === null || degr === null) return null;
        return { car: r[0], odo, degr };
      })
      .filter(Boolean) as { car: string; odo: number; degr: number }[];
  }, [degSheet]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-xs space-y-0.5">
        <div className="font-medium text-zinc-100">{d.car}</div>
        <div className="text-zinc-400">
          {d.odo}k km · {d.degr.toFixed(1)}% degradation
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-zinc-200">Battery Degradation</h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Odometer (thousands of km) vs measured capacity loss — lower is better
        </p>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
            <XAxis
              dataKey="odo"
              type="number"
              name="Odo"
              tick={{ fill: "#71717a", fontSize: 11 }}
              label={{ value: "Odometer (1000 km)", position: "insideBottom", offset: -10, fill: "#71717a", fontSize: 11 }}
            />
            <YAxis
              dataKey="degr"
              type="number"
              name="Degradation %"
              tick={{ fill: "#71717a", fontSize: 11 }}
              label={{ value: "Degradation %", angle: -90, position: "insideLeft", offset: 15, fill: "#71717a", fontSize: 11 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter data={data} fill="#818cf8" fillOpacity={0.75} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Noise histogram ───────────────────────────────────────────────────────────

function NoiseHistogram() {
  const noiseSheet = useMemo(() => findSheet("Noise"), []);

  const data = useMemo(() => {
    const buckets = new Map<number, number>();
    for (const row of noiseSheet.rows) {
      const n = parseNum(row[9]);
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
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-xs">
        <div className="text-zinc-100">{label} dB</div>
        <div className="text-zinc-400">{payload[0].value} test{payload[0].value !== 1 ? "s" : ""}</div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-zinc-200">Cabin Noise Distribution</h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Average dB across all noise tests (0.5 dB buckets) — green = quieter, red = louder
        </p>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="db"
              tick={{ fill: "#71717a", fontSize: 10 }}
              label={{ value: "Average dB", position: "insideBottom", offset: -10, fill: "#71717a", fontSize: 11 }}
              interval={3}
            />
            <YAxis tick={{ fill: "#71717a", fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fill={
                    i < data.length * 0.33
                      ? "#34d399"
                      : i < data.length * 0.66
                      ? "#818cf8"
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

// ── Range efficiency scatter ──────────────────────────────────────────────────

function RangeEfficiency() {
  const rangeSheet = useMemo(() => findSheet("Range"), []);

  const data = useMemo(() => {
    return rangeSheet.rows
      .filter((r) => r[7] === "90")
      .map((r) => {
        const wh = parseNum(r[8]);
        const km = parseNum(r[10]);
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
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-xs space-y-0.5">
        <div className="font-medium text-zinc-100">{d.car}</div>
        <div className="text-zinc-400">
          {d.km} km · {d.wh} Wh/km · {d.season}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-zinc-200">Range vs Efficiency at 90 km/h</h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Actual km achieved vs Wh/km consumed — top-left = efficient, bottom-right = large battery
        </p>
      </div>
      <div className="flex gap-4 text-xs text-zinc-400">
        {[["Summer", "#34d399"], ["Winter", "#60a5fa"]].map(([s, c]) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
            {s}
          </span>
        ))}
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
            <XAxis
              dataKey="wh"
              type="number"
              name="Wh/km"
              tick={{ fill: "#71717a", fontSize: 11 }}
              label={{ value: "Wh/km", position: "insideBottom", offset: -10, fill: "#71717a", fontSize: 11 }}
            />
            <YAxis
              dataKey="km"
              type="number"
              name="km"
              tick={{ fill: "#71717a", fontSize: 11 }}
              label={{ value: "Range (km)", angle: -90, position: "insideLeft", offset: 15, fill: "#71717a", fontSize: 11 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter data={data} shape={<CustomDot />} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────

export default function Charts() {
  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 pb-20 pt-6 space-y-8">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
          <RadarSection />
        </div>
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
          <AccelScatter />
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
          <RangeEfficiency />
        </div>
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
          <DegradationChart />
        </div>
      </div>
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
        <NoiseHistogram />
      </div>
    </div>
  );
}
