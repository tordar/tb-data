import { describe, it, expect } from "vitest";
import { getTests, getTestBySlug, getTestMeta } from "./tests";

describe("getTests", () => {
  it("returns all test metadata entries", () => {
    const tests = getTests();
    expect(tests.length).toBeGreaterThan(0);
    expect(tests[0]).toHaveProperty("name");
    expect(tests[0]).toHaveProperty("slug");
    expect(tests[0]).toHaveProperty("icon");
  });
});

describe("getTestBySlug", () => {
  it("returns test sheet data for a valid slug", () => {
    const test = getTestBySlug("range");
    expect(test).not.toBeNull();
    expect(test!.name).toBe("Range");
    expect(test!.headers.length).toBeGreaterThan(0);
    expect(test!.rows.length).toBeGreaterThan(0);
  });

  it("returns null for an invalid slug", () => {
    expect(getTestBySlug("nonexistent-test")).toBeNull();
  });
});

describe("getTestMeta", () => {
  it("returns metadata for a valid slug", () => {
    const meta = getTestMeta("acceleration");
    expect(meta).not.toBeNull();
    expect(meta!.unit).toBe("s");
    expect(meta!.lowerIsBetter).toBe(true);
  });
});
