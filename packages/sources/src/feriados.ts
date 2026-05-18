import type { Holiday } from "@chilekit/core";
import { assertIsoDate, assertYear } from "@chilekit/core";

type FetchLike = typeof fetch;

const BUNDLED_HOLIDAYS: Record<number, Holiday[]> = {
  2026: [
    holiday("2026-01-01", "Año Nuevo", "civil", true),
    holiday("2026-04-03", "Viernes Santo", "religious", false),
    holiday("2026-04-04", "Sábado Santo", "religious", false),
    holiday("2026-05-01", "Día Nacional del Trabajo", "civil", true),
    holiday("2026-05-21", "Día de las Glorias Navales", "civil", false),
    holiday("2026-06-21", "Día Nacional de los Pueblos Indígenas", "civil", false),
    holiday("2026-06-29", "San Pedro y San Pablo", "religious", false),
    holiday("2026-07-16", "Día de la Virgen del Carmen", "religious", false),
    holiday("2026-08-15", "Asunción de la Virgen", "religious", false),
    holiday("2026-09-18", "Independencia Nacional", "civil", true),
    holiday("2026-09-19", "Día de las Glorias del Ejército", "civil", true),
    holiday("2026-10-12", "Encuentro de Dos Mundos", "civil", false),
    holiday("2026-10-31", "Día de las Iglesias Evangélicas y Protestantes", "religious", false),
    holiday("2026-11-01", "Día de Todos los Santos", "religious", false),
    holiday("2026-12-08", "Inmaculada Concepción", "religious", false),
    holiday("2026-12-25", "Navidad", "civil", true),
  ],
};

export interface GetHolidaysOptions {
  fetchImpl?: FetchLike;
  live?: boolean;
}

export async function getHolidays(
  year: number,
  options: GetHolidaysOptions = {},
): Promise<Holiday[]> {
  const validYear = assertYear(year);

  if (!options.live && BUNDLED_HOLIDAYS[validYear]) {
    return [...BUNDLED_HOLIDAYS[validYear]];
  }

  try {
    const fetchImpl = options.fetchImpl ?? fetch;
    const response = await fetchImpl(`https://api.boostr.cl/holidays/${validYear}.json`);

    if (!response.ok) {
      throw new Error(`Feriados API returned ${response.status}`);
    }

    const payload = (await response.json()) as unknown;
    const parsed = parseHolidayPayload(payload, validYear);

    if (parsed.length > 0) {
      return parsed;
    }
  } catch (error) {
    if (!BUNDLED_HOLIDAYS[validYear]) {
      throw error;
    }
  }

  return [...(BUNDLED_HOLIDAYS[validYear] ?? [])];
}

export async function getHoliday(
  date: string,
  options: GetHolidaysOptions = {},
): Promise<Holiday | undefined> {
  const isoDate = assertIsoDate(date);
  const year = Number(isoDate.slice(0, 4));
  const holidays = await getHolidays(year, options);

  return holidays.find((candidate) => candidate.date === isoDate);
}

function holiday(
  date: string,
  name: string,
  type: Holiday["type"],
  inalienable: boolean,
  notes?: string,
): Holiday {
  return {
    date,
    inalienable,
    name,
    notes,
    sourceId: "feriados",
    type,
  };
}

function parseHolidayPayload(payload: unknown, year: number): Holiday[] {
  if (Array.isArray(payload)) {
    return payload.map((item) => normalizeHolidayRecord(item, year)).filter(isHoliday);
  }

  if (!isRecord(payload)) {
    return [];
  }

  if (Array.isArray(payload.data)) {
    return payload.data.map((item) => normalizeHolidayRecord(item, year)).filter(isHoliday);
  }

  if (isRecord(payload.feriados)) {
    return Object.values(payload.feriados)
      .flatMap((items) => (Array.isArray(items) ? items : []))
      .map((item) => normalizeHolidayRecord(item, year))
      .filter(isHoliday);
  }

  return [];
}

function normalizeHolidayRecord(item: unknown, year: number): Holiday | undefined {
  if (!isRecord(item)) {
    return undefined;
  }

  const date =
    typeof item.date === "string"
      ? item.date
      : typeof item.fecha === "string"
        ? item.fecha
        : typeof item.mes === "number" && typeof item.dia === "number"
          ? `${year}-${String(item.mes).padStart(2, "0")}-${String(item.dia).padStart(2, "0")}`
          : undefined;
  const name =
    typeof item.title === "string"
      ? item.title
      : typeof item.nombre === "string"
        ? item.nombre
        : typeof item.descripcion === "string"
          ? item.descripcion
          : undefined;

  if (!date || !name) {
    return undefined;
  }

  return holiday(
    date.slice(0, 10),
    name,
    normalizeHolidayType(typeof item.type === "string" ? item.type : String(item.tipo ?? "civil")),
    Boolean(item.inalienable ?? item.irrenunciable),
    typeof item.extra === "string" ? item.extra : undefined,
  );
}

function normalizeHolidayType(value: string): Holiday["type"] {
  const normalized = value.toLowerCase();

  if (normalized.includes("relig")) {
    return "religious";
  }

  if (normalized.includes("banc")) {
    return "bank";
  }

  if (normalized.includes("elec")) {
    return "election";
  }

  return "civil";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isHoliday(value: Holiday | undefined): value is Holiday {
  return Boolean(value);
}
