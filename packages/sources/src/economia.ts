import type { EconomicIndicator } from "@chilekit/core";
import {
  normalizeText,
  sanitizeText,
  toChileDate,
  todayInChile,
  toMindicadorDate,
} from "@chilekit/core";

import { type FetchJsonOptions, fetchJson } from "./http.js";

export const INDICATORS = {
  bitcoin: { name: "Bitcoin", unit: "Dólar" },
  dolar: { name: "Dólar observado", unit: "Pesos" },
  euro: { name: "Euro", unit: "Pesos" },
  imacec: { name: "Imacec", unit: "Porcentaje" },
  ipc: { name: "Índice de Precios al Consumidor (IPC)", unit: "Porcentaje" },
  ivp: { name: "Índice de valor promedio (IVP)", unit: "Pesos" },
  libra_cobre: { name: "Libra de cobre", unit: "Dólar" },
  tasa_desempleo: { name: "Tasa de desempleo", unit: "Porcentaje" },
  tpm: { name: "Tasa de Política Monetaria (TPM)", unit: "Porcentaje" },
  uf: { name: "Unidad de fomento (UF)", unit: "Pesos" },
  utm: { name: "Unidad Tributaria Mensual (UTM)", unit: "Pesos" },
} as const;

export type IndicatorCode = keyof typeof INDICATORS;

export const INDICATOR_CODES = Object.keys(INDICATORS) as IndicatorCode[];

const ALIASES: Record<string, IndicatorCode> = {
  cobre: "libra_cobre",
  desempleo: "tasa_desempleo",
  dolar_observado: "dolar",
  usd: "dolar",
  eur: "euro",
  btc: "bitcoin",
};

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

interface MindicadorLatestEntry {
  codigo?: string;
  nombre?: string;
  unidad_medida?: string;
  fecha?: string;
  valor?: number;
}

export function resolveIndicatorCode(value: string): IndicatorCode {
  const key = normalizeText(value).replace(/[\s-]+/g, "_");
  const code = key in INDICATORS ? (key as IndicatorCode) : ALIASES[key];

  if (!code) {
    throw new Error(`Indicador no soportado: ${value}. Disponibles: ${INDICATOR_CODES.join(", ")}`);
  }

  return code;
}

export async function getIndicator(
  indicator: string,
  options: GetIndicatorOptions = {},
): Promise<EconomicIndicator> {
  const date = options.date === "hoy" || options.date === "today" ? todayInChile() : options.date;

  return getMindicadorIndicator(resolveIndicatorCode(indicator), { ...options, date });
}

export async function getUf(options: GetIndicatorOptions = {}): Promise<EconomicIndicator> {
  return getIndicator("uf", options);
}

/**
 * Ultimo valor publicado de todos los indicadores soportados, en una sola consulta.
 */
export async function getLatestIndicators(
  options: FetchJsonOptions = {},
): Promise<EconomicIndicator[]> {
  const payload = (await fetchJson("https://mindicador.cl/api", options)) as Record<
    string,
    MindicadorLatestEntry | unknown
  >;

  return INDICATOR_CODES.flatMap((code) => {
    const entry = payload?.[code] as MindicadorLatestEntry | undefined;

    if (
      !entry ||
      typeof entry.valor !== "number" ||
      !Number.isFinite(entry.valor) ||
      !entry.fecha
    ) {
      return [];
    }

    return [
      {
        code,
        date: toChileDate(entry.fecha),
        name: INDICATORS[code].name,
        sourceId: "mindicador",
        unit: sanitizeText(String(entry.unidad_medida ?? INDICATORS[code].unit), {
          maxLength: 40,
          singleLine: true,
        }),
        value: entry.valor,
      },
    ];
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

  if (
    !latest ||
    typeof latest.valor !== "number" ||
    !Number.isFinite(latest.valor) ||
    typeof latest.fecha !== "string"
  ) {
    throw new Error(
      date
        ? `mindicador.cl no tiene valor de ${code} para ${date} (fin de semana, feriado o aun no publicado).`
        : `mindicador.cl returned no serie values for ${code}`,
    );
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
