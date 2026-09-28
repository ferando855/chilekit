import { describe, expect, it } from "vitest";

import { addBusinessDays, countBusinessDays, getNextHoliday, isBusinessDay } from "../src/index.js";

const offline = async (): Promise<Response> => {
  throw new Error("network disabled in tests");
};
const options = { fetchImpl: offline };

describe("countBusinessDays", () => {
  it("excludes weekends and holidays around Fiestas Patrias 2026", async () => {
    // 15, 16, 17 y 21 de septiembre; el 18 es feriado y el 19 cae sabado.
    const result = await countBusinessDays("2026-09-14", "2026-09-21", options);

    expect(result.businessDays).toBe(4);
    expect(result.holidaysExcluded.map((holiday) => holiday.date)).toEqual(["2026-09-18"]);
  });

  it("lists Saturday holidays when Saturdays count as business days", async () => {
    const result = await countBusinessDays("2026-09-14", "2026-09-21", {
      ...options,
      saturdayIsBusinessDay: true,
    });

    expect(result.businessDays).toBe(4);
    expect(result.holidaysExcluded.map((holiday) => holiday.date)).toEqual([
      "2026-09-18",
      "2026-09-19",
    ]);
  });

  it("returns zero for the same day and validates ranges", async () => {
    expect((await countBusinessDays("2026-10-01", "2026-10-01", options)).businessDays).toBe(0);
    await expect(countBusinessDays("2026-10-02", "2026-10-01", options)).rejects.toThrow(
      /anterior/,
    );
    await expect(countBusinessDays("2026-01-01", "2030-01-01", options)).rejects.toThrow(/maximo/);
  });
});

describe("addBusinessDays", () => {
  it("skips the long weekend", async () => {
    const result = await addBusinessDays("2026-09-17", 1, options);

    expect(result.date).toBe("2026-09-21");
    expect(result.holidaysSkipped.map((holiday) => holiday.date)).toEqual(["2026-09-18"]);
  });

  it("crosses into the next year using bundled 2027 data", async () => {
    // 31 dic (1), 1 ene feriado, fin de semana, 4 ene (2), 5 ene (3).
    expect((await addBusinessDays("2026-12-30", 3, options)).date).toBe("2027-01-05");
  });

  it("rejects out-of-range day counts", async () => {
    await expect(addBusinessDays("2026-01-01", 0, options)).rejects.toThrow();
    await expect(addBusinessDays("2026-01-01", 5_000, options)).rejects.toThrow();
  });
});

describe("holiday helpers", () => {
  it("finds the next holiday, including across years", async () => {
    expect(await getNextHoliday("2026-09-28", options)).toMatchObject({
      daysUntil: 14,
      holiday: { date: "2026-10-12" },
    });
    expect((await getNextHoliday("2026-12-26", options)).holiday.date).toBe("2027-01-01");
    expect((await getNextHoliday("2026-09-18", options)).daysUntil).toBe(0);
  });

  it("checks single business days", async () => {
    expect(await isBusinessDay("2026-09-18", options)).toBe(false);
    expect(await isBusinessDay("2026-09-26", options)).toBe(false);
    expect(await isBusinessDay("2026-09-28", options)).toBe(true);
  });
});
