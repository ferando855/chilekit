import { describe, expect, it } from "vitest";

import { getChileTime, getNextTimeChange, getTimeChanges } from "../src/index.js";

describe("getChileTime", () => {
  it("reports the three Chilean time zones", () => {
    const zones = getChileTime(new Date("2026-09-28T15:00:00Z"));

    expect(zones.map((zone) => [zone.zone, zone.localDateTime, zone.utcOffset])).toEqual([
      ["continental", "2026-09-28T12:00:00", "-03:00"],
      ["magallanes", "2026-09-28T12:00:00", "-03:00"],
      ["pascua", "2026-09-28T10:00:00", "-05:00"],
    ]);
  });

  it("uses winter time in July", () => {
    const [continental, magallanes] = getChileTime(new Date("2026-07-15T15:00:00Z"));

    expect(continental?.utcOffset).toBe("-04:00");
    expect(magallanes?.utcOffset).toBe("-03:00");
  });
});

describe("getTimeChanges", () => {
  it("finds the 2026 changes as officially announced", () => {
    const changes = getTimeChanges(2026).filter((change) => change.zone === "continental");

    expect(changes).toEqual([
      expect.objectContaining({
        clocks: "atrasar",
        instantUtc: "2026-04-05T03:00:00.000Z",
        localAfter: "2026-04-04T23:00",
        localBefore: "2026-04-04T24:00",
      }),
      expect.objectContaining({
        clocks: "adelantar",
        instantUtc: "2026-09-06T04:00:00.000Z",
        localAfter: "2026-09-06T01:00",
        localBefore: "2026-09-05T24:00",
      }),
    ]);
  });

  it("shifts Easter Island at 22:00 local time and never Magallanes", () => {
    const changes = getTimeChanges(2026);

    expect(changes.find((change) => change.zone === "pascua")?.localBefore).toBe(
      "2026-04-04T22:00",
    );
    expect(changes.some((change) => change.zone === "magallanes")).toBe(false);
  });

  it("validates the year", () => {
    expect(() => getTimeChanges(1492)).toThrow();
  });
});

describe("getNextTimeChange", () => {
  it("crosses into the next year and is empty for Magallanes", () => {
    expect(getNextTimeChange("continental", new Date("2026-09-28T15:00:00Z"))?.instantUtc).toBe(
      "2027-04-04T03:00:00.000Z",
    );
    expect(getNextTimeChange("magallanes", new Date("2026-09-28T15:00:00Z"))).toBeUndefined();
  });
});
