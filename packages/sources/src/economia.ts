import type { EconomicIndicator } from "@chilekit/core";
import { sanitizeText, toChileDate, todayInChile, toMindicadorDate } from "@chilekit/core";

import { type FetchJsonOptions, fetchJson } from "./http.js";

export interface GetIndicatorOptions extends FetchJsonOptions {
  date?: string;
}

interface MindicadorResponse {
  codigo: string;
  nombre: string;
  unidad_medida: string;
  serie: Array<{
    fecha: string;
    valor: number;
  }>;
}

export async function getUf(options: GetIndicatorOptions = {}): Promise<EconomicIndicator> {
  return getMindicadorIndicator("uf", {
    ...options,
    date: options.date === "hoy" || options.date === "today" ? todayInChile() : options.date,
  });
}

export async function getMindicadorIndicator(
  code: string,
  options: GetIndicatorOptions = {},
): Promise<EconomicIndicator> {
  if (!/^[a-z_]{1,32}$/.test(code)) {
    throw new Error(`Codigo de indicador invalido: ${code}`);
  }

  const date = options.date;
  const endpoint = date
    ? `https://mindicador.cl/api/${code}/${toMindicadorDate(date)}`
    : `https://mindicador.cl/api/${code}`;
  const payload = (await fetchJson(endpoint, options)) as MindicadorResponse;
  const latest = Array.isArray(payload?.serie) ? payload.serie[0] : undefined;

  if (!latest || typeof latest.valor !== "number" || !Number.isFinite(latest.valor)) {
    throw new Error(`mindicador.cl returned no serie values for ${code}`);
  }

  return {
    code,
    date: toChileDate(latest.fecha),
    name: sanitizeText(String(payload.nombre ?? code), { maxLength: 100, singleLine: true }),
    sourceId: "mindicador",
    unit: sanitizeText(String(payload.unidad_medida ?? ""), { maxLength: 40, singleLine: true }),
    value: latest.valor,
  };
}
