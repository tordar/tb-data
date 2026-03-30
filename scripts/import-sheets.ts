/**
 * Fetches data from Bjørn Nyland's public Google Sheets CSV export,
 * parses each sheet tab, and writes JSON files to src/data/tests/ and
 * src/data/vehicles.json.
 *
 * Run with: npm run import-data
 * Or directly: npx tsx scripts/import-sheets.ts
 */

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const SPREADSHEET_ID = "1V6ucyFGKWuSQzvI8lMzvvWJHrBS82echMVJH37kwgjE";

/**
 * GID values for each sheet tab.
 * These must match the actual gid= parameter in the Google Sheets URL.
 * To find a GID: open the sheet, click the tab, and read the gid= value
 * from the browser URL bar.
 *
 * Placeholder GIDs are used here — update them once you have the real values.
 * The script will warn and skip any sheet whose fetch fails.
 */
const SHEET_GIDS: Record<string, number> = {
  Banana: 0,
  Weight: 1865415711,
  Acceleration: 378787627,
  Noise: 2069101638,
  Braking: 26964202,
  Range: 735351678,
  Sunday: 866693557,
  "1000 km": 15442336,
  "500 km": 1229113299,
  Geilo: 2118810793,
  Degradation: 244400016,
  "Zero mile": 52159941,
  "Arctic Circle": 478179452,
  Bangkok: 1066718131,
};

const SHEET_CONFIG: Record<
  string,
  {
    colName: string;
    lowerIsBetter: boolean;
    unit: string;
    description: string;
    icon: string;
  }
> = {
  Banana: {
    colName: "Seats folded",
    lowerIsBetter: false,
    unit: "banana",
    description:
      "Cargo volume with rear seats flat — the Bjørn Nyland banana box test",
    icon: "luggage",
  },
  Weight: {
    colName: "Total",
    lowerIsBetter: true,
    unit: "kg",
    description: "Curb weight distribution across the EV segment",
    icon: "monitor_weight",
  },
  Acceleration: {
    colName: "0-100",
    lowerIsBetter: true,
    unit: "s",
    description: "0–100 km/h acceleration benchmarks",
    icon: "speed",
  },
  Noise: {
    colName: "Average",
    lowerIsBetter: true,
    unit: "dB",
    description: "Interior noise levels at highway speeds",
    icon: "volume_up",
  },
  Braking: {
    colName: "Distance",
    lowerIsBetter: true,
    unit: "m",
    description: "Emergency braking distance from 100 km/h",
    icon: "tire_repair",
  },
  Range: {
    colName: "km",
    lowerIsBetter: false,
    unit: "km",
    description: "Real-world range at 90 km/h",
    icon: "ev_station",
  },
  Sunday: {
    colName: "Range",
    lowerIsBetter: false,
    unit: "km",
    description: "Sunday drive range estimates",
    icon: "wb_sunny",
  },
  "1000 km": {
    colName: "km/h",
    lowerIsBetter: false,
    unit: "km/h",
    description:
      "1 000 km challenge — average speed including charging stops",
    icon: "route",
  },
  "500 km": {
    colName: "km/h",
    lowerIsBetter: false,
    unit: "km/h",
    description:
      "500 km challenge — average speed including charging stops",
    icon: "route",
  },
  "Arctic Circle": {
    colName: "km/h",
    lowerIsBetter: false,
    unit: "km/h",
    description: "Arctic Circle cold-weather challenge average speed",
    icon: "ac_unit",
  },
  Bangkok: {
    colName: "Wh/km",
    lowerIsBetter: true,
    unit: "Wh/km",
    description:
      "Bangkok heat test — energy consumption in tropical conditions",
    icon: "travel_explore",
  },
  Degradation: {
    colName: "Degradation",
    lowerIsBetter: true,
    unit: "%",
    description: "Battery capacity degradation vs. odometer reading",
    icon: "battery_alert",
  },
  Geilo: {
    colName: "Time",
    lowerIsBetter: true,
    unit: "min",
    description:
      "A mountain route challenge from Oslo to Geilo — a steep, cold-weather drive through Norwegian highlands. Measures total time and number of charging stops. Fewer stops and lower time means better real-world mountain performance.",
    icon: "terrain",
  },
  "Zero mile": {
    colName: "Zero buffer",
    lowerIsBetter: false,
    unit: "kWh",
    description:
      "What happens when you drive an EV to 0%? This test drains each car completely to see how much hidden battery buffer remains, how far you can still drive, and whether the car bricks or enters limp mode. More buffer means less range anxiety.",
    icon: "battery_0_bar",
  },
};

// ---------------------------------------------------------------------------
// CSV parser
// Handles: quoted fields, escaped quotes (""), embedded commas, embedded newlines
// ---------------------------------------------------------------------------
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        // Peek ahead: "" is an escaped quote
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          // Closing quote
          inQuotes = false;
          i++;
        }
      } else {
        field += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ",") {
        row.push(field);
        field = "";
        i++;
      } else if (ch === "\r" && text[i + 1] === "\n") {
        row.push(field);
        field = "";
        rows.push(row);
        row = [];
        i += 2;
      } else if (ch === "\n") {
        row.push(field);
        field = "";
        rows.push(row);
        row = [];
        i++;
      } else {
        field += ch;
        i++;
      }
    }
  }

  // Flush the last field / row
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
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

function csvUrl(gid: number): string {
  return `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const TESTS_DIR = join(__dirname, "../src/data/tests");
  mkdirSync(TESTS_DIR, { recursive: true });

  interface SheetData {
    name: string;
    slug: string;
    headers: string[];
    rows: string[][];
  }

  const fetchedSheets: SheetData[] = [];
  const failedSheets: string[] = [];

  for (const [sheetName, gid] of Object.entries(SHEET_GIDS)) {
    const url = csvUrl(gid);
    console.log(`Fetching "${sheetName}" (gid=${gid})…`);

    let csvText: string;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`  FAILED: HTTP ${res.status} for "${sheetName}"`);
        failedSheets.push(sheetName);
        continue;
      }
      csvText = await res.text();
    } catch (err) {
      console.error(`  FAILED: fetch error for "${sheetName}" — ${err}`);
      failedSheets.push(sheetName);
      continue;
    }

    const parsed = parseCsv(csvText);
    const nonEmpty = parsed.filter((r) => r.some((c) => c.trim() !== ""));

    if (nonEmpty.length === 0) {
      console.error(`  FAILED: "${sheetName}" returned no data`);
      failedSheets.push(sheetName);
      continue;
    }

    const [headerRow, ...dataRows] = nonEmpty;
    const slug = slugify(sheetName);

    fetchedSheets.push({
      name: sheetName,
      slug,
      headers: headerRow,
      rows: dataRows,
    });

    console.log(`  OK — ${dataRows.length} rows`);
  }

  // SAFETY: abort entirely if ANY sheet failed — never write partial data
  if (failedSheets.length > 0) {
    console.error(`\nABORTING: ${failedSheets.length} sheet(s) failed to fetch: ${failedSheets.join(", ")}`);
    console.error("Existing data has NOT been modified.");
    console.error("Fix the GID values in SHEET_GIDS and try again.");
    process.exit(1);
  }

  if (fetchedSheets.length === 0) {
    console.error("ABORTING: No sheets were fetched.");
    process.exit(1);
  }

  // All sheets fetched successfully — safe to write files
  console.log(`\nAll ${fetchedSheets.length} sheets fetched successfully. Writing files…`);

  // Write individual sheet JSON files
  for (const sheetData of fetchedSheets) {
    const outPath = join(TESTS_DIR, `${sheetData.slug}.json`);
    writeFileSync(outPath, JSON.stringify(sheetData, null, 2));
    console.log(`  Written ${outPath} (${sheetData.rows.length} rows)`);
  }

  // Write meta.json
  const meta = fetchedSheets.map((s) => {
    const config = SHEET_CONFIG[s.name];
    return {
      name: s.name,
      slug: s.slug,
      icon: config?.icon ?? "table_chart",
      colName: config?.colName ?? "",
      lowerIsBetter: config?.lowerIsBetter ?? false,
      unit: config?.unit ?? "",
      description: config?.description ?? "",
    };
  });

  const metaPath = join(TESTS_DIR, "meta.json");
  writeFileSync(metaPath, JSON.stringify(meta, null, 2));
  console.log(`Written ${metaPath}`);

  // ---------------------------------------------------------------------------
  // Build vehicles.json
  // Detect vans from the Banana sheet pivot row ("Van" / "Trunk")
  // ---------------------------------------------------------------------------
  const vanNames = new Set<string>();
  const bananaSheet = fetchedSheets.find((s) => s.name === "Banana");
  if (bananaSheet) {
    const pivotIdx = bananaSheet.rows.findIndex(
      (r) => r[0] === "Van" && r[1] === "Trunk"
    );
    if (pivotIdx >= 0) {
      for (const row of bananaSheet.rows.slice(pivotIdx + 1)) {
        if (row[0]) vanNames.add(row[0]);
      }
    }
  }

  const vehicleMap = new Map<string, { type: "car" | "van"; tests: Set<string> }>();

  for (const sheet of fetchedSheets) {
    const testSlug = sheet.slug;
    for (const row of sheet.rows) {
      const name = row[0]?.trim();
      if (!name) continue;
      // Skip the Banana pivot header row itself
      if (sheet.name === "Banana" && name === "Van" && row[1] === "Trunk") {
        continue;
      }
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

  const vehiclesPath = join(__dirname, "../src/data/vehicles.json");
  writeFileSync(vehiclesPath, JSON.stringify(vehiclesJson, null, 2));
  console.log(`Written ${vehiclesPath} (${vehiclesJson.length} vehicles)`);

  console.log(
    `\nDone — imported ${fetchedSheets.length} sheets, ${vehiclesJson.length} vehicles.`
  );
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
