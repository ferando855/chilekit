import type { EconomicIndicator } from "@chilekit/core";
import { todayInChile, toMindicadorDate } from "@chilekit/core";

type FetchLike = typeof fetch;

export interface GetIndicatorOptions {
  date?: string;
  fetchImpl?: FetchLike;
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
  const fetchImpl = options.fetchImpl ?? fetch;
  const date = options.date;
  const endpoint = date
    ? `https://mindicador.cl/api/${code}/${toMindicadorDate(date)}`
    : `https://mindicador.cl/api/${code}`;
  const response = await fetchImpl(endpoint);

  if (!response.ok) {
    throw new Error(`mindicador.cl returned ${response.status} for ${code}`);
  }

  const payload = (await response.json()) as MindicadorResponse;
  const latest = payload.serie[0];

  if (!latest) {
    throw new Error(`mindicador.cl returned no serie values for ${code}`);
  }

  return {
    code: payload.codigo,
    date: latest.fecha.slice(0, 10),
    name: payload.nombre,
    sourceId: "mindicador",
    unit: payload.unidad_medida,
    value: latest.valor,
  };
}
