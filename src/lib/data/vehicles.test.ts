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
