import { describe, it, expect } from "vitest";
import { parseNum } from "./parsing";

describe("parseNum", () => {
  it("parses plain numbers", () => { expect(parseNum("42")).toBe(42); expect(parseNum("3.5")).toBe(3.5); });
  it("handles plus notation", () => { expect(parseNum("10+1")).toBe(11); expect(parseNum("2+15")).toBe(17); });
  it("handles time notation", () => { expect(parseNum("12:30")).toBe(750); });
  it("handles comma decimals", () => { expect(parseNum("3,5")).toBe(3.5); });
  it("returns null for empty/non-numeric", () => { expect(parseNum("")).toBeNull(); expect(parseNum("N/A")).toBeNull(); });
});
