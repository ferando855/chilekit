import { describe, expect, it } from "vitest";

import { getIndicator, getLatestIndicators, resolveIndicatorCode } from "../src/index.js";

describe("indicators", () => {
  it("resolves codes and aliases", () => {
    expect(resolveIndicatorCode("Dólar")).toBe("dolar");
    expect(resolveIndicatorCode("cobre")).toBe("libra_cobre");
    expect(resolveIndicatorCode("UTM")).toBe("utm");
    expect(() => resolveIndicatorCode("peso argentino")).toThrow(/no soportado/);
  });

  it("requests the dated endpoint and maps the value", async () => {
    let requested = "";
    const indicator = await getIndicator("dolar", {
      date: "2026-09-25",
      fetchImpl: async (url) => {
        requested = String(url);
        return Response.json({
          codigo: "dolar",
          nombre: "Dólar observado",
          serie: [{ fecha: "2026-09-25T03:00:00.000Z", valor: 912.34 }],
          unidad_medida: "Pesos",
        });
      },
    });

    expect(requested).toBe("https://mindicador.cl/api/dolar/25-09-2026");
    expect(indicator).toMatchObject({ code: "dolar", date: "2026-09-25", value: 912.34 });
  });

  it("explains missing values for dates without publication", async () => {
    await expect(
      getIndicator("dolar", {
        date: "2026-09-26",
        fetchImpl: async () => Response.json({ codigo: "dolar", serie: [] }),
      }),
    ).rejects.toThrow(/fin de semana, feriado/);
  });

  it("maps the latest values of every supported indicator", async () => {
    const indicators = await getLatestIndicators({
      fetchImpl: async () =>
        Response.json({
          dolar: { fecha: "2026-09-25T03:00:00.000Z", unidad_medida: "Pesos", valor: 912.34 },
          dolar_intercambio: { fecha: "2014-11-13T03:00:00.000Z", valor: 758.87 },
          uf: { fecha: "2026-09-27T03:00:00.000Z", unidad_medida: "Pesos", valor: 41032.64 },
          utm: { fecha: "2026-09-01T04:00:00.000Z", valor: "no es numero" },
          version: "1.7.0",
        }),
    });

    expect(indicators.map((item) => item.code)).toEqual(["dolar", "uf"]);
  });
});
