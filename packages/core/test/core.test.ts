import { describe, expect, it } from "vitest";

import { normalizeText, validateRut } from "../src/index.js";

describe("normalizeText", () => {
  it("normalizes accents and casing", () => {
    expect(normalizeText(" Biobío ")).toBe("biobio");
  });
});

describe("validateRut", () => {
  it("validates a RUT locally without identity lookup", () => {
    expect(validateRut("12.345.678-5")).toMatchObject({
      normalized: "12345678-5",
      valid: true,
    });
  });
});
