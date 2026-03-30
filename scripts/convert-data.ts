/**
 * One-time script to convert existing TS data files to JSON.
 * Run with: npx tsx scripts/convert-data.ts
 */
import { sheets } from "../src/data/sheets";
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

for (const sheet of sheets) {
  const slug = slugify(sheet.name);
  const data = { name: sheet.name, slug, headers: sheet.headers, rows: sheet.rows };
  writeFileSync(join(TESTS_DIR, `${slug}.json`), JSON.stringify(data, null, 2));
}

const meta = sheets.map((s) => {
  const slug = slugify(s.name);
  const config = SHEET_CONFIG[s.name];
  return {
    name: s.name, slug,
    icon: config?.icon ?? "table_chart",
    colName: config?.colName ?? "",
    lowerIsBetter: config?.lowerIsBetter ?? false,
    unit: config?.unit ?? "",
    description: config?.description ?? "",
  };
});
writeFileSync(join(TESTS_DIR, "meta.json"), JSON.stringify(meta, null, 2));

const vehicleMap = new Map<string, { type: "car" | "van"; tests: Set<string> }>();
const bananaSheet = sheets.find((s) => s.name === "Banana");
const vanNames = new Set<string>();
if (bananaSheet) {
  const pivotIdx = bananaSheet.rows.findIndex((r) => r[0] === "Van" && r[1] === "Trunk");
  if (pivotIdx >= 0) {
    for (const row of bananaSheet.rows.slice(pivotIdx + 1)) vanNames.add(row[0]);
  }
}

for (const sheet of sheets) {
  const testSlug = slugify(sheet.name);
  for (const row of sheet.rows) {
    const name = row[0];
    if (!name || (sheet.name === "Banana" && name === "Van" && row[1] === "Trunk")) continue;
    if (!vehicleMap.has(name)) vehicleMap.set(name, { type: vanNames.has(name) ? "van" : "car", tests: new Set() });
    vehicleMap.get(name)!.tests.add(testSlug);
  }
}

const vehiclesJson = Array.from(vehicleMap.entries())
  .map(([name, info]) => ({ name, slug: vehicleSlug(name), type: info.type, tests: Array.from(info.tests) }))
  .sort((a, b) => a.name.localeCompare(b.name));
writeFileSync(join(__dirname, "../src/data/vehicles.json"), JSON.stringify(vehiclesJson, null, 2));
console.log(`Converted ${sheets.length} test sheets and ${vehiclesJson.length} vehicles to JSON`);
