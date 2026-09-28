import type { Holiday } from "@chilekit/core";
import { assertIsoDate, todayInChile } from "@chilekit/core";

import { type GetHolidaysOptions, getHolidays } from "./feriados.js";

export const MAX_BUSINESS_DAYS = 1_000;
export const MAX_RANGE_DAYS = 3 * 366;

export interface BusinessDayOptions extends GetHolidaysOptions {
  /**
   * Cuenta el sabado como dia habil. Util para plazos que solo excluyen domingos y
   * festivos; por defecto se excluyen sabados, domingos y festivos.
   */
  saturdayIsBusinessDay?: boolean;
}

export interface BusinessDaysCount {
  from: string;
  to: string;
  businessDays: number;
  saturdayIsBusinessDay: boolean;
  holidaysExcluded: Holiday[];
}

export interface BusinessDaysAddition {
  from: string;
  days: number;
  date: string;
  saturdayIsBusinessDay: boolean;
  holidaysSkipped: Holiday[];
}

export interface NextHoliday {
  from: string;
  daysUntil: number;
  holiday: Holiday;
}

/**
 * Cuenta dias habiles desde el dia siguiente a `from` hasta `to`, ambos incluidos
 * en ese sentido: (from, to]. Es la forma usual de computar plazos.
 */
export async function countBusinessDays(
  from: string,
  to: string,
  options: BusinessDayOptions = {},
): Promise<BusinessDaysCount> {
  const start = assertIsoDate(from);
  const end = assertIsoDate(to);
  const span = diffDays(start, end);

  if (span < 0) {
    throw new Error(`La fecha final (${end}) es anterior a la inicial (${start}).`);
  }

  if (span > MAX_RANGE_DAYS) {
    throw new Error(`El rango maximo es de ${MAX_RANGE_DAYS} dias.`);
  }

  const calendar = new HolidayCalendar(options);
  const holidaysExcluded: Holiday[] = [];
  let businessDays = 0;

  for (let offset = 1; offset <= span; offset += 1) {
    const date = addDays(start, offset);
    const holiday = await calendar.holidayOn(date);

    if (holiday && !isWeekend(date, options)) {
      holidaysExcluded.push(holiday);
    }

    if (!holiday && !isWeekend(date, options)) {
      businessDays += 1;
    }
  }

  return {
    businessDays,
    from: start,
    holidaysExcluded,
    saturdayIsBusinessDay: Boolean(options.saturdayIsBusinessDay),
    to: end,
  };
}

/**
 * Fecha que resulta de sumar `days` dias habiles a `from` (sin contar `from`).
 */
export async function addBusinessDays(
  from: string,
  days: number,
  options: BusinessDayOptions = {},
): Promise<BusinessDaysAddition> {
  const start = assertIsoDate(from);

  if (!Number.isInteger(days) || days < 1 || days > MAX_BUSINESS_DAYS) {
    throw new Error(`days debe ser un entero entre 1 y ${MAX_BUSINESS_DAYS}.`);
  }

  const calendar = new HolidayCalendar(options);
  const holidaysSkipped: Holiday[] = [];
  let date = start;
  let remaining = days;

  while (remaining > 0) {
    date = addDays(date, 1);
    const holiday = await calendar.holidayOn(date);

    if (holiday && !isWeekend(date, options)) {
      holidaysSkipped.push(holiday);
    }

    if (!holiday && !isWeekend(date, options)) {
      remaining -= 1;
    }
  }

  return {
    date,
    days,
    from: start,
    holidaysSkipped,
    saturdayIsBusinessDay: Boolean(options.saturdayIsBusinessDay),
  };
}

export async function isBusinessDay(date: string, options: BusinessDayOptions = {}) {
  const isoDate = assertIsoDate(date);

  return !isWeekend(isoDate, options) && !(await new HolidayCalendar(options).holidayOn(isoDate));
}

/**
 * Proximo feriado en o despues de `from` (por defecto, hoy en Chile).
 */
export async function getNextHoliday(
  from: string = todayInChile(),
  options: GetHolidaysOptions = {},
): Promise<NextHoliday> {
  const start = assertIsoDate(from);
  const year = Number(start.slice(0, 4));

  for (const candidateYear of [year, year + 1]) {
    const holidays = await getHolidays(candidateYear, options);
    const next = holidays
      .filter((holiday) => holiday.date >= start)
      .sort((left, right) => left.date.localeCompare(right.date))[0];

    if (next) {
      return { daysUntil: diffDays(start, next.date), from: start, holiday: next };
    }
  }

  throw new Error(`No hay feriados registrados despues de ${start}.`);
}

class HolidayCalendar {
  private readonly years = new Map<number, Promise<Map<string, Holiday>>>();

  constructor(private readonly options: GetHolidaysOptions) {}

  async holidayOn(date: string): Promise<Holiday | undefined> {
    const year = Number(date.slice(0, 4));
    let holidays = this.years.get(year);

    if (!holidays) {
      holidays = getHolidays(year, this.options).then(
        (items) => new Map(items.map((item) => [item.date, item])),
      );
      this.years.set(year, holidays);
    }

    return (await holidays).get(date);
  }
}

function isWeekend(date: string, options: BusinessDayOptions): boolean {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();

  return day === 0 || (day === 6 && !options.saturdayIsBusinessDay);
}

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);

  return value.toISOString().slice(0, 10);
}

function diffDays(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}
