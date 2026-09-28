import { describe, expect, it } from "vitest";

import { addBusinessDays, countBusinessDays, getHoliday, getHolidays } from "../src/index.js";

const offline = async (): Promise<Response> => {
  throw new Error("network disabled in tests");
};
const base = { fetchImpl: offline };
const dates = (items: Array<{ date: string }>) => items.map((item) => item.date);

describe("regional and communal holidays", () => {
  it("are not included unless a location is given", async () => {
    const holidays = await getHolidays(2027, base);

    expect(dates(holidays)).not.toContain("2027-06-07");
    expect(dates(holidays)).not.toContain("2027-08-20");
    expect(dates(holidays)).not.toContain("2027-12-31");
  });

  it("adds June 7 for the whole Arica y Parinacota region", async () => {
    for (const location of [
      { region: "Arica y Parinacota" },
      { region: "XV" },
      { commune: "Putre" },
    ]) {
      const holiday = await getHoliday("2027-06-07", { ...base, ...location });

      expect(holiday).toMatchObject({
        legalBasis: "Ley 20.663",
        name: "Asalto y Toma del Morro de Arica",
        scope: "regional",
      });
    }
  });

  it("adds August 20 only for Chillán and Chillán Viejo, not the whole region", async () => {
    expect(await getHoliday("2026-08-20", { ...base, commune: "Chillán Viejo" })).toMatchObject({
      legalBasis: "Ley 20.768",
      scope: "communal",
    });
    expect(await getHoliday("2026-08-20", { ...base, region: "Ñuble" })).toBeUndefined();
    expect(await getHoliday("2026-08-20", { ...base, commune: "San Carlos" })).toBeUndefined();
  });

  it("adds the December 31 bank holiday on request", async () => {
    expect(await getHoliday("2026-12-31", { ...base, bank: true })).toMatchObject({
      scope: "bank",
      type: "bank",
    });
  });

  it("keeps results sorted and fails on ambiguous communes", async () => {
    const holidays = await getHolidays(2026, { ...base, bank: true, commune: "Chillán" });

    expect(dates(holidays)).toEqual([...dates(holidays)].sort());
    await expect(getHolidays(2026, { ...base, commune: "San" })).rejects.toThrow(/ambigua/);
  });
});

describe("business days with local holidays", () => {
  it("counts one day fewer in Arica around June 7", async () => {
    // Del viernes 4 al martes 8 de junio de 2027: lunes 7 y martes 8.
    expect((await countBusinessDays("2027-06-04", "2027-06-08", base)).businessDays).toBe(2);
    expect(
      (await countBusinessDays("2027-06-04", "2027-06-08", { ...base, region: "Arica" }))
        .businessDays,
    ).toBe(1);
  });

  it("moves a Chillán deadline past August 20", async () => {
    expect((await addBusinessDays("2026-08-19", 1, base)).date).toBe("2026-08-20");
    expect((await addBusinessDays("2026-08-19", 1, { ...base, commune: "Chillán" })).date).toBe(
      "2026-08-21",
    );
  });

  it("skips December 31 for banking deadlines", async () => {
    expect((await addBusinessDays("2026-12-30", 1, base)).date).toBe("2026-12-31");
    expect((await addBusinessDays("2026-12-30", 1, { ...base, bank: true })).date).toBe(
      "2027-01-04",
    );
  });
});
