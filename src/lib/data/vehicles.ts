import vehiclesData from "@/data/vehicles.json";
import type { Vehicle } from "@/lib/types";

const vehicles = (vehiclesData as Vehicle[]).filter(
  (v) => v.name && !v.name.startsWith("*") && !(v.name === "Van" && v.tests.includes("banana"))
);

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
  const seen = new Set<string>();
  return vehicles
    .filter((v) => {
      if (seen.has(v.slug)) return false;
      if (!terms.every((t) => v.name.toLowerCase().includes(t))) return false;
      seen.add(v.slug);
      return true;
    })
    .slice(0, limit);
}
