export function fmt(n: number, unit: string): string {
  if (unit === "banana") return `${n} 🍌`;
  if (n % 1 === 0) return `${n} ${unit}`;
  return `${n.toFixed(1)} ${unit}`;
}

export function vehicleSlug(name: string): string {
  return name.toLowerCase().replace(/['']/g, "").replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}
