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
