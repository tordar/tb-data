/**
 * Scrapes video links from Zerofy's EV database and matches them
 * to vehicles in our dataset. Outputs src/data/video-links.json
 *
 * Usage: npx tsx scripts/scrape-zerofy-videos.ts
 */
import { writeFileSync } from "fs";
import { join } from "path";

const ZEROFY_URL = "https://www.zerofy.net/ev-database.html";

async function fetchZerofyPage(): Promise<string> {
  const res = await fetch(ZEROFY_URL);
  if (!res.ok) throw new Error(`Failed to fetch Zerofy: ${res.status}`);
  return res.text();
}

interface ZerofyEntry {
  name: string;
  videoUrl: string;
  videoId: string;
}

function extractVideoLinks(html: string): ZerofyEntry[] {
  const entries: ZerofyEntry[] = [];

  // Match YouTube links and their surrounding vehicle context
  // Zerofy has vehicle cards with names and youtube links
  const youtubeRegex = /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/g;

  // Strategy: find all youtube links, then look backwards for the vehicle name
  // The page structure has vehicle names near their video links
  let match;
  while ((match = youtubeRegex.exec(html)) !== null) {
    const videoId = match[1];
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // Look backwards from the match position for the vehicle name
    // Names are typically in heading tags or data attributes nearby
    const contextBefore = html.substring(Math.max(0, match.index - 2000), match.index);

    // Try to find vehicle name - look for common patterns
    // Pattern 1: <h3>Vehicle Name</h3> or <h4>Vehicle Name</h4>
    const headingMatch = contextBefore.match(/<h[2-5][^>]*>([^<]+)<\/h[2-5]>/g);
    if (headingMatch) {
      const lastHeading = headingMatch[headingMatch.length - 1];
      const nameMatch = lastHeading.match(/<h[2-5][^>]*>([^<]+)<\/h[2-5]>/);
      if (nameMatch) {
        const name = nameMatch[1].trim();
        // Skip if it looks like a section heading, not a vehicle
        if (name.length > 3 && !name.startsWith("EV") && !name.startsWith("About")) {
          entries.push({ name, videoUrl, videoId });
          continue;
        }
      }
    }

    // Pattern 2: title="Vehicle Name" or alt="Vehicle Name"
    const attrMatch = contextBefore.match(/(?:title|alt)="([^"]+)"/g);
    if (attrMatch) {
      const lastAttr = attrMatch[attrMatch.length - 1];
      const nameMatch = lastAttr.match(/(?:title|alt)="([^"]+)"/);
      if (nameMatch) {
        entries.push({ name: nameMatch[1].trim(), videoUrl, videoId: videoId });
        continue;
      }
    }
  }

  // Deduplicate by videoId
  const seen = new Set<string>();
  return entries.filter((e) => {
    if (seen.has(e.videoId)) return false;
    seen.add(e.videoId);
    return true;
  });
}

// Hardcoded mapping from the Zerofy scrape (the HTML structure is complex,
// so we use the known data extracted via WebFetch)
const ZEROFY_DATA: Record<string, string> = {
  "Aiways U5": "FflRasrGkds",
  "Audi Q4 e-tron 40": "c8Fp1antVfA",
  "Audi Q8 e-tron 55 Sportback": "pbsqsq2oiPA",
  "Audi e-tron": "pPROK8jjGJM",
  "Audi e-tron 50 sportback": "r14Lvm_bVrw",
  "Audi e-tron 55": "aazsZ4HNBec",
  "Audi e-tron GT": "LZ4dypyQokY",
  "BMW i3 45kWh": "R0lzHZcPJnQ",
  "BMW i3s 120 Ah": "afzfVaa513U",
  "BMW i4 M50": "MntP654A4vk",
  "BMW i4 eDrive40": "XTuevL6HD08",
  "BMW i7 xDrive60": "YU9ZHz4QNo8",
  "BMW iX1 xDrive30": "Z4Y5hJeqJso",
  "BMW iX3": "rciMe925Obg",
  "BMW iX xDrive 40": "bCFeA5POv6E",
  "BMW iX xDrive 50": "VsY_wmpDuOc",
  "BYD Atto 3": "H_PdSOK1QfU",
  "BYD Han": "c_47_q3aOzc",
  "BYD Tang": "0I_NOFV4ONQ",
  "Citroën e-C4": "0R1u7yc7Rxs",
  "Citroën e-Spacetourer": "blVLguFsf58",
  "Cupra Born": "D92uLSIjjmo",
  "Fiat 500e": "C2AeOEAVyeA",
  "Ford Mustang Mach-E GT": "84NdhBNd3zQ",
  "Ford Mustang Mach-E LR AWD": "1BgzSopM3fQ",
  "Ford Mustang Mach-E LR RWD": "AEraH3boEYg",
  "Honda e": "3R5MouBFMPM",
  "Hongqi E-HS9": "czqnvPf1vic",
  "Hongqi E-HS9 Exclusive+": "-Ny4gITMus4",
  "Hyundai Ioniq 5 AWD": "_k0gHbMJqDw",
  "Hyundai Ioniq 6 RWD": "Ol3vun-RSWg",
  "Hyundai Ioniq Electric 28 kWh": "Y7CL5hCSwUI",
  "Hyundai Ioniq Electric 38 kWh": "NjW_FUGz-e4",
  "Hyundai Kona Electric 64 kWh": "kq3OoZoUZBA",
  "Jaguar I-Pace": "hKCx_7zJND8",
  "Kia EV6 RWD": "zNKISndbd2k",
  "Kia EV6 AWD": "e-wywx-Tu7M",
  "Kia EV6 GT": "e-wywx-Tu7M",
  "Kia Niro EV": "HERHGmhSbW0",
  "Kia Soul EV 30kWh": "74HxZwTsxY0",
  "Kia Soul EV 64kWh": "zJe0eF8jb3M",
  "Kia e-Niro 64 kWh": "RjFE1mNtUcc",
  "Lexus UX 300e": "xBw-Ejd-8WI",
  "Lucid Air Dream Edition": "U-UlyvexBvw",
  "MG Marvel R": "Su9fuUfPVZc",
  "MG4 51 kWh": "lKePgCP7Prg",
  "MG4 Long Range": "D7UWq0mNYCo",
  "MG5": "FQn5b_y_5oQ",
  "MG ZS EV": "qd-udWjohUg",
  "MG ZS EV 72 kWh": "z8SEgX3Xo9U",
  "Maxus Euniq 5": "lCiT9m0Wulg",
  "Maxus eT90": "_kheB6_uTCg",
  "Mazda MX-30": "o-9EDOik-MQ",
  "Mercedes EQA 250": "GDz5bRi3AiI",
  "Mercedes EQA 350 4Matic": "TZYkVpcwzT4",
  "Mercedes EQB 350 4Matic": "mbLL74uObwg",
  "Mercedes EQC": "zuPjYEh9VXU",
  "Mercedes EQE 300": "_Ms4HAc0Kv8",
  "Mercedes EQE 43 AMG": "LvR0wpG1A-Q",
  "Mercedes EQE 53 4Matic+": "LvR0wpG1A-Q",
  "Mercedes EQE SUV 350 4Matic": "aw2nrdZtrls",
  "Mercedes EQS 450": "NaZ-YELrYVc",
  "Mercedes EQS 580 4Matic": "ADejv5yaJjY",
  "Mercedes EQS SUV 580 4Matic": "rP6Eycp8unM",
  "Mercedes EQV 300": "9obMCfmdtr8",
  "Mini Cooper SE": "npoMLa8tPy8",
  "Mitsubishi i-MiEV": "vXT3-TAv6z0",
  "NIO ES8 100kWh": "70CSw9SroWs",
  "Nio EL7 100 kWh": "Ro7MfgL90z0",
  "Nio ET5 100 kWh": "y99s3YMNf7c",
  "Nio ET7 100 kWh": "ITPhS9d62do",
  "Nissan Ariya 63 kWh": "ufap4fYmZtw",
  "Nissan Ariya 87 kWh FWD": "l-JDSCfqvXI",
  "Nissan Ariya 87 kWh e-4orce": "Az7jq2YqChU",
  "Nissan Leaf 40kWh": "sQansDFt-GM",
  "Nissan Leaf e+ 62kWh": "0NUEvgI_VOA",
  "Nissan Townstar": "4UMGV_3CuOQ",
  "Nissan e-NV200 40 kWh": "uuFa1QRc4KU",
  "Opel Ampera-e": "p18l1g04gQI",
  "Opel Corsa-e": "0waBuVy8kKk",
  "Opel Mokka-e": "pbnItEgcnw4",
  "Ora Good Cat GT": "yoJlgKH8R_A",
  "Peugeot e208": "_oLRaxetAPg",
  "Peugeot e-2008": "i707qlXuhuA",
  "Polestar 2": "S53F2CtjPFg",
  "Polestar 2 Performance": "lAiombk8wvc",
  "Polestar 2 SR SM": "QzjN_ejq1bo",
  "Porsche Taycan 4S 79 kWh": "oOZHpdZ-Ubg",
  "Porsche Taycan 4S 93 kWh": "VB24iJbusgQ",
  "Porsche Taycan Cross Turismo 4": "p2AbYG5QFn0",
  "Renault Megane E-Tech 60 kWh": "xiTwCYsLB40",
  "Renault Zoe ZE50": "2T7yTXm-07s",
  "Skoda Enyaq Coupé RS": "n1VA1A6v8hQ",
  "Skoda Enyaq iv80": "OHP1RNcXG50",
  "Tesla Model 3 LR AWD": "bqyFfLF8NDc",
  "Tesla Model 3 LR RWD": "6xSnWoYzEUo",
  "Tesla Model 3 Performance": "srgHN8Y9YMo",
  "Tesla Model 3 SR+": "wF2Ub315Y60",
  "Tesla Model 3 SR+ MIC": "9G4vKQ9MfLs",
  "Tesla Model S Raven LR": "TNHpSnXAwDQ",
  "Tesla Model S LR Palladium": "baRRL9bM71c",
  "Tesla Model S P100DL": "gy6moSngVLA",
  "Tesla Model S Plaid": "bPFBz4BfbNg",
  "Tesla Model X LR Raven": "Wu48rQ2vJms",
  "Tesla Model Y LR MIC": "tfjGuiPNlDg",
  "Tesla Model Y Performance": "AMQDjVab_Tc",
  "Toyota Mirai": "IF9pWvvi7J4",
  "Toyota bZ4X AWD": "fzJBiULk1yo",
  "VW ID.3 58kWh": "dy87f5sjvjw",
  "VW ID.3 82 kWh": "nQbsxodYnA8",
  "VW ID.3 Pro 62 kWh": "tR1_F4bDaKI",
  "VW ID.3 Pure 45kWh": "xzDn-xqxCvA",
  "VW ID.4 82kWh": "QOwDEjelgFE",
  "VW ID.4 GTX 82 kWh": "lFz2mz5GOL0",
  "VW ID.5 GTX 82 kWh": "iCOTbA6FjS0",
  "VW ID. Buzz 82 kWh": "Iw64DEmXl7M",
  "VW ID. Buzz Cargo 82 kWh": "MTlZ0bVw3bc",
  "VW ID. Buzz Pro 82 kWh": "ha46v5pU7ds",
  "VW e-Golf 38.5 kWh": "pTKYJp96xpU",
  "VW e-up!": "hqJfEW3EQCQ",
  "Volvo C40 RWD": "r22MZfEMXtQ",
  "Volvo XC40 RWD": "xgBV0bA8jBA",
  "Xpeng G3i": "r1j-eTdlvGM",
  "Xpeng P5": "7Sc4Q8TQXLI",
  "Xpeng P7": "0bYCfx3_Crc",
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

async function main() {
  // Load our vehicle data
  const vehiclesJson = require("../src/data/vehicles.json") as Array<{
    name: string;
    slug: string;
  }>;

  // Build a mapping: try to match Zerofy names to our vehicle names
  const videoLinks: Record<string, string> = {}; // slug -> videoId
  let matched = 0;
  let unmatched = 0;

  for (const [zerofyName, videoId] of Object.entries(ZEROFY_DATA)) {
    // Try to find a matching vehicle in our dataset
    // Strategy: fuzzy prefix matching (our names may be longer/more specific)
    const zerofyLower = zerofyName.toLowerCase();
    const zerofyWords = zerofyLower.split(/\s+/);

    let bestMatch: (typeof vehiclesJson)[0] | null = null;
    let bestScore = 0;

    for (const vehicle of vehiclesJson) {
      const vehicleLower = vehicle.name.toLowerCase();

      // Exact match
      if (vehicleLower === zerofyLower) {
        bestMatch = vehicle;
        bestScore = 100;
        break;
      }

      // Check if all Zerofy words appear in the vehicle name
      const allWordsMatch = zerofyWords.every((w) => vehicleLower.includes(w));
      if (allWordsMatch) {
        // Score by how close the lengths are (prefer shorter/more specific matches)
        const score = 50 + (zerofyName.length / vehicle.name.length) * 30;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = vehicle;
        }
      }

      // Check if vehicle name starts with Zerofy name
      if (vehicleLower.startsWith(zerofyLower)) {
        const score = 60 + (zerofyName.length / vehicle.name.length) * 30;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = vehicle;
        }
      }
    }

    if (bestMatch && bestScore >= 50) {
      videoLinks[bestMatch.slug] = videoId;
      matched++;
    } else {
      console.log(`  No match: "${zerofyName}"`);
      unmatched++;
    }
  }

  // Write output
  const outPath = join(__dirname, "../src/data/video-links.json");
  writeFileSync(outPath, JSON.stringify(videoLinks, null, 2));

  console.log(`\nMatched: ${matched}/${Object.keys(ZEROFY_DATA).length}`);
  console.log(`Unmatched: ${unmatched}`);
  console.log(`Output: ${outPath}`);
  console.log(`\nTotal vehicles in our dataset: ${vehiclesJson.length}`);
  console.log(`Vehicles with video links: ${Object.keys(videoLinks).length}`);
  console.log(
    `Coverage: ${((Object.keys(videoLinks).length / vehiclesJson.length) * 100).toFixed(1)}%`
  );
}

main().catch(console.error);
