# TB Test Results Explorer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the EV Curator app into a properly routed, well-architected "TB Test Results Explorer" with vehicle profiles, weighted comparison, and head-to-head comparison features.

**Architecture:** Incremental refactor of existing Next.js 16 App Router app. Break monolithic page.tsx into 5 route pages. Extract data into JSON files consumed through a typed access layer. Group components by feature. Add three new feature pages: vehicle profiles, weighted ranker, and head-to-head comparison.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Recharts, jsPDF, Vitest

---

## File Map

### New files to create

```
src/
├── lib/
│   ├── types.ts                            → Shared TypeScript interfaces
│   ├── data/
│   │   ├── tests.ts                        → Test sheet data access functions
│   │   ├── vehicles.ts                     → Vehicle data access functions
│   │   └── comparison.ts                   → Comparison data access functions
│   └── utils/
│       ├── parsing.ts                      → parseNum, isNumericCol, colMax (from sheet-utils.ts)
│       ├── scoring.ts                      → normalizeScore, computeWeightedRank, computeStats
│       └── formatting.ts                   → fmt and other formatters
├── data/
│   ├── tests/
│   │   ├── meta.json                       → Sheet metadata array
│   │   ├── banana.json                     → One JSON file per test sheet
│   │   ├── weight.json
│   │   ├── acceleration.json
│   │   ├── noise.json
│   │   ├── braking.json
│   │   ├── range.json
│   │   ├── sunday.json
│   │   ├── 1000km.json
│   │   ├── 500km.json
│   │   ├── arctic-circle.json
│   │   ├── bangkok.json
│   │   ├── degradation.json
│   │   ├── geilo.json
│   │   └── zero-mile.json
│   └── vehicles.json                       → Unified vehicle list with slugs
├── app/
│   ├── tests/
│   │   └── [slug]/
│   │       └── page.tsx                    → Test sheet route page
│   ├── vehicles/
│   │   └── [slug]/
│   │       └── page.tsx                    → Vehicle profile route page
│   └── compare/
│       ├── page.tsx                        → Weighted ranker page
│       └── [slugA]/
│           └── [slugB]/
│               └── page.tsx               → Head-to-head comparison page
├── components/
│   ├── ui/
│   │   ├── StatCard.tsx                    → Reusable stat card (extracted from dashboard/stats bento)
│   │   ├── ChartCard.tsx                   → Reusable chart wrapper
│   │   ├── VehicleAutocomplete.tsx         → Vehicle search autocomplete
│   │   └── MetricBar.tsx                   → Horizontal progress bar for metric values
│   ├── dashboard/
│   │   ├── DashboardStats.tsx              → Dashboard stat cards (from DashboardView.tsx)
│   │   └── DashboardRadar.tsx              → Radar comparison (from RadarSection.tsx)
│   ├── tests/
│   │   ├── TestSheetView.tsx               → Main test sheet client component
│   │   ├── StatsBento.tsx                  → Stats + top 10 chart (moved from components/)
│   │   ├── TopChart.tsx                    → Top 10 bar chart (moved from components/)
│   │   ├── DataTable.tsx                   → Sortable data table (moved from components/)
│   │   └── charts/
│   │       ├── AccelScatterChart.tsx        → (moved)
│   │       ├── NoiseHistogramChart.tsx      → (moved)
│   │       ├── RangeEfficiencyChart.tsx     → (moved)
│   │       ├── DegradationScatterChart.tsx  → (moved)
│   │       ├── WltpRealityChart.tsx         → (moved)
│   │       └── WinterPenaltyChart.tsx       → (moved)
│   ├── vehicles/
│   │   ├── VehicleProfileView.tsx          → Vehicle profile client component
│   │   ├── VehicleSummary.tsx              → Key stats summary card
│   │   └── VehicleTestResults.tsx          → Full test results table with ranks
│   └── compare/
│       ├── WeightedRankerView.tsx          → Weighted ranker client component
│       ├── MetricSliders.tsx               → Priority sliders group
│       ├── RankedList.tsx                  → Ranked vehicle results list
│       ├── HeadToHeadView.tsx              → Head-to-head client component
│       └── ComparisonTable.tsx             → Side-by-side metric rows
scripts/
├── import-sheets.ts                        → Google Sheets CSV → JSON pipeline
.github/
└── workflows/
    └── update-data.yml                     → Weekly cron to run import script
```

### Files to modify

```
src/app/layout.tsx                          → Update metadata, branding, move sidebar here
src/app/page.tsx                            → Reduce to dashboard-only (from monolithic)
src/app/globals.css                         → Update primary color for branding
src/components/Sidebar.tsx                  → Convert to route-based navigation with Link
src/components/AppHeader.tsx                → Simplify (remove sheet-specific props)
```

### Files to delete after migration

```
src/data/sheets.ts                          → Replaced by JSON files
src/data/vehicles.ts                        → Replaced by vehicles.json
src/lib/sheet-utils.ts                      → Split into parsing.ts, scoring.ts, formatting.ts
src/lib/chart-utils.ts                      → Split into data/vehicles.ts, scoring.ts
src/components/DashboardView.tsx            → Split into dashboard/ components
src/components/RadarSection.tsx             → Moved to dashboard/DashboardRadar.tsx
src/components/Charts.tsx                   → Unused, delete
```

---

### Task 1: Set up testing infrastructure and shared types

**Files:**
- Create: `vitest.config.ts`
- Create: `src/lib/types.ts`
- Modify: `package.json`

- [ ] **Step 1: Install Vitest**

Run: `cd /Users/tordartommervik/Documents/code/tb-data && npm install -D vitest`

- [ ] **Step 2: Create Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 3: Add test script to package.json**

Add to `scripts` in `package.json`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Create shared types**

Create `src/lib/types.ts`:

```ts
export type SortDir = "asc" | "desc";

export interface TestSheet {
  name: string;
  slug: string;
  headers: string[];
  rows: string[][];
}

export interface TestMeta {
  name: string;
  slug: string;
  icon: string;
  colName: string;
  lowerIsBetter: boolean;
  unit: string;
  description: string;
}

export interface Vehicle {
  name: string;
  slug: string;
  type: "car" | "van";
  tests: string[]; // slugs of tests this vehicle appears in
}

export interface ChartEntry {
  name: string;
  val: number;
}

export interface Stats {
  count: number;
  best: ChartEntry;
  avg: number;
  unit: string;
  lowerIsBetter: boolean;
  top10: ChartEntry[];
}

export interface MetricConfig {
  key: string;
  label: string;
  testSlug: string;
  colName: string;
  lowerIsBetter: boolean;
  unit: string;
  filterFn?: (row: string[], headers: string[]) => boolean;
}

export interface VehicleTestResult {
  testName: string;
  testSlug: string;
  value: number;
  rank: number;
  totalTested: number;
  unit: string;
}

export interface VehicleProfile {
  name: string;
  slug: string;
  type: "car" | "van";
  results: VehicleTestResult[];
}

export interface ComparisonMetric {
  testName: string;
  testSlug: string;
  unit: string;
  lowerIsBetter: boolean;
  valueA: number | null;
  valueB: number | null;
  winner: "a" | "b" | "tie" | null;
}
```

- [ ] **Step 5: Verify setup**

Run: `cd /Users/tordartommervik/Documents/code/tb-data && npx vitest run`
Expected: 0 tests found, no errors.

- [ ] **Step 6: Commit**

```bash
cd /Users/tordartommervik/Documents/code/tb-data
git add vitest.config.ts src/lib/types.ts package.json package-lock.json
git commit -m "chore: add vitest, define shared TypeScript types"
```

---

### Task 2: Convert data to JSON and build data access layer

**Files:**
- Create: `scripts/convert-data.ts`
- Create: `src/data/tests/meta.json` (generated)
- Create: `src/data/tests/*.json` (generated)
- Create: `src/data/vehicles.json` (generated)
- Create: `src/lib/data/tests.ts`
- Create: `src/lib/data/vehicles.ts`
- Create: `src/lib/data/tests.test.ts`
- Create: `src/lib/data/vehicles.test.ts`

- [ ] **Step 1: Create data conversion script**

Create `scripts/convert-data.ts`:

```ts
/**
 * One-time script to convert existing TS data files to JSON.
 * Run with: npx tsx scripts/convert-data.ts
 */
import { sheets } from "../src/data/sheets";
import { vehicles } from "../src/data/vehicles";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const TESTS_DIR = join(__dirname, "../src/data/tests");
mkdirSync(TESTS_DIR, { recursive: true });

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function vehicleSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

// Sheet metadata config (carried over from sheet-utils.ts)
const SHEET_CONFIG: Record<string, { colName: string; lowerIsBetter: boolean; unit: string; description: string; icon: string }> = {
  Banana: { colName: "Seats folded", lowerIsBetter: false, unit: "banana", description: "Cargo volume with rear seats flat — the Bjørn Nyland banana box test", icon: "luggage" },
  Weight: { colName: "Total", lowerIsBetter: true, unit: "kg", description: "Curb weight distribution across the EV segment", icon: "monitor_weight" },
  Acceleration: { colName: "0-100", lowerIsBetter: true, unit: "s", description: "0–100 km/h acceleration benchmarks", icon: "speed" },
  Noise: { colName: "Average", lowerIsBetter: true, unit: "dB", description: "Interior noise levels at highway speeds", icon: "volume_up" },
  Braking: { colName: "Distance", lowerIsBetter: true, unit: "m", description: "Emergency braking distance from 100 km/h", icon: "tire_repair" },
  Range: { colName: "km", lowerIsBetter: false, unit: "km", description: "Real-world range at 90 km/h", icon: "ev_station" },
  Sunday: { colName: "Range", lowerIsBetter: false, unit: "km", description: "Sunday drive range estimates", icon: "wb_sunny" },
  "1000 km": { colName: "km/h", lowerIsBetter: false, unit: "km/h", description: "1 000 km challenge — average speed including charging stops", icon: "route" },
  "500 km": { colName: "km/h", lowerIsBetter: false, unit: "km/h", description: "500 km challenge — average speed including charging stops", icon: "route" },
  "Arctic Circle": { colName: "km/h", lowerIsBetter: false, unit: "km/h", description: "Arctic Circle cold-weather challenge average speed", icon: "ac_unit" },
  Bangkok: { colName: "Wh/km", lowerIsBetter: true, unit: "Wh/km", description: "Bangkok heat test — energy consumption in tropical conditions", icon: "travel_explore" },
  Degradation: { colName: "Degradation", lowerIsBetter: true, unit: "%", description: "Battery capacity degradation vs. odometer reading", icon: "battery_alert" },
};

// Write individual test sheet JSON files
for (const sheet of sheets) {
  const slug = slugify(sheet.name);
  const data = {
    name: sheet.name,
    slug,
    headers: sheet.headers,
    rows: sheet.rows,
  };
  writeFileSync(join(TESTS_DIR, `${slug}.json`), JSON.stringify(data, null, 2));
}

// Write meta.json
const meta = sheets.map((s) => {
  const slug = slugify(s.name);
  const config = SHEET_CONFIG[s.name];
  return {
    name: s.name,
    slug,
    icon: config?.icon ?? "table_chart",
    colName: config?.colName ?? "",
    lowerIsBetter: config?.lowerIsBetter ?? false,
    unit: config?.unit ?? "",
    description: config?.description ?? "",
  };
});
writeFileSync(join(TESTS_DIR, "meta.json"), JSON.stringify(meta, null, 2));

// Build unified vehicle list from all sheets
const vehicleMap = new Map<string, { type: "car" | "van"; tests: Set<string> }>();

// Get van names from Banana sheet
const bananaSheet = sheets.find((s) => s.name === "Banana");
const vanNames = new Set<string>();
if (bananaSheet) {
  const pivotIdx = bananaSheet.rows.findIndex((r) => r[0] === "Van" && r[1] === "Trunk");
  if (pivotIdx >= 0) {
    for (const row of bananaSheet.rows.slice(pivotIdx + 1)) {
      vanNames.add(row[0]);
    }
  }
}

for (const sheet of sheets) {
  const testSlug = slugify(sheet.name);
  for (const row of sheet.rows) {
    const name = row[0];
    if (!name || (sheet.name === "Banana" && name === "Van" && row[1] === "Trunk")) continue;
    if (!vehicleMap.has(name)) {
      vehicleMap.set(name, {
        type: vanNames.has(name) ? "van" : "car",
        tests: new Set(),
      });
    }
    vehicleMap.get(name)!.tests.add(testSlug);
  }
}

const vehiclesJson = Array.from(vehicleMap.entries())
  .map(([name, info]) => ({
    name,
    slug: vehicleSlug(name),
    type: info.type,
    tests: Array.from(info.tests),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

writeFileSync(join(__dirname, "../src/data/vehicles.json"), JSON.stringify(vehiclesJson, null, 2));

console.log(`Converted ${sheets.length} test sheets and ${vehiclesJson.length} vehicles to JSON`);
```

- [ ] **Step 2: Install tsx and run conversion**

Run: `cd /Users/tordartommervik/Documents/code/tb-data && npm install -D tsx && npx tsx scripts/convert-data.ts`
Expected: "Converted 15 test sheets and ~200+ vehicles to JSON"

- [ ] **Step 3: Verify JSON files exist**

Run: `ls src/data/tests/ && head -20 src/data/vehicles.json`
Expected: 15 JSON files + meta.json, vehicles.json with slug/type/tests fields.

- [ ] **Step 4: Write tests for data access layer**

Create `src/lib/data/tests.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { getTests, getTestBySlug, getTestMeta } from "./tests";

describe("getTests", () => {
  it("returns all test metadata entries", () => {
    const tests = getTests();
    expect(tests.length).toBeGreaterThan(0);
    expect(tests[0]).toHaveProperty("name");
    expect(tests[0]).toHaveProperty("slug");
    expect(tests[0]).toHaveProperty("icon");
  });
});

describe("getTestBySlug", () => {
  it("returns test sheet data for a valid slug", () => {
    const test = getTestBySlug("range");
    expect(test).not.toBeNull();
    expect(test!.name).toBe("Range");
    expect(test!.headers.length).toBeGreaterThan(0);
    expect(test!.rows.length).toBeGreaterThan(0);
  });

  it("returns null for an invalid slug", () => {
    const test = getTestBySlug("nonexistent-test");
    expect(test).toBeNull();
  });
});

describe("getTestMeta", () => {
  it("returns metadata for a valid slug", () => {
    const meta = getTestMeta("acceleration");
    expect(meta).not.toBeNull();
    expect(meta!.unit).toBe("s");
    expect(meta!.lowerIsBetter).toBe(true);
  });
});
```

- [ ] **Step 5: Run tests to verify they fail**

Run: `cd /Users/tordartommervik/Documents/code/tb-data && npx vitest run src/lib/data/tests.test.ts`
Expected: FAIL — module `./tests` not found.

- [ ] **Step 6: Implement data access layer for tests**

Create `src/lib/data/tests.ts`:

```ts
import meta from "@/data/tests/meta.json";
import type { TestSheet, TestMeta } from "@/lib/types";

// Dynamic import map for test sheet JSON files
const TEST_IMPORTS: Record<string, () => TestSheet> = {
  banana: () => require("@/data/tests/banana.json"),
  weight: () => require("@/data/tests/weight.json"),
  acceleration: () => require("@/data/tests/acceleration.json"),
  noise: () => require("@/data/tests/noise.json"),
  braking: () => require("@/data/tests/braking.json"),
  range: () => require("@/data/tests/range.json"),
  sunday: () => require("@/data/tests/sunday.json"),
  "1000-km": () => require("@/data/tests/1000-km.json"),
  "500-km": () => require("@/data/tests/500-km.json"),
  "arctic-circle": () => require("@/data/tests/arctic-circle.json"),
  bangkok: () => require("@/data/tests/bangkok.json"),
  degradation: () => require("@/data/tests/degradation.json"),
  geilo: () => require("@/data/tests/geilo.json"),
  "zero-mile": () => require("@/data/tests/zero-mile.json"),
};

export function getTests(): TestMeta[] {
  return meta as TestMeta[];
}

export function getTestMeta(slug: string): TestMeta | null {
  return (meta as TestMeta[]).find((t) => t.slug === slug) ?? null;
}

export function getTestBySlug(slug: string): TestSheet | null {
  const loader = TEST_IMPORTS[slug];
  if (!loader) return null;
  return loader();
}

export function getAllTestSheets(): TestSheet[] {
  return (meta as TestMeta[])
    .map((m) => getTestBySlug(m.slug))
    .filter((s): s is TestSheet => s !== null);
}
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `cd /Users/tordartommervik/Documents/code/tb-data && npx vitest run src/lib/data/tests.test.ts`
Expected: All 4 tests PASS.

- [ ] **Step 8: Write tests for vehicle data access**

Create `src/lib/data/vehicles.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { getVehicles, getVehicleBySlug, getVehiclesByTest } from "./vehicles";

describe("getVehicles", () => {
  it("returns all vehicles", () => {
    const vehicles = getVehicles();
    expect(vehicles.length).toBeGreaterThan(100);
    expect(vehicles[0]).toHaveProperty("slug");
    expect(vehicles[0]).toHaveProperty("type");
    expect(vehicles[0]).toHaveProperty("tests");
  });
});

describe("getVehicleBySlug", () => {
  it("returns a vehicle for a valid slug", () => {
    const vehicles = getVehicles();
    const first = vehicles[0];
    const found = getVehicleBySlug(first.slug);
    expect(found).not.toBeNull();
    expect(found!.name).toBe(first.name);
  });

  it("returns null for an invalid slug", () => {
    expect(getVehicleBySlug("not-a-real-car")).toBeNull();
  });
});

describe("getVehiclesByTest", () => {
  it("returns vehicles that appear in a given test", () => {
    const vehicles = getVehiclesByTest("range");
    expect(vehicles.length).toBeGreaterThan(0);
    expect(vehicles.every((v) => v.tests.includes("range"))).toBe(true);
  });
});
```

- [ ] **Step 9: Run tests to verify they fail**

Run: `cd /Users/tordartommervik/Documents/code/tb-data && npx vitest run src/lib/data/vehicles.test.ts`
Expected: FAIL — module `./vehicles` not found.

- [ ] **Step 10: Implement vehicle data access layer**

Create `src/lib/data/vehicles.ts`:

```ts
import vehiclesData from "@/data/vehicles.json";
import type { Vehicle } from "@/lib/types";

const vehicles = vehiclesData as Vehicle[];

export function getVehicles(): Vehicle[] {
  return vehicles;
}

export function getVehicleBySlug(slug: string): Vehicle | null {
  return vehicles.find((v) => v.slug === slug) ?? null;
}

export function getVehicleByName(name: string): Vehicle | null {
  return vehicles.find((v) => v.name === name) ?? null;
}

export function getVehiclesByTest(testSlug: string): Vehicle[] {
  return vehicles.filter((v) => v.tests.includes(testSlug));
}

export function searchVehicles(query: string, limit = 10): Vehicle[] {
  if (!query || query.length < 2) return [];
  const lower = query.toLowerCase();
  const terms = lower.split(/\s+/).filter(Boolean);
  return vehicles
    .filter((v) => terms.every((t) => v.name.toLowerCase().includes(t)))
    .slice(0, limit);
}
```

- [ ] **Step 11: Run tests to verify they pass**

Run: `cd /Users/tordartommervik/Documents/code/tb-data && npx vitest run src/lib/data/vehicles.test.ts`
Expected: All 4 tests PASS.

- [ ] **Step 12: Commit**

```bash
cd /Users/tordartommervik/Documents/code/tb-data
git add scripts/convert-data.ts src/data/tests/ src/data/vehicles.json src/lib/data/
git commit -m "feat: convert data to JSON, add typed data access layer with tests"
```

---

### Task 3: Extract and test parsing, scoring, and formatting utilities

**Files:**
- Create: `src/lib/utils/parsing.ts`
- Create: `src/lib/utils/scoring.ts`
- Create: `src/lib/utils/formatting.ts`
- Create: `src/lib/utils/parsing.test.ts`
- Create: `src/lib/utils/scoring.test.ts`

- [ ] **Step 1: Write parsing utility tests**

Create `src/lib/utils/parsing.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { parseNum } from "./parsing";

describe("parseNum", () => {
  it("parses plain numbers", () => {
    expect(parseNum("42")).toBe(42);
    expect(parseNum("3.5")).toBe(3.5);
  });

  it("handles plus notation (e.g. trunk: '10+1')", () => {
    expect(parseNum("10+1")).toBe(11);
    expect(parseNum("2+15")).toBe(17);
  });

  it("handles time notation (e.g. '12:30')", () => {
    expect(parseNum("12:30")).toBe(750);
  });

  it("handles comma decimals", () => {
    expect(parseNum("3,5")).toBe(3.5);
  });

  it("returns null for empty or non-numeric strings", () => {
    expect(parseNum("")).toBeNull();
    expect(parseNum("N/A")).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/tordartommervik/Documents/code/tb-data && npx vitest run src/lib/utils/parsing.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement parsing utilities**

Create `src/lib/utils/parsing.ts`:

```ts
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

export function isNumericCol(rows: string[][], colIdx: number): boolean {
  if (colIdx === 0) return false;
  const vals = rows.slice(0, 20).map((r) => r[colIdx] ?? "");
  const nonEmpty = vals.filter((v) => v !== "");
  if (nonEmpty.length === 0) return false;
  return nonEmpty.filter((v) => parseNum(v) !== null).length / nonEmpty.length > 0.7;
}

export function colMax(rows: string[][], colIdx: number): number {
  let max = 0;
  for (const row of rows) {
    const n = parseNum(row[colIdx] ?? "");
    if (n !== null && n > max) max = n;
  }
  return max;
}
```

- [ ] **Step 4: Run parsing tests**

Run: `cd /Users/tordartommervik/Documents/code/tb-data && npx vitest run src/lib/utils/parsing.test.ts`
Expected: All 5 tests PASS.

- [ ] **Step 5: Write scoring utility tests**

Create `src/lib/utils/scoring.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { normalizeScore, computeWeightedRank } from "./scoring";

describe("normalizeScore", () => {
  it("normalizes higher-is-better", () => {
    expect(normalizeScore(500, 100, 600, false)).toBe(80);
  });

  it("normalizes lower-is-better", () => {
    expect(normalizeScore(200, 100, 600, true)).toBe(80);
  });

  it("returns 50 when min equals max", () => {
    expect(normalizeScore(100, 100, 100, false)).toBe(50);
  });
});

describe("computeWeightedRank", () => {
  it("ranks vehicles by weighted scores", () => {
    const vehicles = [
      { name: "A", slug: "a", scores: { range: 90, noise: 50 } },
      { name: "B", slug: "b", scores: { range: 60, noise: 90 } },
    ];
    const weights = { range: 80, noise: 20 };

    const ranked = computeWeightedRank(vehicles, weights);
    expect(ranked[0].name).toBe("A"); // A: 90*80 + 50*20 = 8200, B: 60*80 + 90*20 = 6600
    expect(ranked[0].weightedScore).toBeGreaterThan(ranked[1].weightedScore);
  });

  it("handles zero-weight metrics", () => {
    const vehicles = [
      { name: "A", slug: "a", scores: { range: 10, noise: 90 } },
      { name: "B", slug: "b", scores: { range: 90, noise: 10 } },
    ];
    const weights = { range: 0, noise: 100 };

    const ranked = computeWeightedRank(vehicles, weights);
    expect(ranked[0].name).toBe("A");
  });
});
```

- [ ] **Step 6: Run scoring tests to verify they fail**

Run: `cd /Users/tordartommervik/Documents/code/tb-data && npx vitest run src/lib/utils/scoring.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 7: Implement scoring utilities**

Create `src/lib/utils/scoring.ts`:

```ts
import type { Stats, ChartEntry, TestSheet, TestMeta } from "@/lib/types";
import { parseNum } from "./parsing";

export function normalizeScore(
  val: number,
  min: number,
  max: number,
  lowerIsBetter: boolean
): number {
  if (max === min) return 50;
  const pct = ((val - min) / (max - min)) * 100;
  return Math.round(lowerIsBetter ? 100 - pct : pct);
}

export function colMinMax(
  rows: string[][],
  colIdx: number,
  filterFn?: (r: string[]) => boolean
): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;
  for (const row of rows) {
    if (filterFn && !filterFn(row)) continue;
    const n = parseNum(row[colIdx] ?? "");
    if (n !== null) {
      if (n < min) min = n;
      if (n > max) max = n;
    }
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

  const sorted = [...pairs].sort((a, b) =>
    meta.lowerIsBetter ? a.val - b.val : b.val - a.val
  );

  const avg = Math.round((pairs.reduce((s, p) => s + p.val, 0) / pairs.length) * 10) / 10;

  const top10 = sorted.slice(0, 10).map((p) => ({
    name: p.name.length > 32 ? p.name.slice(0, 30) + "…" : p.name,
    val: p.val,
  }));

  return {
    count: pairs.length,
    best: sorted[0],
    avg,
    unit: meta.unit,
    lowerIsBetter: meta.lowerIsBetter,
    top10,
  };
}

export interface RankedVehicle {
  name: string;
  slug: string;
  scores: Record<string, number>;
  weightedScore: number;
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
        if (v.scores[key] !== undefined) {
          weightedSum += v.scores[key] * weight;
        }
      }
      return { ...v, weightedScore: Math.round(weightedSum / totalWeight) };
    })
    .sort((a, b) => b.weightedScore - a.weightedScore);
}
```

- [ ] **Step 8: Implement formatting utilities**

Create `src/lib/utils/formatting.ts`:

```ts
export function fmt(n: number, unit: string): string {
  if (unit === "banana") return `${n} 🍌`;
  if (n % 1 === 0) return `${n} ${unit}`;
  return `${n.toFixed(1)} ${unit}`;
}

export function vehicleSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}
```

- [ ] **Step 9: Run all tests**

Run: `cd /Users/tordartommervik/Documents/code/tb-data && npx vitest run`
Expected: All tests PASS (parsing: 5, scoring: 4, data/tests: 4, data/vehicles: 4 = 17 total).

- [ ] **Step 10: Commit**

```bash
cd /Users/tordartommervik/Documents/code/tb-data
git add src/lib/utils/ src/lib/data/
git commit -m "feat: extract parsing, scoring, formatting utilities with tests"
```

---

### Task 4: Build comparison data access and vehicle profile logic

**Files:**
- Create: `src/lib/data/comparison.ts`
- Create: `src/lib/data/comparison.test.ts`

- [ ] **Step 1: Write comparison data access tests**

Create `src/lib/data/comparison.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { getVehicleProfile, getVehiclesForComparison, getMetricScores, RANKING_METRICS } from "./comparison";

describe("getVehicleProfile", () => {
  it("returns test results for a known vehicle", () => {
    const profile = getVehicleProfile("Tesla Model Y");
    expect(profile).not.toBeNull();
    expect(profile!.name).toBe("Tesla Model Y");
    expect(profile!.results.length).toBeGreaterThan(0);
    expect(profile!.results[0]).toHaveProperty("rank");
    expect(profile!.results[0]).toHaveProperty("totalTested");
  });

  it("returns null for unknown vehicle", () => {
    expect(getVehicleProfile("Not A Car")).toBeNull();
  });
});

describe("getVehiclesForComparison", () => {
  it("returns shared metrics between two vehicles", () => {
    const result = getVehiclesForComparison("Tesla Model Y", "Hyundai Ioniq 5");
    expect(result).not.toBeNull();
    expect(result!.metrics.length).toBeGreaterThan(0);
    expect(result!.metrics[0]).toHaveProperty("valueA");
    expect(result!.metrics[0]).toHaveProperty("valueB");
    expect(result!.metrics[0]).toHaveProperty("winner");
  });
});

describe("getMetricScores", () => {
  it("returns normalized scores for ranking metrics", () => {
    const scores = getMetricScores("Tesla Model Y");
    expect(scores).not.toBeNull();
    if (scores) {
      const keys = Object.keys(scores);
      expect(keys.length).toBeGreaterThan(0);
      for (const val of Object.values(scores)) {
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThanOrEqual(100);
      }
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/tordartommervik/Documents/code/tb-data && npx vitest run src/lib/data/comparison.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement comparison data access**

Create `src/lib/data/comparison.ts`:

```ts
import type { VehicleProfile, VehicleTestResult, ComparisonMetric, MetricConfig } from "@/lib/types";
import { getTests, getTestBySlug, getTestMeta } from "./tests";
import { getVehicleByName } from "./vehicles";
import { parseNum } from "@/lib/utils/parsing";
import { normalizeScore, colMinMax } from "@/lib/utils/scoring";

export const RANKING_METRICS: MetricConfig[] = [
  { key: "range", label: "Range (90 km/h)", testSlug: "range", colName: "km", lowerIsBetter: false, unit: "km", filterFn: (row, headers) => row[headers.indexOf("km/h")] === "90" },
  { key: "cargo", label: "Cargo", testSlug: "banana", colName: "Seats folded", lowerIsBetter: false, unit: "boxes" },
  { key: "acceleration", label: "Acceleration", testSlug: "acceleration", colName: "0-100", lowerIsBetter: true, unit: "s" },
  { key: "noise", label: "Noise", testSlug: "noise", colName: "Average", lowerIsBetter: true, unit: "dB" },
  { key: "braking", label: "Braking", testSlug: "braking", colName: "Distance", lowerIsBetter: true, unit: "m" },
  { key: "weight", label: "Weight", testSlug: "weight", colName: "Total", lowerIsBetter: true, unit: "kg" },
];

function findVehicleValue(
  testSlug: string,
  vehicleName: string,
  colName: string,
  filterFn?: MetricConfig["filterFn"]
): number | null {
  const sheet = getTestBySlug(testSlug);
  if (!sheet) return null;

  const colIdx = sheet.headers.indexOf(colName);
  if (colIdx < 0) return null;

  const matchingRows = sheet.rows.filter((r) => r[0] === vehicleName);
  if (matchingRows.length === 0) return null;

  const filtered = filterFn
    ? matchingRows.filter((r) => filterFn(r, sheet.headers))
    : matchingRows;
  const rows = filtered.length > 0 ? filtered : matchingRows;

  let best: number | null = null;
  for (const row of rows) {
    const n = parseNum(row[colIdx] ?? "");
    if (n === null) continue;
    if (best === null) { best = n; continue; }
    // For each metric, the caller specifies lowerIsBetter but we just return the value here
    best = n; // take last match (or could take best — matches original behavior)
  }
  return best;
}

function getRankForValue(
  testSlug: string,
  colName: string,
  value: number,
  lowerIsBetter: boolean,
  filterFn?: MetricConfig["filterFn"]
): { rank: number; total: number } {
  const sheet = getTestBySlug(testSlug);
  if (!sheet) return { rank: 0, total: 0 };

  const colIdx = sheet.headers.indexOf(colName);
  if (colIdx < 0) return { rank: 0, total: 0 };

  const allValues: number[] = [];
  for (const row of sheet.rows) {
    if (filterFn && !filterFn(row, sheet.headers)) continue;
    const n = parseNum(row[colIdx] ?? "");
    if (n !== null) allValues.push(n);
  }

  const sorted = lowerIsBetter
    ? [...allValues].sort((a, b) => a - b)
    : [...allValues].sort((a, b) => b - a);

  const rank = sorted.indexOf(value) + 1;
  return { rank: rank > 0 ? rank : allValues.length, total: allValues.length };
}

export function getVehicleProfile(vehicleName: string): VehicleProfile | null {
  const vehicle = getVehicleByName(vehicleName);
  if (!vehicle) return null;

  const results: VehicleTestResult[] = [];
  const allMeta = getTests();

  for (const meta of allMeta) {
    if (!meta.colName) continue;

    const sheet = getTestBySlug(meta.slug);
    if (!sheet) continue;

    const colIdx = sheet.headers.indexOf(meta.colName);
    if (colIdx < 0) continue;

    const matchingRows = sheet.rows.filter((r) => r[0] === vehicleName);
    if (matchingRows.length === 0) continue;

    const val = parseNum(matchingRows[0][colIdx] ?? "");
    if (val === null) continue;

    const { rank, total } = getRankForValue(meta.slug, meta.colName, val, meta.lowerIsBetter);

    results.push({
      testName: meta.name,
      testSlug: meta.slug,
      value: val,
      rank,
      totalTested: total,
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
  const vA = getVehicleByName(nameA);
  const vB = getVehicleByName(nameB);
  if (!vA || !vB) return null;

  const metrics: ComparisonMetric[] = [];
  const allMeta = getTests();

  for (const meta of allMeta) {
    if (!meta.colName) continue;

    const valA = findVehicleValue(meta.slug, nameA, meta.colName);
    const valB = findVehicleValue(meta.slug, nameB, meta.colName);

    if (valA === null && valB === null) continue;

    let winner: ComparisonMetric["winner"] = null;
    if (valA !== null && valB !== null) {
      if (valA === valB) winner = "tie";
      else if (meta.lowerIsBetter) winner = valA < valB ? "a" : "b";
      else winner = valA > valB ? "a" : "b";
    }

    metrics.push({
      testName: meta.name,
      testSlug: meta.slug,
      unit: meta.unit,
      lowerIsBetter: meta.lowerIsBetter,
      valueA: valA,
      valueB: valB,
      winner,
    });
  }

  return { vehicleA: nameA, vehicleB: nameB, metrics };
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

    const value = findVehicleValue(metric.testSlug, vehicleName, metric.colName, metric.filterFn);
    if (value === null) continue;

    const filterFn = metric.filterFn
      ? (r: string[]) => metric.filterFn!(r, sheet.headers)
      : undefined;
    const { min, max } = colMinMax(sheet.rows, colIdx, filterFn);
    scores[metric.key] = normalizeScore(value, min, max, metric.lowerIsBetter);
  }

  return Object.keys(scores).length > 0 ? scores : null;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/tordartommervik/Documents/code/tb-data && npx vitest run src/lib/data/comparison.test.ts`
Expected: All 4 tests PASS.

- [ ] **Step 5: Run full test suite**

Run: `cd /Users/tordartommervik/Documents/code/tb-data && npx vitest run`
Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
cd /Users/tordartommervik/Documents/code/tb-data
git add src/lib/data/comparison.ts src/lib/data/comparison.test.ts
git commit -m "feat: add comparison data access layer with vehicle profiles and head-to-head"
```

---

### Task 5: Refactor app shell — layout, sidebar, and header with routing

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/components/Sidebar.tsx`
- Modify: `src/components/AppHeader.tsx`
- Create: `src/components/AppShell.tsx`

This is the pivotal task — converting from state-based view switching to route-based navigation.

- [ ] **Step 1: Update globals.css with branding color**

In `src/app/globals.css`, update the branding. Change the comment and keep the same CSS variable structure. The current indigo primary (`#3525cd`) works fine with the "TB Test Results" identity — no color change needed. Just update the `.editorial-shadow` to keep it.

No changes needed to globals.css — the existing palette matches the editorial tone.

- [ ] **Step 2: Create AppShell client component**

Create `src/components/AppShell.tsx` — wraps the sidebar + header + main layout as a client component that can be used in the server-rendered layout:

```tsx
"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Sidebar } from "@/components/Sidebar";
import { AppHeader } from "@/components/AppHeader";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ backgroundColor: "rgba(0,0,0,0.15)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        pathname={pathname}
        sidebarOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen min-w-0 overflow-hidden">
        <AppHeader
          resolvedTheme={resolvedTheme}
          onThemeToggle={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          onMenuOpen={() => setSidebarOpen(true)}
        />

        <div className="mt-16 flex-1 p-6 lg:p-10 space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Rewrite Sidebar for route-based navigation**

Rewrite `src/components/Sidebar.tsx` to use Next.js `Link` components instead of onClick handlers with index-based navigation:

```tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { getTests, getAllTestSheets } from "@/lib/data/tests";

interface SidebarProps {
  pathname: string;
  sidebarOpen: boolean;
  onClose: () => void;
}

async function handleExport(format: "csv" | "pdf") {
  const sheets = getAllTestSheets();
  if (format === "csv") {
    const allRows = sheets.flatMap((s) => [
      [`=== ${s.name} ===`], s.headers, ...s.rows, [],
    ]);
    const csv = allRows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "TB-Test-Results.csv"; a.click();
    URL.revokeObjectURL(url);
    return;
  }
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF({ orientation: "landscape" });
  let y = 14;
  doc.setFontSize(16);
  doc.text("TB Test Results — Full Dataset", 14, y); y += 8;
  for (const s of sheets) {
    doc.setFontSize(11); doc.text(s.name, 14, y); y += 2;
    autoTable(doc, { head: [s.headers], body: s.rows, startY: y, styles: { fontSize: 7, cellPadding: 1.5 }, headStyles: { fillColor: [53, 37, 205] }, margin: { left: 14, right: 14 } });
    y = (doc as any).lastAutoTable.finalY + 10;
    if (y > 185) { doc.addPage(); y = 14; }
  }
  doc.save("TB-Test-Results.pdf");
}

const testMeta = getTests();

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  ...testMeta.map((t) => ({ href: `/tests/${t.slug}`, label: t.name, icon: t.icon })),
];

const COMPARE_ITEMS = [
  { href: "/compare", label: "Find Your EV", icon: "tune" },
];

export function Sidebar({ pathname, sidebarOpen, onClose }: SidebarProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!exportOpen) return;
    function handleClick(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [exportOpen]);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <aside
      className={`fixed left-0 top-0 h-screen w-64 flex flex-col py-8 px-4 z-50 transition-transform duration-200 lg:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}
      style={{ backgroundColor: "var(--surface-container-low)" }}
    >
      {/* Brand */}
      <div className="mb-8 px-2">
        <h1 className="font-bold text-xl tracking-tight" style={{ color: "var(--primary)" }}>
          TB Test Results
        </h1>
        <p
          className="text-xs mt-0.5 uppercase tracking-[0.18em]"
          style={{
            color: "var(--on-surface-variant)",
            opacity: 0.6,
            fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
            fontSize: "0.625rem",
          }}
        >
          Explorer
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors rounded-lg text-left"
              style={
                active
                  ? { color: "var(--primary)", backgroundColor: "var(--nav-active-bg)", fontWeight: 600, borderRight: "3px solid var(--primary)", borderRadius: "0.375rem 0 0 0.375rem" }
                  : { color: "var(--on-surface-variant)" }
              }
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div className="pt-4 pb-2">
          <span
            className="text-xs font-bold uppercase tracking-[0.18em] px-3"
            style={{ color: "var(--on-surface-variant-muted)", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif", fontSize: "0.5625rem" }}
          >
            Compare
          </span>
        </div>
        {COMPARE_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors rounded-lg text-left"
              style={
                active
                  ? { color: "var(--primary)", backgroundColor: "var(--nav-active-bg)", fontWeight: 600, borderRight: "3px solid var(--primary)", borderRadius: "0.375rem 0 0 0.375rem" }
                  : { color: "var(--on-surface-variant)" }
              }
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Export — preserved from original app */}
      <div className="pt-6 border-t relative" style={{ borderColor: "var(--border-subtle)" }} ref={exportRef}>
        {exportOpen && (
          <div className="absolute bottom-full mb-2 left-0 right-0 rounded-lg overflow-hidden shadow-lg" style={{ backgroundColor: "var(--surface-container)", border: "1px solid var(--border-subtle)" }}>
            <button onClick={() => { handleExport("csv"); setExportOpen(false); }} className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-left" style={{ color: "var(--on-surface-variant)", borderBottom: "1px solid var(--border-subtle)" }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--surface-container-high)"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}>
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>table</span> Export as CSV
            </button>
            <button onClick={() => { handleExport("pdf"); setExportOpen(false); }} className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-left" style={{ color: "var(--on-surface-variant)" }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--surface-container-high)"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}>
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>picture_as_pdf</span> Export as PDF
            </button>
          </div>
        )}
        <button onClick={() => setExportOpen((o) => !o)} className="w-full py-2.5 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-opacity hover:opacity-90" style={{ background: "linear-gradient(135deg, #3525cd, #4f46e5)" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>file_download</span> Export Dataset
        </button>
      </div>

      {/* Attribution */}
      <div className="pt-4 pb-1">
        <p className="text-xs" style={{ color: "var(--on-surface-variant)", opacity: 0.5 }}>
          Data by{" "}
          <a
            href="https://docs.google.com/spreadsheets/d/1V6ucyFGKWuSQzvI8lMzvvWJHrBS82echMVJH37kwgjE/edit?gid=244400016#gid=244400016"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
            style={{ color: "var(--on-surface-variant)" }}
          >
            Bjørn Nyland
          </a>
        </p>
      </div>
    </aside>
  );
}
```

- [ ] **Step 4: Simplify AppHeader**

Rewrite `src/components/AppHeader.tsx` to be simpler — no longer needs sheet-specific props:

```tsx
"use client";

interface AppHeaderProps {
  resolvedTheme: string | undefined;
  onThemeToggle: () => void;
  onMenuOpen: () => void;
}

export function AppHeader({ resolvedTheme, onThemeToggle, onMenuOpen }: AppHeaderProps) {
  return (
    <header
      className="fixed top-0 right-0 left-0 lg:left-64 z-40 flex items-center justify-between px-6 lg:px-10 h-16"
      style={{
        backgroundColor: "var(--header-bg)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(199,196,216,0.18)",
        boxShadow: "0 8px 32px 0 rgba(27,28,28,0.04)",
      }}
    >
      <div className="flex items-center gap-4">
        <button
          className="lg:hidden p-1.5 rounded-lg"
          style={{ color: "var(--on-surface-variant)" }}
          onClick={onMenuOpen}
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onThemeToggle}
          className="p-2 rounded-lg transition-colors"
          style={{ color: "var(--on-surface-variant)", backgroundColor: "var(--surface-container-low)" }}
          aria-label="Toggle dark mode"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }} suppressHydrationWarning>
            {resolvedTheme === "dark" ? "light_mode" : "dark_mode"}
          </span>
        </button>
      </div>
    </header>
  );
}
```

- [ ] **Step 5: Update root layout to use AppShell**

Rewrite `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { AppShell } from "@/components/AppShell";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "TB Test Results Explorer",
  description: "Interactive explorer for Bjørn Nyland's EV test data",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} h-full`} suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Verify the app builds**

Run: `cd /Users/tordartommervik/Documents/code/tb-data && npm run build`
Expected: Build succeeds (there may be warnings about unused imports in old page.tsx — that's fine, we'll replace it next).

- [ ] **Step 7: Commit**

```bash
cd /Users/tordartommervik/Documents/code/tb-data
git add src/app/layout.tsx src/components/AppShell.tsx src/components/Sidebar.tsx src/components/AppHeader.tsx
git commit -m "refactor: convert app shell to route-based navigation with Link components"
```

---

### Task 6: Create dashboard page and move dashboard components

**Files:**
- Rewrite: `src/app/page.tsx`
- Create: `src/components/dashboard/DashboardStats.tsx`
- Create: `src/components/dashboard/DashboardRadar.tsx`

- [ ] **Step 1: Create DashboardStats component**

Move the stats grid from `DashboardView.tsx` into `src/components/dashboard/DashboardStats.tsx`. This is mostly a copy of the existing `DashboardView` but using the new data access layer:

```tsx
"use client";

import { useMemo } from "react";
import { getAllTestSheets, getTestMeta } from "@/lib/data/tests";
import { parseNum } from "@/lib/utils/parsing";

export function DashboardStats() {
  const sheets = useMemo(() => getAllTestSheets(), []);
  const totalRows = sheets.reduce((sum, s) => sum + s.rows.length, 0);

  const uniqueCars = useMemo(
    () => new Set(sheets.flatMap((s) => s.rows.map((r) => r[0]).filter(Boolean))).size,
    [sheets]
  );

  const bestRange = useMemo(() => {
    const rangeSheet = sheets.find((s) => s.name === "Range");
    if (!rangeSheet) return null;
    const kmIdx = rangeSheet.headers.indexOf("km");
    const speedIdx = rangeSheet.headers.indexOf("km/h");
    let best: { name: string; val: number } | null = null;
    for (const row of rangeSheet.rows) {
      if (speedIdx >= 0 && row[speedIdx] !== "90") continue;
      const n = parseNum(row[kmIdx] ?? "");
      if (n !== null && (best === null || n > best.val)) best = { name: row[0], val: n };
    }
    return best;
  }, [sheets]);

  const fastestAccel = useMemo(() => {
    const accelSheet = sheets.find((s) => s.name === "Acceleration");
    if (!accelSheet) return null;
    const colIdx = accelSheet.headers.indexOf("0-100");
    let best: { name: string; val: number } | null = null;
    for (const row of accelSheet.rows) {
      const n = parseNum(row[colIdx] ?? "");
      if (n !== null && n > 0 && (best === null || n < best.val)) best = { name: row[0], val: n };
    }
    return best;
  }, [sheets]);

  const quietest = useMemo(() => {
    const noiseSheet = sheets.find((s) => s.name === "Noise");
    if (!noiseSheet) return null;
    const colIdx = noiseSheet.headers.indexOf("Average");
    let best: { name: string; val: number } | null = null;
    for (const row of noiseSheet.rows) {
      const n = parseNum(row[colIdx] ?? "");
      if (n !== null && (best === null || n < best.val)) best = { name: row[0], val: n };
    }
    return best;
  }, [sheets]);

  const bestBraking = useMemo(() => {
    const brakingSheet = sheets.find((s) => s.name === "Braking");
    if (!brakingSheet) return null;
    const colIdx = brakingSheet.headers.indexOf("Distance");
    let best: { name: string; val: number } | null = null;
    for (const row of brakingSheet.rows) {
      const n = parseNum(row[colIdx] ?? "");
      if (n !== null && n > 0 && (best === null || n < best.val)) best = { name: row[0], val: n };
    }
    return best;
  }, [sheets]);

  return (
    <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <div className="p-6 rounded-xl editorial-shadow" style={{ backgroundColor: "var(--surface-container-lowest)", border: "1px solid var(--border-subtle)" }}>
        <span className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: "var(--primary)", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}>Test Entries</span>
        <div className="mt-3">
          <span className="text-4xl font-extrabold" style={{ fontFamily: "var(--font-inter), Inter, sans-serif", color: "var(--foreground)" }}>{totalRows.toLocaleString()}</span>
        </div>
        <p className="mt-1 text-xs" style={{ color: "var(--on-surface-variant-muted)" }}>across {sheets.length} test categories</p>
      </div>

      <div className="p-6 rounded-xl editorial-shadow" style={{ backgroundColor: "var(--surface-container-lowest)", border: "1px solid var(--border-subtle)" }}>
        <span className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: "var(--primary)", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}>Unique EVs</span>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-4xl font-extrabold" style={{ fontFamily: "var(--font-inter), Inter, sans-serif", color: "var(--foreground)" }}>{uniqueCars}</span>
          <span className="text-sm" style={{ color: "var(--on-surface-variant-muted)" }}>models</span>
        </div>
        <p className="mt-1 text-xs" style={{ color: "var(--on-surface-variant-muted)" }}>distinct vehicles in the dataset</p>
      </div>

      {bestRange && (
        <div className="p-6 rounded-xl editorial-shadow" style={{ backgroundColor: "#3525cd" }}>
          <span className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.65)", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}>Best Range · 90 km/h</span>
          <div className="mt-3">
            <span className="text-3xl font-extrabold" style={{ color: "var(--primary-accent)" }}>{bestRange.val} km</span>
            <p className="text-sm font-semibold text-white mt-1">{bestRange.name}</p>
          </div>
          <p className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>summer, 90 km/h highway</p>
        </div>
      )}

      {fastestAccel && (
        <div className="p-6 rounded-xl editorial-shadow" style={{ backgroundColor: "var(--surface-container-lowest)", border: "1px solid var(--border-subtle)" }}>
          <span className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: "var(--on-surface-variant-muted)", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}>Fastest 0–100</span>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold" style={{ fontFamily: "var(--font-inter), Inter, sans-serif", color: "var(--foreground)" }}>{fastestAccel.val}</span>
            <span className="text-sm" style={{ color: "var(--on-surface-variant-muted)" }}>s</span>
          </div>
          <p className="mt-1 text-xs truncate" style={{ color: "var(--on-surface-variant-muted)" }}>{fastestAccel.name}</p>
        </div>
      )}

      {quietest && (
        <div className="p-6 rounded-xl editorial-shadow" style={{ backgroundColor: "var(--surface-container-lowest)", border: "1px solid var(--border-subtle)" }}>
          <span className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: "var(--on-surface-variant-muted)", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}>Quietest Cabin</span>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold" style={{ fontFamily: "var(--font-inter), Inter, sans-serif", color: "var(--foreground)" }}>{Math.round(quietest.val * 10) / 10}</span>
            <span className="text-sm" style={{ color: "var(--on-surface-variant-muted)" }}>dB</span>
          </div>
          <p className="mt-1 text-xs truncate" style={{ color: "var(--on-surface-variant-muted)" }}>{quietest.name}</p>
        </div>
      )}

      {bestBraking && (
        <div className="p-6 rounded-xl editorial-shadow" style={{ backgroundColor: "var(--surface-container-lowest)", border: "1px solid var(--border-subtle)" }}>
          <span className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: "var(--on-surface-variant-muted)", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}>Best Braking</span>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold" style={{ fontFamily: "var(--font-inter), Inter, sans-serif", color: "var(--foreground)" }}>{bestBraking.val}</span>
            <span className="text-sm" style={{ color: "var(--on-surface-variant-muted)" }}>m</span>
          </div>
          <p className="mt-1 text-xs truncate" style={{ color: "var(--on-surface-variant-muted)" }}>{bestBraking.name}</p>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Create DashboardRadar component**

Move `RadarSection.tsx` to `src/components/dashboard/DashboardRadar.tsx`, updating imports to use the new data layer. Copy the existing `RadarSection.tsx` content but change:
- Import `getVehicles` from `@/lib/data/vehicles` instead of `ALL_RADAR_CARS` from chart-utils
- Import scoring functions from `@/lib/utils/scoring` and `@/lib/data/comparison`
- Keep all the Recharts rendering code exactly as-is

The key changes are the imports and car list generation. The radar chart rendering stays identical.

```tsx
"use client";

import { useState, useMemo } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Legend, Tooltip, ResponsiveContainer,
} from "recharts";
import { getVehicles } from "@/lib/data/vehicles";
import { RANKING_METRICS, getMetricScores } from "@/lib/data/comparison";

const RADAR_COLORS = ["#3525cd", "#34d399", "#fb923c", "#f472b6", "#60a5fa"];

const allCarNames = getVehicles().map((v) => v.name).sort();

export function DashboardRadar() {
  const [selected, setSelected] = useState<string[]>(["Tesla Model Y", "BMW iX", "Hyundai Ioniq 5"]);
  const [query, setQuery] = useState("");

  const suggestions = useMemo(() => {
    if (!query || query.length < 2) return [];
    const lower = query.toLowerCase();
    const terms = lower.split(/\s+/).filter(Boolean);
    return allCarNames
      .filter((c) => terms.every((t) => c.toLowerCase().includes(t)))
      .filter((c) => !selected.includes(c))
      .slice(0, 8);
  }, [query, selected]);

  function addCar(car: string) {
    if (!selected.includes(car) && selected.length < 5) setSelected([...selected, car]);
    setQuery("");
  }

  const radarData = useMemo(() =>
    RANKING_METRICS.map((m) => {
      const point: Record<string, string | number> = { subject: m.label };
      for (const car of selected) {
        const scores = getMetricScores(car);
        point[car] = scores?.[m.key] ?? 0;
      }
      return point;
    }),
    [selected]
  );

  return (
    <div className="p-6 lg:p-8 rounded-xl editorial-shadow" style={{ backgroundColor: "var(--surface-container-lowest)", border: "1px solid var(--border-subtle)" }}>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h3 className="font-bold text-base tracking-tight" style={{ color: "var(--foreground)" }}>Car Comparison</h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--on-surface-variant-muted)", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}>
            Up to 5 cars across 6 metrics — normalized 0–100, higher always better
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {selected.map((car, i) => (
            <span key={car} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: RADAR_COLORS[i] + "18", color: RADAR_COLORS[i], border: `1px solid ${RADAR_COLORS[i]}44` }}>
              {car}
              <button onClick={() => setSelected(selected.filter((c) => c !== car))} className="opacity-50 hover:opacity-100">×</button>
            </span>
          ))}
          {selected.length < 5 && (
            <div className="relative">
              <input type="text" placeholder="Add car…" value={query} onChange={(e) => setQuery(e.target.value)} className="rounded-full py-1.5 px-4 text-sm outline-none" style={{ backgroundColor: "var(--surface-container-low)", color: "var(--foreground)", border: "1px solid var(--outline-variant)", width: "160px" }} />
              {suggestions.length > 0 && (
                <div className="absolute top-full mt-1 left-0 w-72 rounded-xl shadow-xl z-50 overflow-hidden" style={{ backgroundColor: "var(--surface-container-lowest)", border: "1px solid var(--outline-variant)" }}>
                  {suggestions.map((s) => (
                    <button key={s} onClick={() => addCar(s)} className="w-full text-left px-4 py-2 text-sm truncate" style={{ color: "var(--foreground)" }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--surface-container)"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}>
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
            <PolarGrid stroke="var(--border-strong)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--on-surface-variant)", fontSize: 12 }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
            {selected.map((car, i) => (
              <Radar key={car} name={car} dataKey={car} stroke={RADAR_COLORS[i]} fill={RADAR_COLORS[i]} fillOpacity={0.1} strokeWidth={2} />
            ))}
            <Legend formatter={(v) => <span style={{ color: "var(--on-surface-variant)", fontSize: 11 }}>{v}</span>} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--outline-variant)", backgroundColor: "var(--surface-container-lowest)", boxShadow: "0 8px 32px rgba(27,28,28,0.08)" }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Rewrite dashboard page.tsx**

Replace `src/app/page.tsx` with a clean dashboard-only page:

```tsx
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardRadar } from "@/components/dashboard/DashboardRadar";

export default function DashboardPage() {
  return (
    <>
      <section>
        <h2 className="text-3xl font-extrabold tracking-tight" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>Dashboard</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--on-surface-variant-muted)" }}>Overview of Bjørn Nyland&apos;s EV test results</p>
      </section>
      <DashboardStats />
      <DashboardRadar />
    </>
  );
}
```

- [ ] **Step 4: Verify dashboard renders**

Run: `cd /Users/tordartommervik/Documents/code/tb-data && npm run dev`
Open `http://localhost:3001` — verify dashboard displays stats and radar chart.

- [ ] **Step 5: Commit**

```bash
cd /Users/tordartommervik/Documents/code/tb-data
git add src/app/page.tsx src/components/dashboard/ src/components/AppShell.tsx
git commit -m "refactor: extract dashboard into dedicated components with new data layer"
```

---

### Task 7: Create test sheet pages with existing visualizations

**Files:**
- Create: `src/app/tests/[slug]/page.tsx`
- Create: `src/components/tests/TestSheetView.tsx`
- Move: existing chart components to `src/components/tests/charts/`
- Move: `StatsBento.tsx`, `TopChart.tsx`, `DataTable.tsx` to `src/components/tests/`

- [ ] **Step 1: Create test sheet route page**

Create `src/app/tests/[slug]/page.tsx`:

```tsx
import { getTestBySlug, getTestMeta, getTests } from "@/lib/data/tests";
import { TestSheetView } from "@/components/tests/TestSheetView";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  return getTests().map((t) => ({ slug: t.slug }));
}

export default async function TestSheetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sheet = getTestBySlug(slug);
  const meta = getTestMeta(slug);

  if (!sheet || !meta) notFound();

  return <TestSheetView sheet={sheet} meta={meta} />;
}
```

- [ ] **Step 2: Move existing chart components**

Move chart files to new locations — this is a file reorganization, no code changes to the chart components themselves yet:

```bash
cd /Users/tordartommervik/Documents/code/tb-data
mkdir -p src/components/tests/charts
cp src/components/AccelScatterChart.tsx src/components/tests/charts/AccelScatterChart.tsx
cp src/components/NoiseHistogramChart.tsx src/components/tests/charts/NoiseHistogramChart.tsx
cp src/components/RangeEfficiencyChart.tsx src/components/tests/charts/RangeEfficiencyChart.tsx
cp src/components/DegradationScatterChart.tsx src/components/tests/charts/DegradationScatterChart.tsx
cp src/components/WltpRealityChart.tsx src/components/tests/charts/WltpRealityChart.tsx
cp src/components/WinterPenaltyChart.tsx src/components/tests/charts/WinterPenaltyChart.tsx
cp src/components/StatsBento.tsx src/components/tests/StatsBento.tsx
cp src/components/TopChart.tsx src/components/tests/TopChart.tsx
cp src/components/DataTable.tsx src/components/tests/DataTable.tsx
```

After copying, update the imports in each moved chart file to use the new paths:
- Change `from "@/lib/chart-utils"` → inline the `findSheet` call using `getTestBySlug` from `@/lib/data/tests`
- Change `from "@/lib/sheet-utils"` → `from "@/lib/utils/parsing"`

For `StatsBento.tsx`, update:
- `from "@/lib/sheet-utils"` → `from "@/lib/utils/formatting"` for `fmt`, and `from "@/lib/types"` for `Stats`
- `from "./TopChart"` → `from "@/components/tests/TopChart"`

For `DataTable.tsx`, update:
- `from "@/lib/sheet-utils"` → `from "@/lib/utils/parsing"` for `parseNum`, and `from "@/lib/types"` for `SortDir`

- [ ] **Step 3: Create TestSheetView client component**

Create `src/components/tests/TestSheetView.tsx` — this contains the state management and filtering logic currently in `page.tsx`, but scoped to a single test sheet:

```tsx
"use client";

import { useState, useMemo } from "react";
import type { TestSheet, TestMeta, SortDir } from "@/lib/types";
import { parseNum, isNumericCol, colMax } from "@/lib/utils/parsing";
import { computeStats } from "@/lib/utils/scoring";
import { StatsBento } from "./StatsBento";
import { DataTable } from "./DataTable";
import { AccelScatterChart } from "./charts/AccelScatterChart";
import { NoiseHistogramChart } from "./charts/NoiseHistogramChart";
import { RangeEfficiencyChart } from "./charts/RangeEfficiencyChart";
import { DegradationScatterChart } from "./charts/DegradationScatterChart";
import { WltpRealityChart } from "./charts/WltpRealityChart";
import { WinterPenaltyChart } from "./charts/WinterPenaltyChart";

// Map of which charts appear on which test sheet
const SHEET_CHARTS: Record<string, React.ComponentType[]> = {
  acceleration: [AccelScatterChart],
  noise: [NoiseHistogramChart],
  range: [RangeEfficiencyChart, WinterPenaltyChart],
  degradation: [DegradationScatterChart],
  sunday: [WltpRealityChart],
};

// Columns that get bar visualizations
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

interface TestSheetViewProps {
  sheet: TestSheet;
  meta: TestMeta;
}

export function TestSheetView({ sheet, meta }: TestSheetViewProps) {
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState(0);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [bananaFilter, setBananaFilter] = useState<"all" | "car" | "van">("all");

  const bananaVanNames = useMemo(() => {
    if (sheet.name !== "Banana") return null;
    const pivotIdx = sheet.rows.findIndex((r) => r[0] === "Van" && r[1] === "Trunk");
    if (pivotIdx < 0) return new Set<string>();
    return new Set(sheet.rows.slice(pivotIdx + 1).map((r) => r[0]));
  }, [sheet]);

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
          if (sheet.name === "Banana" && row[0] === "Van" && row[1] === "Trunk") return false;
          if (!search) return true;
          return row.some((cell) => cell.toLowerCase().includes(search.toLowerCase()));
        })
        .sort((a, b) => {
          const av = a[sortCol] ?? "";
          const bv = b[sortCol] ?? "";
          const an = parseNum(av);
          const bn = parseNum(bv);
          if (an !== null && bn !== null) return sortDir === "asc" ? an - bn : bn - an;
          return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
        }),
    [activeRows, sheet, search, sortCol, sortDir]
  );

  const colMeta = useMemo(
    () =>
      sheet.headers.map((h, i) => ({
        isNumeric: isNumericCol(sheet.rows, i),
        max: colMax(sheet.rows, i),
        isBar: (BAR_COLS[sheet.name] ?? []).includes(h),
      })),
    [sheet]
  );

  const stats = useMemo(() => computeStats({ ...sheet, rows: activeRows }, meta), [sheet, activeRows, meta]);

  function handleSort(colIdx: number) {
    if (sortCol === colIdx) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(colIdx);
      setSortDir("asc");
    }
  }

  const charts = SHEET_CHARTS[sheet.slug] ?? [];

  return (
    <>
      <section>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>{sheet.name}</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--on-surface-variant-muted)" }}>{meta.description}</p>
          </div>
          {bananaVanNames && (
            <div className="flex items-center gap-0.5 p-0.5 rounded-lg shrink-0" style={{ backgroundColor: "var(--surface-container)" }}>
              {(["all", "car", "van"] as const).map((opt) => (
                <button key={opt} onClick={() => setBananaFilter(opt)} className="px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors" style={{ backgroundColor: bananaFilter === opt ? "var(--surface-container-lowest)" : "transparent", color: bananaFilter === opt ? "var(--foreground)" : "var(--on-surface-variant-muted)", boxShadow: bananaFilter === opt ? "0 1px 3px rgba(27,28,28,0.08)" : "none" }}>
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {stats && (
        <StatsBento stats={stats} colName={meta.colName} filteredCount={filtered.length} search={search} />
      )}

      {charts.map((Chart, i) => <Chart key={i} />)}

      <DataTable
        sheetName={sheet.name}
        headers={sheet.headers}
        filtered={filtered}
        totalRows={sheet.rows.length}
        colMeta={colMeta}
        bananaVanNames={bananaVanNames}
        sortCol={sortCol}
        sortDir={sortDir}
        search={search}
        onSearch={setSearch}
        onSort={handleSort}
      />
    </>
  );
}
```

- [ ] **Step 4: Verify test sheet pages render**

Run the dev server and navigate to `http://localhost:3001/tests/range`, `http://localhost:3001/tests/acceleration`, etc. Verify stats, charts, and data table all render correctly.

- [ ] **Step 5: Commit**

```bash
cd /Users/tordartommervik/Documents/code/tb-data
git add src/app/tests/ src/components/tests/
git commit -m "feat: add test sheet route pages with existing visualizations"
```

---

### Task 8: Create vehicle profile pages

**Files:**
- Create: `src/app/vehicles/[slug]/page.tsx`
- Create: `src/components/vehicles/VehicleProfileView.tsx`

- [ ] **Step 1: Create vehicle profile route page**

Create `src/app/vehicles/[slug]/page.tsx`:

```tsx
import { getVehicles, getVehicleBySlug } from "@/lib/data/vehicles";
import { getVehicleProfile } from "@/lib/data/comparison";
import { VehicleProfileView } from "@/components/vehicles/VehicleProfileView";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  return getVehicles().map((v) => ({ slug: v.slug }));
}

export default async function VehiclePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const vehicle = getVehicleBySlug(slug);
  if (!vehicle) notFound();

  const profile = getVehicleProfile(vehicle.name);
  if (!profile) notFound();

  return <VehicleProfileView profile={profile} />;
}
```

- [ ] **Step 2: Create VehicleProfileView component**

Create `src/components/vehicles/VehicleProfileView.tsx`:

```tsx
"use client";

import Link from "next/link";
import type { VehicleProfile } from "@/lib/types";

interface VehicleProfileViewProps {
  profile: VehicleProfile;
}

export function VehicleProfileView({ profile }: VehicleProfileViewProps) {
  // Pick key summary stats
  const summaryMetrics = ["Range", "Acceleration", "Noise", "Weight", "Banana", "Braking"];
  const summaryResults = profile.results.filter((r) => summaryMetrics.includes(r.testName));

  return (
    <>
      {/* Header */}
      <section>
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-extrabold tracking-tight" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
            {profile.name}
          </h2>
          <span
            className="text-[10px] font-bold uppercase tracking-[0.12em] px-2 py-1 rounded"
            style={{
              backgroundColor: profile.type === "van" ? "#e2dfff" : "#f0fdf4",
              color: profile.type === "van" ? "#3323cc" : "#15803d",
            }}
          >
            {profile.type}
          </span>
        </div>
        <p className="mt-1 text-sm" style={{ color: "var(--on-surface-variant-muted)" }}>
          Tested across {profile.results.length} categories
        </p>
      </section>

      {/* Summary cards */}
      {summaryResults.length > 0 && (
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {summaryResults.map((r) => (
            <div
              key={r.testSlug}
              className="p-5 rounded-xl editorial-shadow"
              style={{ backgroundColor: "var(--surface-container-lowest)", border: "1px solid var(--border-subtle)" }}
            >
              <span
                className="text-xs font-bold uppercase tracking-[0.18em]"
                style={{ color: "var(--on-surface-variant-muted)", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}
              >
                {r.testName}
              </span>
              <div className="mt-2">
                <span className="text-2xl font-extrabold" style={{ color: "var(--foreground)" }}>
                  {r.value % 1 === 0 ? r.value : r.value.toFixed(1)}
                </span>
                <span className="text-sm ml-1" style={{ color: "var(--on-surface-variant-muted)" }}>
                  {r.unit === "banana" ? "🍌" : r.unit}
                </span>
              </div>
              <p className="mt-1 text-xs" style={{ color: "var(--on-surface-variant-muted)" }}>
                #{r.rank} of {r.totalTested}
              </p>
            </div>
          ))}
        </section>
      )}

      {/* Full results table */}
      <section>
        <h3 className="font-bold text-lg tracking-tight mb-4" style={{ color: "var(--foreground)" }}>All Test Results</h3>
        <div
          className="rounded-xl overflow-hidden editorial-shadow"
          style={{ backgroundColor: "var(--surface-container-lowest)", border: "1px solid var(--border-subtle)" }}
        >
          <table className="w-full text-sm">
            <thead style={{ backgroundColor: "var(--surface-container-high)" }}>
              <tr>
                <th className="text-left py-3.5 px-6" style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, color: "var(--on-surface-variant-muted)" }}>Test</th>
                <th className="text-right py-3.5 px-6" style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, color: "var(--on-surface-variant-muted)" }}>Value</th>
                <th className="text-right py-3.5 px-6" style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, color: "var(--on-surface-variant-muted)" }}>Rank</th>
                <th className="text-left py-3.5 px-6 min-w-[160px]" style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, color: "var(--on-surface-variant-muted)" }}>Percentile</th>
              </tr>
            </thead>
            <tbody>
              {profile.results.map((r) => {
                const percentile = Math.round((1 - (r.rank - 1) / r.totalTested) * 100);
                return (
                  <tr key={r.testSlug} className="transition-colors" style={{ borderTop: "1px solid var(--row-border)" }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--row-hover)"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}>
                    <td className="py-3.5 px-6 font-semibold" style={{ color: "var(--foreground)" }}>
                      <Link href={`/tests/${r.testSlug}`} className="hover:underline underline-offset-2" style={{ color: "var(--primary)" }}>
                        {r.testName}
                      </Link>
                    </td>
                    <td className="py-3.5 px-6 text-right tabular-nums" style={{ color: "var(--foreground)" }}>
                      {r.value % 1 === 0 ? r.value : r.value.toFixed(1)} {r.unit === "banana" ? "🍌" : r.unit}
                    </td>
                    <td className="py-3.5 px-6 text-right tabular-nums" style={{ color: "var(--on-surface-variant-muted)" }}>
                      {r.rank} / {r.totalTested}
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--surface-container)" }}>
                          <div className="h-full rounded-full" style={{ width: `${percentile}%`, backgroundColor: percentile >= 75 ? "#34d399" : percentile >= 50 ? "#3525cd" : percentile >= 25 ? "#fb923c" : "#f43f5e" }} />
                        </div>
                        <span className="text-xs tabular-nums w-10 text-right" style={{ color: "var(--on-surface-variant-muted)" }}>{percentile}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Compare button */}
      <section>
        <Link
          href={`/compare?a=${profile.slug}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #3525cd, #4f46e5)" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>compare_arrows</span>
          Compare with another vehicle
        </Link>
      </section>
    </>
  );
}
```

- [ ] **Step 3: Verify vehicle profile pages render**

Navigate to `http://localhost:3001/vehicles/tesla-model-y` (or whatever slug the conversion script generated). Verify:
- Header with name and type badge
- Summary stat cards
- Full results table with ranks and percentiles
- "Compare" button

- [ ] **Step 4: Commit**

```bash
cd /Users/tordartommervik/Documents/code/tb-data
git add src/app/vehicles/ src/components/vehicles/
git commit -m "feat: add vehicle profile pages with test results and rankings"
```

---

### Task 9: Create weighted ranker page

**Files:**
- Create: `src/app/compare/page.tsx`
- Create: `src/components/compare/WeightedRankerView.tsx`

- [ ] **Step 1: Create compare route page**

Create `src/app/compare/page.tsx`:

```tsx
import { WeightedRankerView } from "@/components/compare/WeightedRankerView";

export default function ComparePage() {
  return <WeightedRankerView />;
}
```

- [ ] **Step 2: Create WeightedRankerView component**

Create `src/components/compare/WeightedRankerView.tsx`:

```tsx
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { getVehicles } from "@/lib/data/vehicles";
import { RANKING_METRICS, getMetricScores } from "@/lib/data/comparison";
import { computeWeightedRank } from "@/lib/utils/scoring";

const defaultWeights = Object.fromEntries(RANKING_METRICS.map((m) => [m.key, 50]));

export function WeightedRankerView() {
  const [weights, setWeights] = useState<Record<string, number>>(defaultWeights);

  const vehiclesWithScores = useMemo(() => {
    const allVehicles = getVehicles();
    return allVehicles
      .map((v) => {
        const scores = getMetricScores(v.name);
        if (!scores) return null;
        // Only include vehicles that have at least 3 metrics
        if (Object.keys(scores).length < 3) return null;
        return { name: v.name, slug: v.slug, scores };
      })
      .filter((v): v is NonNullable<typeof v> => v !== null);
  }, []);

  const ranked = useMemo(
    () => computeWeightedRank(vehiclesWithScores, weights),
    [vehiclesWithScores, weights]
  );

  function updateWeight(key: string, value: number) {
    setWeights((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <>
      <section>
        <h2 className="text-3xl font-extrabold tracking-tight" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
          Find Your EV
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--on-surface-variant-muted)" }}>
          Adjust the sliders to match your priorities — the list ranks vehicles by your weighted preferences
        </p>
      </section>

      {/* Sliders */}
      <section
        className="p-6 lg:p-8 rounded-xl editorial-shadow"
        style={{ backgroundColor: "var(--surface-container-lowest)", border: "1px solid var(--border-subtle)" }}
      >
        <h3 className="font-bold text-base tracking-tight mb-6" style={{ color: "var(--foreground)" }}>
          What matters to you?
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
          {RANKING_METRICS.map((metric) => (
            <div key={metric.key}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                  {metric.label}
                </label>
                <span className="text-xs tabular-nums font-medium" style={{ color: "var(--on-surface-variant-muted)" }}>
                  {weights[metric.key]}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={weights[metric.key]}
                onChange={(e) => updateWeight(metric.key, parseInt(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: "var(--primary)" }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Ranked list */}
      <section>
        <h3 className="font-bold text-lg tracking-tight mb-4" style={{ color: "var(--foreground)" }}>
          Top matches ({ranked.length} vehicles)
        </h3>
        <div
          className="rounded-xl overflow-hidden editorial-shadow"
          style={{ backgroundColor: "var(--surface-container-lowest)", border: "1px solid var(--border-subtle)" }}
        >
          <table className="w-full text-sm">
            <thead style={{ backgroundColor: "var(--surface-container-high)" }}>
              <tr>
                <th className="text-left py-3.5 px-6 w-8" style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, color: "var(--on-surface-variant-muted)" }}>#</th>
                <th className="text-left py-3.5 px-4" style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, color: "var(--on-surface-variant-muted)" }}>Vehicle</th>
                {RANKING_METRICS.map((m) => (
                  <th key={m.key} className="text-right py-3.5 px-4 hidden lg:table-cell" style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, color: weights[m.key] > 0 ? "var(--on-surface-variant-muted)" : "var(--outline-variant)" }}>
                    {m.label.split(" ")[0]}
                  </th>
                ))}
                <th className="text-right py-3.5 px-6" style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, color: "var(--primary)" }}>Score</th>
              </tr>
            </thead>
            <tbody>
              {ranked.slice(0, 50).map((vehicle, i) => (
                <tr
                  key={vehicle.slug}
                  className="transition-colors"
                  style={{ borderTop: "1px solid var(--row-border)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--row-hover)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  <td className="py-3.5 px-6 tabular-nums font-medium" style={{ color: "var(--on-surface-variant-muted)" }}>
                    {i + 1}
                  </td>
                  <td className="py-3.5 px-4 font-semibold" style={{ color: "var(--foreground)" }}>
                    <Link href={`/vehicles/${vehicle.slug}`} className="hover:underline underline-offset-2" style={{ color: "var(--primary)" }}>
                      {vehicle.name}
                    </Link>
                  </td>
                  {RANKING_METRICS.map((m) => (
                    <td key={m.key} className="py-3.5 px-4 text-right tabular-nums hidden lg:table-cell" style={{ color: vehicle.scores[m.key] !== undefined ? "var(--on-surface-variant)" : "var(--outline-variant)" }}>
                      {vehicle.scores[m.key] ?? "—"}
                    </td>
                  ))}
                  <td className="py-3.5 px-6 text-right">
                    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold tabular-nums" style={{ backgroundColor: "var(--primary-container)", color: "var(--on-primary-container)" }}>
                      {vehicle.weightedScore}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
```

- [ ] **Step 3: Verify weighted ranker page**

Navigate to `http://localhost:3001/compare`. Verify:
- All 6 sliders render and are interactive
- Ranked list updates in real-time as sliders move
- Vehicle names link to profile pages
- Scores are reasonable (0-100 range)

- [ ] **Step 4: Commit**

```bash
cd /Users/tordartommervik/Documents/code/tb-data
git add src/app/compare/page.tsx src/components/compare/WeightedRankerView.tsx
git commit -m "feat: add weighted ranker page — 'Find Your EV' with priority sliders"
```

---

### Task 10: Create head-to-head comparison page

**Files:**
- Create: `src/app/compare/[slugA]/[slugB]/page.tsx`
- Create: `src/components/compare/HeadToHeadView.tsx`

- [ ] **Step 1: Create head-to-head route page**

Create `src/app/compare/[slugA]/[slugB]/page.tsx`:

```tsx
import { getVehicleBySlug } from "@/lib/data/vehicles";
import { HeadToHeadView } from "@/components/compare/HeadToHeadView";
import { notFound } from "next/navigation";

export default async function HeadToHeadPage({ params }: { params: Promise<{ slugA: string; slugB: string }> }) {
  const { slugA, slugB } = await params;
  const vehicleA = getVehicleBySlug(slugA);
  const vehicleB = getVehicleBySlug(slugB);

  if (!vehicleA || !vehicleB) notFound();

  return <HeadToHeadView initialA={vehicleA.name} initialB={vehicleB.name} />;
}
```

- [ ] **Step 2: Create HeadToHeadView component**

Create `src/components/compare/HeadToHeadView.tsx`:

```tsx
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getVehiclesForComparison } from "@/lib/data/comparison";
import { getVehicles, getVehicleByName } from "@/lib/data/vehicles";
import { vehicleSlug } from "@/lib/utils/formatting";

const allCarNames = getVehicles().map((v) => v.name).sort();

interface HeadToHeadViewProps {
  initialA: string;
  initialB: string;
}

export function HeadToHeadView({ initialA, initialB }: HeadToHeadViewProps) {
  const router = useRouter();
  const [nameA, setNameA] = useState(initialA);
  const [nameB, setNameB] = useState(initialB);
  const [queryA, setQueryA] = useState("");
  const [queryB, setQueryB] = useState("");

  const comparison = useMemo(
    () => getVehiclesForComparison(nameA, nameB),
    [nameA, nameB]
  );

  function selectVehicle(side: "a" | "b", name: string) {
    const newA = side === "a" ? name : nameA;
    const newB = side === "b" ? name : nameB;
    if (side === "a") { setNameA(name); setQueryA(""); }
    else { setNameB(name); setQueryB(""); }

    const slugA = getVehicleByName(newA)?.slug ?? vehicleSlug(newA);
    const slugB = getVehicleByName(newB)?.slug ?? vehicleSlug(newB);
    router.replace(`/compare/${slugA}/${slugB}`);
  }

  function getSuggestions(query: string, exclude: string) {
    if (!query || query.length < 2) return [];
    const lower = query.toLowerCase();
    const terms = lower.split(/\s+/).filter(Boolean);
    return allCarNames
      .filter((c) => c !== exclude && terms.every((t) => c.toLowerCase().includes(t)))
      .slice(0, 8);
  }

  const suggestionsA = useMemo(() => getSuggestions(queryA, nameB), [queryA, nameB]);
  const suggestionsB = useMemo(() => getSuggestions(queryB, nameA), [queryB, nameA]);

  return (
    <>
      <section>
        <h2 className="text-3xl font-extrabold tracking-tight" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
          Head-to-Head
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--on-surface-variant-muted)" }}>
          Side-by-side comparison across all shared test results
        </p>
      </section>

      {/* Vehicle pickers */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Vehicle A */}
        <div className="relative">
          <label className="text-xs font-bold uppercase tracking-[0.18em] mb-2 block" style={{ color: "var(--on-surface-variant-muted)", fontFamily: "var(--font-space-grotesk)" }}>Vehicle A</label>
          <input
            type="text"
            value={queryA || nameA}
            onChange={(e) => setQueryA(e.target.value)}
            onFocus={() => setQueryA("")}
            className="w-full rounded-lg py-2.5 px-4 text-sm outline-none font-semibold"
            style={{ backgroundColor: "var(--surface-container-low)", color: "var(--foreground)", border: "1px solid var(--outline-variant)" }}
          />
          {suggestionsA.length > 0 && (
            <div className="absolute top-full mt-1 left-0 right-0 rounded-xl shadow-xl z-50 overflow-hidden" style={{ backgroundColor: "var(--surface-container-lowest)", border: "1px solid var(--outline-variant)" }}>
              {suggestionsA.map((s) => (
                <button key={s} onClick={() => selectVehicle("a", s)} className="w-full text-left px-4 py-2 text-sm truncate" style={{ color: "var(--foreground)" }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--surface-container)"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Vehicle B */}
        <div className="relative">
          <label className="text-xs font-bold uppercase tracking-[0.18em] mb-2 block" style={{ color: "var(--on-surface-variant-muted)", fontFamily: "var(--font-space-grotesk)" }}>Vehicle B</label>
          <input
            type="text"
            value={queryB || nameB}
            onChange={(e) => setQueryB(e.target.value)}
            onFocus={() => setQueryB("")}
            className="w-full rounded-lg py-2.5 px-4 text-sm outline-none font-semibold"
            style={{ backgroundColor: "var(--surface-container-low)", color: "var(--foreground)", border: "1px solid var(--outline-variant)" }}
          />
          {suggestionsB.length > 0 && (
            <div className="absolute top-full mt-1 left-0 right-0 rounded-xl shadow-xl z-50 overflow-hidden" style={{ backgroundColor: "var(--surface-container-lowest)", border: "1px solid var(--outline-variant)" }}>
              {suggestionsB.map((s) => (
                <button key={s} onClick={() => selectVehicle("b", s)} className="w-full text-left px-4 py-2 text-sm truncate" style={{ color: "var(--foreground)" }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--surface-container)"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Comparison table */}
      {comparison && comparison.metrics.length > 0 && (
        <section>
          <div
            className="rounded-xl overflow-hidden editorial-shadow"
            style={{ backgroundColor: "var(--surface-container-lowest)", border: "1px solid var(--border-subtle)" }}
          >
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: "var(--surface-container-high)" }}>
                <tr>
                  <th className="text-right py-3.5 px-6 w-1/3" style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, color: "var(--primary)" }}>
                    {nameA.length > 25 ? nameA.slice(0, 23) + "…" : nameA}
                  </th>
                  <th className="text-center py-3.5 px-4" style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, color: "var(--on-surface-variant-muted)" }}>
                    Test
                  </th>
                  <th className="text-left py-3.5 px-6 w-1/3" style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, color: "var(--primary)" }}>
                    {nameB.length > 25 ? nameB.slice(0, 23) + "…" : nameB}
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparison.metrics.map((m) => (
                  <tr key={m.testSlug} style={{ borderTop: "1px solid var(--row-border)" }}>
                    <td className="py-3.5 px-6 text-right tabular-nums" style={{ color: m.winner === "a" ? "var(--foreground)" : "var(--on-surface-variant-muted)", fontWeight: m.winner === "a" ? 700 : 400 }}>
                      {m.valueA !== null ? (
                        <span>
                          {m.valueA % 1 === 0 ? m.valueA : m.valueA.toFixed(1)}
                          <span className="text-xs ml-1" style={{ color: "var(--on-surface-variant-muted)", fontWeight: 400 }}>{m.unit === "banana" ? "🍌" : m.unit}</span>
                          {m.winner === "a" && <span className="ml-2 text-xs" style={{ color: "#34d399" }}>●</span>}
                        </span>
                      ) : <span style={{ color: "var(--outline-variant)" }}>—</span>}
                    </td>
                    <td className="py-3.5 px-4 text-center text-xs font-medium" style={{ color: "var(--on-surface-variant-muted)" }}>
                      {m.testName}
                    </td>
                    <td className="py-3.5 px-6 tabular-nums" style={{ color: m.winner === "b" ? "var(--foreground)" : "var(--on-surface-variant-muted)", fontWeight: m.winner === "b" ? 700 : 400 }}>
                      {m.valueB !== null ? (
                        <span>
                          {m.winner === "b" && <span className="mr-2 text-xs" style={{ color: "#34d399" }}>●</span>}
                          {m.valueB % 1 === 0 ? m.valueB : m.valueB.toFixed(1)}
                          <span className="text-xs ml-1" style={{ color: "var(--on-surface-variant-muted)", fontWeight: 400 }}>{m.unit === "banana" ? "🍌" : m.unit}</span>
                        </span>
                      ) : <span style={{ color: "var(--outline-variant)" }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {comparison && comparison.metrics.length === 0 && (
        <section className="text-center py-16">
          <p className="text-sm" style={{ color: "var(--on-surface-variant-muted)" }}>
            No shared test results between these vehicles.
          </p>
        </section>
      )}
    </>
  );
}
```

- [ ] **Step 3: Verify head-to-head page**

Navigate to `http://localhost:3001/compare/tesla-model-y/hyundai-ioniq-5` (adjust slugs to match generated data). Verify:
- Both vehicle pickers show names
- Side-by-side table shows all shared metrics
- Winner indicators (green dots) appear on the better value
- Changing a vehicle via the picker updates the URL and comparison

- [ ] **Step 4: Commit**

```bash
cd /Users/tordartommervik/Documents/code/tb-data
git add src/app/compare/ src/components/compare/HeadToHeadView.tsx
git commit -m "feat: add head-to-head comparison page with side-by-side metrics"
```

---

### Task 11: Build Google Sheets import script and GitHub Action

**Files:**
- Create: `scripts/import-sheets.ts`
- Create: `.github/workflows/update-data.yml`
- Modify: `package.json`

- [ ] **Step 1: Create import script**

Create `scripts/import-sheets.ts`:

```ts
/**
 * Fetches Bjørn Nyland's TB Test Results from Google Sheets
 * and writes structured JSON files for the app to consume.
 *
 * Usage: npx tsx scripts/import-sheets.ts
 */
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const SPREADSHEET_ID = "1V6ucyFGKWuSQzvI8lMzvvWJHrBS82echMVJH37kwgjE";

// Map of sheet names to their Google Sheets GID values.
// These can be found in the URL when viewing each tab.
// Update this map if Bjørn adds new test sheets.
const SHEET_GIDS: Record<string, number> = {
  Banana: 244400016,
  Weight: 1037722064,
  Acceleration: 1275498076,
  Noise: 1536498498,
  Braking: 1700792432,
  Range: 798534066,
  Sunday: 1505237498,
  "1000 km": 1369498290,
  "500 km": 1553850498,
  "Arctic Circle": 1150000000,
  Bangkok: 1200000000,
  Degradation: 1800000000,
  Geilo: 1900000000,
  "Zero mile": 2000000000,
};

const SHEET_CONFIG: Record<string, { colName: string; lowerIsBetter: boolean; unit: string; description: string; icon: string }> = {
  Banana: { colName: "Seats folded", lowerIsBetter: false, unit: "banana", description: "Cargo volume with rear seats flat — the Bjørn Nyland banana box test", icon: "luggage" },
  Weight: { colName: "Total", lowerIsBetter: true, unit: "kg", description: "Curb weight distribution across the EV segment", icon: "monitor_weight" },
  Acceleration: { colName: "0-100", lowerIsBetter: true, unit: "s", description: "0–100 km/h acceleration benchmarks", icon: "speed" },
  Noise: { colName: "Average", lowerIsBetter: true, unit: "dB", description: "Interior noise levels at highway speeds", icon: "volume_up" },
  Braking: { colName: "Distance", lowerIsBetter: true, unit: "m", description: "Emergency braking distance from 100 km/h", icon: "tire_repair" },
  Range: { colName: "km", lowerIsBetter: false, unit: "km", description: "Real-world range at 90 km/h", icon: "ev_station" },
  Sunday: { colName: "Range", lowerIsBetter: false, unit: "km", description: "Sunday drive range estimates", icon: "wb_sunny" },
  "1000 km": { colName: "km/h", lowerIsBetter: false, unit: "km/h", description: "1 000 km challenge — average speed including charging stops", icon: "route" },
  "500 km": { colName: "km/h", lowerIsBetter: false, unit: "km/h", description: "500 km challenge — average speed including charging stops", icon: "route" },
  "Arctic Circle": { colName: "km/h", lowerIsBetter: false, unit: "km/h", description: "Arctic Circle cold-weather challenge average speed", icon: "ac_unit" },
  Bangkok: { colName: "Wh/km", lowerIsBetter: true, unit: "Wh/km", description: "Bangkok heat test — energy consumption in tropical conditions", icon: "travel_explore" },
  Degradation: { colName: "Degradation", lowerIsBetter: true, unit: "%", description: "Battery capacity degradation vs. odometer reading", icon: "battery_alert" },
};

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function vehicleSlugify(name: string): string {
  return name.toLowerCase().replace(/['']/g, "").replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        current.push(field.trim());
        field = "";
      } else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        current.push(field.trim());
        if (current.some((c) => c !== "")) rows.push(current);
        current = [];
        field = "";
      } else {
        field += ch;
      }
    }
  }
  if (field || current.length > 0) {
    current.push(field.trim());
    if (current.some((c) => c !== "")) rows.push(current);
  }
  return rows;
}

async function fetchSheet(name: string, gid: number): Promise<{ headers: string[]; rows: string[][] } | null> {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`;
  console.log(`  Fetching ${name} (gid=${gid})...`);

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`  Warning: Failed to fetch ${name}: ${res.status}`);
      return null;
    }
    const text = await res.text();
    const parsed = parseCSV(text);
    if (parsed.length < 2) {
      console.warn(`  Warning: ${name} has too few rows (${parsed.length})`);
      return null;
    }
    return { headers: parsed[0], rows: parsed.slice(1) };
  } catch (err) {
    console.warn(`  Warning: Error fetching ${name}:`, err);
    return null;
  }
}

async function main() {
  const TESTS_DIR = join(__dirname, "../src/data/tests");
  mkdirSync(TESTS_DIR, { recursive: true });

  console.log("Importing TB Test Results from Google Sheets...\n");

  const meta: any[] = [];
  const allVehicles = new Map<string, { type: "car" | "van"; tests: Set<string> }>();
  const vanNames = new Set<string>();

  // First pass: fetch all sheets
  for (const [name, gid] of Object.entries(SHEET_GIDS)) {
    const result = await fetchSheet(name, gid);
    if (!result) continue;

    const slug = slugify(name);
    const config = SHEET_CONFIG[name];

    writeFileSync(
      join(TESTS_DIR, `${slug}.json`),
      JSON.stringify({ name, slug, headers: result.headers, rows: result.rows }, null, 2)
    );

    meta.push({
      name,
      slug,
      icon: config?.icon ?? "table_chart",
      colName: config?.colName ?? "",
      lowerIsBetter: config?.lowerIsBetter ?? false,
      unit: config?.unit ?? "",
      description: config?.description ?? "",
    });

    // Detect vans from Banana sheet
    if (name === "Banana") {
      const pivotIdx = result.rows.findIndex((r) => r[0] === "Van" && r[1] === "Trunk");
      if (pivotIdx >= 0) {
        for (const row of result.rows.slice(pivotIdx + 1)) {
          if (row[0]) vanNames.add(row[0]);
        }
      }
    }

    // Build vehicle list
    for (const row of result.rows) {
      const vName = row[0];
      if (!vName || (name === "Banana" && vName === "Van" && row[1] === "Trunk")) continue;
      if (!allVehicles.has(vName)) {
        allVehicles.set(vName, { type: vanNames.has(vName) ? "van" : "car", tests: new Set() });
      }
      allVehicles.get(vName)!.tests.add(slug);
    }

    console.log(`  ✓ ${name}: ${result.rows.length} rows`);
  }

  writeFileSync(join(TESTS_DIR, "meta.json"), JSON.stringify(meta, null, 2));

  const vehiclesJson = Array.from(allVehicles.entries())
    .map(([name, info]) => ({
      name,
      slug: vehicleSlugify(name),
      type: info.type,
      tests: Array.from(info.tests),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  writeFileSync(join(__dirname, "../src/data/vehicles.json"), JSON.stringify(vehiclesJson, null, 2));

  console.log(`\n✓ Imported ${meta.length} test sheets, ${vehiclesJson.length} vehicles`);
}

main().catch(console.error);
```

- [ ] **Step 2: Add import-data script to package.json**

Add to `scripts` in `package.json`:

```json
"import-data": "tsx scripts/import-sheets.ts"
```

- [ ] **Step 3: Create GitHub Action**

Create `.github/workflows/update-data.yml`:

```yaml
name: Update EV Test Data

on:
  schedule:
    - cron: "0 6 * * 1" # Every Monday at 06:00 UTC
  workflow_dispatch: # Allow manual trigger

jobs:
  update-data:
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      - run: npm run import-data

      - name: Check for changes
        id: changes
        run: |
          if git diff --quiet src/data/; then
            echo "changed=false" >> $GITHUB_OUTPUT
          else
            echo "changed=true" >> $GITHUB_OUTPUT
          fi

      - name: Commit and push
        if: steps.changes.outputs.changed == 'true'
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add src/data/
          git commit -m "chore: update EV test data from Google Sheets"
          git push
```

- [ ] **Step 4: Test the import script locally**

Run: `cd /Users/tordartommervik/Documents/code/tb-data && npm run import-data`

Note: The GID values in `SHEET_GIDS` are placeholder estimates — some may fail. When running this for real, you'll need to open each sheet tab in the browser and copy the correct `gid=` value from the URL. The script handles failures gracefully and reports which sheets succeeded.

- [ ] **Step 5: Commit**

```bash
cd /Users/tordartommervik/Documents/code/tb-data
git add scripts/import-sheets.ts .github/workflows/update-data.yml package.json
git commit -m "feat: add Google Sheets import script and weekly GitHub Action"
```

---

### Task 12: Cleanup — remove old files, update branding, final verification

**Files:**
- Delete: old component files in `src/components/` (flat ones replaced by feature folders)
- Delete: `src/data/sheets.ts`, `src/data/vehicles.ts` (replaced by JSON)
- Delete: `src/lib/sheet-utils.ts`, `src/lib/chart-utils.ts` (replaced by utils/)
- Delete: `src/components/Charts.tsx` (unused)
- Add: `.superpowers/` to `.gitignore`

- [ ] **Step 1: Delete old flat component files**

```bash
cd /Users/tordartommervik/Documents/code/tb-data
rm src/components/AccelScatterChart.tsx
rm src/components/NoiseHistogramChart.tsx
rm src/components/RangeEfficiencyChart.tsx
rm src/components/DegradationScatterChart.tsx
rm src/components/WltpRealityChart.tsx
rm src/components/WinterPenaltyChart.tsx
rm src/components/StatsBento.tsx
rm src/components/TopChart.tsx
rm src/components/DataTable.tsx
rm src/components/DashboardView.tsx
rm src/components/RadarSection.tsx
rm src/components/Charts.tsx
```

- [ ] **Step 2: Delete old data and utility files**

```bash
cd /Users/tordartommervik/Documents/code/tb-data
rm src/data/sheets.ts
rm src/data/vehicles.ts
rm src/lib/sheet-utils.ts
rm src/lib/chart-utils.ts
```

- [ ] **Step 3: Add .superpowers/ to .gitignore**

Append to `.gitignore` (create if needed):

```
.superpowers/
```

- [ ] **Step 4: Run full test suite**

Run: `cd /Users/tordartommervik/Documents/code/tb-data && npx vitest run`
Expected: All tests PASS.

- [ ] **Step 5: Run build**

Run: `cd /Users/tordartommervik/Documents/code/tb-data && npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 6: Manual verification**

Start dev server and verify all routes work:
- `http://localhost:3001/` — Dashboard with stats and radar
- `http://localhost:3001/tests/range` — Range test sheet with charts and table
- `http://localhost:3001/tests/acceleration` — Acceleration sheet with scatter chart
- `http://localhost:3001/vehicles/tesla-model-y` — Vehicle profile with all test results
- `http://localhost:3001/compare` — Weighted ranker with sliders
- `http://localhost:3001/compare/tesla-model-y/hyundai-ioniq-5` — Head-to-head comparison
- Sidebar navigation works with active indicators
- Light/dark theme toggle works
- Mobile hamburger menu works

- [ ] **Step 7: Commit**

```bash
cd /Users/tordartommervik/Documents/code/tb-data
git add -A
git commit -m "chore: remove legacy files, complete migration to new architecture"
```
