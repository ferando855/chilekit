export function todayInChile(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Santiago",
    year: "numeric",
  });

  return formatter.format(new Date());
}

export function assertIsoDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Expected ISO date YYYY-MM-DD, got: ${value}`);
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
