import { describe, it, expect } from "vitest";
import { normalizeScore, computeWeightedRank } from "./scoring";

describe("normalizeScore", () => {
  it("normalizes higher-is-better", () => { expect(normalizeScore(500, 100, 600, false)).toBe(80); });
  it("normalizes lower-is-better", () => { expect(normalizeScore(200, 100, 600, true)).toBe(80); });
  it("returns 50 when min equals max", () => { expect(normalizeScore(100, 100, 100, false)).toBe(50); });
});

describe("computeWeightedRank", () => {
  it("ranks vehicles by weighted scores", () => {
    const vehicles = [
      { name: "A", slug: "a", scores: { range: 90, noise: 50 } },
      { name: "B", slug: "b", scores: { range: 60, noise: 90 } },
    ];
    const weights = { range: 80, noise: 20 };
    const ranked = computeWeightedRank(vehicles, weights);
    expect(ranked[0].name).toBe("A");
    expect(ranked[0].weightedScore).toBeGreaterThan(ranked[1].weightedScore);
  });
  it("handles zero-weight metrics", () => {
    const vehicles = [
      { name: "A", slug: "a", scores: { range: 10, noise: 90 } },
      { name: "B", slug: "b", scores: { range: 90, noise: 10 } },
    ];
    const ranked = computeWeightedRank(vehicles, { range: 0, noise: 100 });
    expect(ranked[0].name).toBe("A");
  });
});
