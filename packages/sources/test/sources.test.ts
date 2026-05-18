import { describe, expect, it } from "vitest";

import { getUf, listCommunesByRegion, searchOpenDatasets, searchSources } from "../src/index.js";

describe("territorio", () => {
  it("lists communes by region ignoring accents", () => {
    const communes = listCommunesByRegion("Biobio");

    expect(communes.length).toBeGreaterThan(0);
    expect(communes.map((commune) => commune.name)).toContain("Concepción");
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
