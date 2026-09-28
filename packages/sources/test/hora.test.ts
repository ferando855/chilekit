import { describe, expect, it } from "vitest";

import { getTimeFor, zoneForLocation } from "../src/index.js";

describe("zoneForLocation", () => {
  it.each([
    [{}, "continental"],
    [{ region: "Biobío" }, "continental"],
    [{ region: "Magallanes" }, "magallanes"],
    [{ commune: "Punta Arenas" }, "magallanes"],
    [{ commune: "Antártica" }, "magallanes"],
    [{ commune: "Isla de Pascua" }, "pascua"],
    [{ commune: "Juan Fernández" }, "continental"],
    [{ region: "Valparaíso" }, "continental"],
  ])("%j -> %s", (location, zone) => {
    expect(zoneForLocation(location)).toBe(zone);
  });

  it("fails on ambiguous communes", () => {
    expect(() => zoneForLocation({ commune: "San" })).toThrow(/ambigua/);
  });
});

describe("getTimeFor", () => {
  it("includes the next change for the zone", () => {
    const time = getTimeFor({ commune: "Isla de Pascua" }, new Date("2026-09-28T15:00:00Z"));

    expect(time).toMatchObject({ localDateTime: "2026-09-28T10:00:00", zone: "pascua" });
    expect(time.nextChange?.localBefore).toBe("2027-04-03T22:00");
  });
});
