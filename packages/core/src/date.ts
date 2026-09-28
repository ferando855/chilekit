const CHILE_TIME_ZONE = "America/Santiago";

const chileDateFormatter = new Intl.DateTimeFormat("en-CA", {
  day: "2-digit",
  month: "2-digit",
  timeZone: CHILE_TIME_ZONE,
  year: "numeric",
});

export function todayInChile(): string {
  return toChileDate(new Date());
}

export function currentYearInChile(): number {
  return Number(todayInChile().slice(0, 4));
}

/**
 * Fecha calendario (YYYY-MM-DD) en Chile continental para un instante dado.
 */
export function toChileDate(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${String(value)}`);
  }

  return chileDateFormatter.format(date);
}

export function isIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return false;
  }

  const [, year, month, day] = match.map(Number) as [number, number, number, number];
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

export function assertIsoDate(value: string): string {
  if (!isIsoDate(value)) {
    throw new Error(`Expected a valid ISO date YYYY-MM-DD, got: ${value}`);
  }

  return value;
}

export function assertYear(value: number): number {
  if (!Number.isInteger(value) || value < 1900 || value > 2200) {
    throw new Error(`Expected year between 1900 and 2200, got: ${value}`);
  }

  return value;
}

export function toMindicadorDate(value: string): string {
  const date = assertIsoDate(value);
  const [year, month, day] = date.split("-");

  return `${day}-${month}-${year}`;
}
