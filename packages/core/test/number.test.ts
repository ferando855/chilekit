import { describe, expect, it } from "vitest";

import { parseChileanNumber, roundTo } from "../src/index.js";

describe("parseChileanNumber", () => {
  it.each([
    ["1.500.000", 1_500_000],
    ["$ 1.500.000", 1_500_000],
    ["3,5", 3.5],
    ["1.234,56", 1234.56],
    ["1500.5", 1500.5],
    ["1.500", 1500],
    ["0,25", 0.25],
    ["-2,5", -2.5],
    ["42", 42],
  ])("parses %s", (input, expected) => {
    expect(parseChileanNumber(input)).toBe(expected);
  });

  it.each(["", "abc", "1,234.56", "1..2", "12,3,4", "1e9", "9".repeat(40)])(
    "rejects %j",
    (input) => {
      expect(() => parseChileanNumber(input)).toThrow();
    },
  );
});

describe("roundTo", () => {
  it("rounds half away from binary noise", () => {
    expect(roundTo(1.005, 2)).toBe(1.01);
    expect(roundTo(143642.87, 0)).toBe(143643);
  });
});
