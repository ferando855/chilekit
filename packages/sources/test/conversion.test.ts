import { afterEach, describe, expect, it, vi } from "vitest";

import {
  adjustByUf,
  convertCurrency,
  getIndicatorValueOn,
  resolveCurrencyUnit,
} from "../src/index.js";

const series: Record<string, Array<[string, number]>> = {
  "dolar/2026": [
    ["2026-09-25T03:00:00.000Z", 965.71],
    ["2026-09-24T03:00:00.000Z", 960.1],
  ],
  "dolar/2025": [["2025-12-30T03:00:00.000Z", 940.5]],
  "dolar/2027": [],
  "euro/2026": [["2026-09-25T03:00:00.000Z", 1098.15]],
  "uf/2020": [["2020-03-15T03:00:00.000Z", 28538.6]],
  "uf/2026": [
    ["2026-10-09T03:00:00.000Z", 41100.5],
    ["2026-09-28T03:00:00.000Z", 41040.82],
  ],
  "utm/2020": [["2020-03-01T03:00:00.000Z", 50021]],
};

const requested: string[] = [];
const fetchImpl = async (url: URL | string | Request) => {
  const key = String(url).replace("https://mindicador.cl/api/", "");
  requested.push(key);
  const rows = series[key];

  return rows
    ? Response.json({ serie: rows.map(([fecha, valor]) => ({ fecha, valor })) })
    : new Response("", { status: 404 });
};

describe("resolveCurrencyUnit", () => {
  it("accepts common names", () => {
    expect(resolveCurrencyUnit("pesos")).toBe("clp");
    expect(resolveCurrencyUnit("USD")).toBe("dolar");
    expect(resolveCurrencyUnit("UF")).toBe("uf");
    expect(() => resolveCurrencyUnit("ipc")).toThrow(/no soportada/);
  });
});

describe("getIndicatorValueOn", () => {
  afterEach(() => {
    vi.useRealTimers();
    requested.length = 0;
  });

  it("uses the last published dollar on weekends and says so", async () => {
    vi.useFakeTimers({ now: new Date("2026-09-28T15:00:00Z"), toFake: ["Date"] });
    const rate = await getIndicatorValueOn("dolar", "2026-09-26", { fetchImpl });

    expect(rate).toMatchObject({ date: "2026-09-25", requestedDate: "2026-09-26", value: 965.71 });
  });

  it("looks into the previous year early in January", async () => {
    vi.useFakeTimers({ now: new Date("2027-01-05T15:00:00Z"), toFake: ["Date"] });
    const rate = await getIndicatorValueOn("dolar", "2026-01-02", { fetchImpl });

    expect(rate.date).toBe("2025-12-30");
    expect(requested).toEqual(["dolar/2026", "dolar/2025"]);
  });

  it("uses the monthly UTM for any day of the month", async () => {
    expect((await getIndicatorValueOn("utm", "2020-03-15", { fetchImpl })).value).toBe(50021);
  });

  it("never falls back for UF: the exact day must be published", async () => {
    await expect(getIndicatorValueOn("uf", "2026-10-28", { fetchImpl })).rejects.toThrow(
      /dia 9 del mes siguiente/,
    );
  });

  it("rejects future dates for the dollar", async () => {
    vi.useFakeTimers({ now: new Date("2026-09-28T15:00:00Z"), toFake: ["Date"] });
    await expect(getIndicatorValueOn("dolar", "2026-09-30", { fetchImpl })).rejects.toThrow(
      /futura/,
    );
  });
});

describe("convertCurrency", () => {
  it("converts UF to pesos rounding to whole pesos", async () => {
    const result = await convertCurrency(3.5, "uf", "clp", { date: "2026-09-28", fetchImpl });

    expect(result.result).toBe(143643);
    expect(result.rates).toHaveLength(1);
  });

  it("converts pesos to UF with 4 decimals", async () => {
    const result = await convertCurrency(1_000_000, "clp", "uf", { date: "2026-09-28", fetchImpl });

    expect(result.result).toBe(24.366);
  });

  it("crosses two foreign units through pesos", async () => {
    vi.useFakeTimers({ now: new Date("2026-09-28T15:00:00Z"), toFake: ["Date"] });
    const result = await convertCurrency(100, "dolar", "euro", { date: "2026-09-25", fetchImpl });
    vi.useRealTimers();

    expect(result.result).toBe(87.94);
    expect(result.rates.map((rate) => rate.code)).toEqual(["dolar", "euro"]);
  });

  it("rejects absurd amounts", async () => {
    await expect(convertCurrency(Number.NaN, "uf", "clp", { fetchImpl })).rejects.toThrow();
    await expect(convertCurrency(1e20, "uf", "clp", { fetchImpl })).rejects.toThrow();
  });
});

describe("adjustByUf", () => {
  it("indexes a debt by the UF variation", async () => {
    const result = await adjustByUf(1_000_000, "2020-03-15", "2026-09-28", { fetchImpl });

    expect(result).toMatchObject({ factor: 1.438081, result: 1_438_081, variationPercent: 43.81 });
  });

  it("rejects reversed ranges", async () => {
    await expect(adjustByUf(1, "2026-09-28", "2020-03-15", { fetchImpl })).rejects.toThrow(
      /anterior/,
    );
  });
});
