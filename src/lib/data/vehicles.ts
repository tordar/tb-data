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
