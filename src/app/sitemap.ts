import type { MetadataRoute } from "next";
import vehicles from "@/data/vehicles.json";

const BASE_URL = "https://tb-data.tordar.no";

const AUTHORED_DATE = new Date();

const TEST_SLUGS = [
  "banana",
  "weight",
  "acceleration",
  "noise",
  "braking",
  "range",
  "sunday",
  "1000-km",
  "500-km",
  "degradation",
  "zero-mile",
  "arctic",
  "bangkok",
  "geilo",
] as const;

// Annotation/sentinel rows in the spreadsheet — not real vehicle pages.
const EXCLUDED_SLUGS = new Set(["--aftermarket-soundproofing", "car", "old-results"]);

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: AUTHORED_DATE },
    ...TEST_SLUGS.map((slug) => ({
      url: `${BASE_URL}/tests/${slug}`,
      lastModified: AUTHORED_DATE,
    })),
    { url: `${BASE_URL}/compare`, lastModified: AUTHORED_DATE },
  ];

  const seen = new Set<string>();
  const vehicleRoutes: MetadataRoute.Sitemap = (
    vehicles as Array<{ slug: string }>
  )
    .filter((v) => {
      if (EXCLUDED_SLUGS.has(v.slug)) return false;
      if (v.slug.startsWith("--")) return false;
      if (seen.has(v.slug)) return false;
      seen.add(v.slug);
      return true;
    })
    .map((v) => ({
      url: `${BASE_URL}/vehicles/${v.slug}`,
      lastModified: AUTHORED_DATE,
    }));

  return [...staticRoutes, ...vehicleRoutes];
}
