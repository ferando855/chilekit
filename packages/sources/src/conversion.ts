import { assertIsoDate, roundTo, toChileDate, todayInChile } from "@chilekit/core";

import { resolveIndicatorCode } from "./economia.js";
import { type FetchJsonOptions, fetchJson } from "./http.js";

export const CURRENCY_UNITS = ["clp", "uf", "utm", "dolar", "euro"] as const;
export type CurrencyUnit = (typeof CURRENCY_UNITS)[number];

export const MAX_CONVERSION_AMOUNT = 1e15;

const UNIT_DECIMALS: Record<CurrencyUnit, number> = {
  clp: 0,
  dolar: 2,
  euro: 2,
  uf: 4,
  utm: 4,
};

// Dias hacia atras que se aceptan cuando una moneda no publica ese dia (fines de semana
// y feriados). Rige el ultimo valor publicado, como hace el Banco Central.
const MAX_FALLBACK_DAYS = 7;

export interface IndicatorValue {
  code: "uf" | "utm" | "dolar" | "euro";
  requestedDate: string;
  date: string;
  value: number;
  sourceId: "mindicador";
}

export interface ConversionResult {
  amount: number;
  from: CurrencyUnit;
  to: CurrencyUnit;
  result: number;
  date: string;
  rates: IndicatorValue[];
}

export interface AdjustmentResult {
  amount: number;
  from: string;
  to: string;
  result: number;
  factor: number;
  variationPercent: number;
  ufFrom: IndicatorValue;
  ufTo: IndicatorValue;
}

export function resolveCurrencyUnit(value: string): CurrencyUnit {
  const key = value.trim().toLowerCase();

  if (["clp", "peso", "pesos", "$"].includes(key)) {
    return "clp";
  }

  const code = resolveIndicatorCode(value);

  if (code === "uf" || code === "utm" || code === "dolar" || code === "euro") {
    return code;
  }

  throw new Error(
    `Unidad no soportada para conversion: ${value}. Usa ${CURRENCY_UNITS.join(", ")}.`,
  );
}

/**
 * Valor de UF, UTM, dolar o euro vigente en una fecha.
 * - UF: valor exacto del dia (se publica por adelantado hasta el dia 9 del mes siguiente).
 * - UTM: valor del mes.
 * - Dolar y euro: ultimo valor publicado en o antes de la fecha, hasta 7 dias atras.
 */
export async function getIndicatorValueOn(
  unit: Exclude<CurrencyUnit, "clp">,
  date: string = todayInChile(),
  options: FetchJsonOptions = {},
): Promise<IndicatorValue> {
  const requestedDate = assertIsoDate(date);
  const year = Number(requestedDate.slice(0, 4));

  if ((unit === "dolar" || unit === "euro") && requestedDate > todayInChile()) {
    throw new Error(`No hay valor de ${unit} para una fecha futura (${requestedDate}).`);
  }
  let observations = await getYearSeries(unit, year, options);

  if (requestedDate.slice(5) < "01-08" && (unit === "dolar" || unit === "euro")) {
    observations = [...observations, ...(await getYearSeries(unit, year - 1, options))];
  }

  const candidates = observations
    .filter((item) => item.date <= requestedDate)
    .sort((left, right) => right.date.localeCompare(left.date));
  const match = candidates[0];

  const acceptable =
    match &&
    (unit === "uf"
      ? match.date === requestedDate
      : unit === "utm"
        ? match.date.slice(0, 7) === requestedDate.slice(0, 7)
        : daysBetween(match.date, requestedDate) <= MAX_FALLBACK_DAYS);

  if (!match || !acceptable) {
    throw new Error(
      unit === "uf"
        ? `No hay valor de UF publicado para ${requestedDate} (se publica hasta el dia 9 del mes siguiente).`
        : `No hay valor de ${unit} publicado para ${requestedDate}.`,
    );
  }

  return {
    code: unit,
    date: match.date,
    requestedDate,
    sourceId: "mindicador",
    value: match.value,
  };
}

export async function convertCurrency(
  amount: number,
  from: CurrencyUnit,
  to: CurrencyUnit,
  options: FetchJsonOptions & { date?: string } = {},
): Promise<ConversionResult> {
  assertAmount(amount);
  const date = assertIsoDate(options.date ?? todayInChile());
  const rates: IndicatorValue[] = [];
  let pesos = amount;

  if (from !== "clp") {
    const rate = await getIndicatorValueOn(from, date, options);
    rates.push(rate);
    pesos = amount * rate.value;
  }

  let result = pesos;

  if (to !== "clp") {
    const rate =
      rates.find((item) => item.code === to) ?? (await getIndicatorValueOn(to, date, options));
    if (!rates.includes(rate)) {
      rates.push(rate);
    }
    result = pesos / rate.value;
  }

  return { amount, date, from, rates, result: roundTo(result, UNIT_DECIMALS[to]), to };
}

/**
 * Reajusta un monto en pesos segun la variacion de la UF entre dos fechas.
 * Es el mecanismo estandar para indexar deudas, arriendos y contratos a la inflacion.
 */
export async function adjustByUf(
  amount: number,
  from: string,
  to: string = todayInChile(),
  options: FetchJsonOptions = {},
): Promise<AdjustmentResult> {
  assertAmount(amount);
  const start = assertIsoDate(from);
  const end = assertIsoDate(to);

  if (end < start) {
    throw new Error(`La fecha final (${end}) es anterior a la inicial (${start}).`);
  }

  const ufFrom = await getIndicatorValueOn("uf", start, options);
  const ufTo = await getIndicatorValueOn("uf", end, options);
  const factor = ufTo.value / ufFrom.value;

  return {
    amount,
    factor: roundTo(factor, 6),
    from: start,
    result: roundTo(amount * factor, 0),
    to: end,
    ufFrom,
    ufTo,
    variationPercent: roundTo((factor - 1) * 100, 2),
  };
}

interface Observation {
  date: string;
  value: number;
}

async function getYearSeries(
  unit: Exclude<CurrencyUnit, "clp">,
  year: number,
  options: FetchJsonOptions,
): Promise<Observation[]> {
  if (!Number.isInteger(year) || year < 1977 || year > 2200) {
    throw new Error(`Año fuera de rango: ${year}`);
  }

  const payload = (await fetchJson(`https://mindicador.cl/api/${unit}/${year}`, options)) as {
    serie?: Array<{ fecha?: unknown; valor?: unknown }>;
  };

  if (!Array.isArray(payload?.serie)) {
    throw new Error(`mindicador.cl devolvio un formato inesperado para ${unit} ${year}`);
  }

  return payload.serie.flatMap((item) =>
    typeof item.fecha === "string" && typeof item.valor === "number" && Number.isFinite(item.valor)
      ? [{ date: toChileDate(item.fecha), value: item.valor }]
      : [],
  );
}

function assertAmount(amount: number): void {
  if (!Number.isFinite(amount) || Math.abs(amount) > MAX_CONVERSION_AMOUNT) {
    throw new Error(`Monto fuera de rango: ${amount}`);
  }
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}
