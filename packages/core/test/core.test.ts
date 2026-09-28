import { describe, expect, it } from "vitest";

import {
  assertIsoDate,
  formatRut,
  isIsoDate,
  normalizeText,
  toChileDate,
  validateRut,
} from "../src/index.js";

describe("normalizeText", () => {
  it("normalizes accents and casing", () => {
    expect(normalizeText(" Biobío ")).toBe("biobio");
  });
});

describe("dates", () => {
  it("accepts real calendar dates only", () => {
    expect(isIsoDate("2026-02-28")).toBe(true);
    expect(isIsoDate("2028-02-29")).toBe(true);
    expect(isIsoDate("2026-02-29")).toBe(false);
    expect(isIsoDate("2026-13-45")).toBe(false);
    expect(isIsoDate("2026-1-5")).toBe(false);
    expect(() => assertIsoDate("2026-04-31")).toThrow(/valid ISO date/);
  });

  it("converts instants to the Chilean calendar date", () => {
    // Medianoche en Chile, tanto en horario de verano (UTC-3) como de invierno (UTC-4).
    expect(toChileDate("2026-09-28T03:00:00.000Z")).toBe("2026-09-28");
    expect(toChileDate("2026-06-15T04:00:00.000Z")).toBe("2026-06-15");
    expect(toChileDate("2026-06-15T03:59:00.000Z")).toBe("2026-06-14");
  });
});

describe("validateRut", () => {
  it("validates a RUT locally without identity lookup", () => {
    expect(validateRut("12.345.678-5")).toMatchObject({
      formatted: "12.345.678-5",
      normalized: "12345678-5",
      valid: true,
    });
  });

  it("handles K check digits and leading zeros", () => {
    expect(validateRut("10.000.013-k")).toMatchObject({ normalized: "10000013-K", valid: true });
    expect(validateRut("0012345678-5")).toMatchObject({ normalized: "12345678-5", valid: true });
  });

  it("rejects malformed input instead of throwing", () => {
    expect(validateRut("1K2K").valid).toBe(false);
    expect(validateRut("").valid).toBe(false);
    expect(validateRut("K").valid).toBe(false);
    expect(validateRut("12.345.678-9").valid).toBe(false);
    expect(validateRut("1".repeat(10_000)).valid).toBe(false);
  });

  it("formats valid bodies with thousands separators", () => {
    expect(formatRut("123456785")).toBe("12.345.678-5");
    expect(() => formatRut("abc")).toThrow();
  });
});
