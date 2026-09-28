import { describe, expect, it } from "vitest";

import { getHoliday, getHolidays, getUf, searchOpenDatasets, searchSources } from "../src/index.js";

const offline = async (): Promise<Response> => {
  throw new Error("network disabled in tests");
};

describe("feriados", () => {
  it("serves bundled holidays without network", async () => {
    const holidays = await getHolidays(2026, { fetchImpl: offline });

    expect(holidays.find((holiday) => holiday.date === "2026-09-18")).toMatchObject({
      inalienable: true,
    });
  });

  it("parses the Boostr payload for non-bundled years", async () => {
    const holidays = await getHolidays(2027, {
      fetchImpl: async () =>
        Response.json({
          data: [
            {
              date: "2027-01-01",
              extra: "Civil e Irrenunciable",
              inalienable: true,
              title: "Año Nuevo",
              type: "Civil",
            },
            { date: "2027-03-26", inalienable: false, title: "Viernes Santo", type: "Religioso" },
          ],
          status: "success",
        }),
    });

    expect(holidays).toHaveLength(2);
    expect(holidays[1]).toMatchObject({ date: "2027-03-26", type: "religious" });
  });

  it("rejects invalid dates", async () => {
    await expect(getHoliday("2026-13-45", { fetchImpl: offline })).rejects.toThrow(/valid ISO/);
  });
});

describe("source search", () => {
  it("finds source manifests by tool intent", () => {
    expect(searchSources("ipc banco central").map((source) => source.id)).toContain(
      "banco-central",
    );
  });
});

describe("mindicador", () => {
  it("maps UF values from a mocked response", async () => {
    const indicator = await getUf({
      date: "2026-05-17",
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            codigo: "uf",
            nombre: "Unidad de fomento (UF)",
            serie: [{ fecha: "2026-05-17T04:00:00.000Z", valor: 40374.49 }],
            unidad_medida: "Pesos",
          }),
        ),
    });

    expect(indicator).toMatchObject({
      code: "uf",
      date: "2026-05-17",
      value: 40374.49,
    });
  });
});

describe("datos.gob.cl", () => {
  it("maps CKAN package search results from a mocked response", async () => {
    const results = await searchOpenDatasets("salud", {
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            result: {
              results: [
                {
                  id: "dataset-1",
                  license_title: "Creative Commons Attribution",
                  name: "salud-demo",
                  organization: { title: "Municipalidad Demo" },
                  resources: [{ format: "CSV", name: "recurso", url: "https://example.com/a.csv" }],
                  title: "Salud Demo",
                },
              ],
            },
            success: true,
          }),
        ),
    });

    expect(results[0]).toMatchObject({
      name: "salud-demo",
      organization: "Municipalidad Demo",
      title: "Salud Demo",
    });
  });
});
