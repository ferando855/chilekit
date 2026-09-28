// Hora oficial de Chile a partir de la base IANA que trae Node (ICU). No usa red.
// Chile tiene tres husos: continental, Magallanes (sin cambio de hora desde 2017) e
// Isla de Pascua.

export const CHILE_TIME_ZONES = {
  continental: {
    appliesTo: "Chile continental, salvo la Región de Magallanes",
    name: "Hora de Chile continental",
    timeZone: "America/Santiago",
  },
  magallanes: {
    appliesTo: "Región de Magallanes y de la Antártica Chilena",
    name: "Hora de Magallanes",
    timeZone: "America/Punta_Arenas",
  },
  pascua: {
    appliesTo: "Isla de Pascua e Isla Salas y Gómez",
    name: "Hora de Isla de Pascua",
    timeZone: "Pacific/Easter",
  },
} as const;

export type ChileZone = keyof typeof CHILE_TIME_ZONES;
export const CHILE_ZONES = Object.keys(CHILE_TIME_ZONES) as ChileZone[];

export interface ZoneTime {
  zone: ChileZone;
  name: string;
  timeZone: string;
  appliesTo: string;
  localDateTime: string;
  utcOffset: string;
}

export interface TimeChange {
  zone: ChileZone;
  timeZone: string;
  instantUtc: string;
  offsetBefore: string;
  offsetAfter: string;
  /** Hora local que marcaba el reloj justo antes del cambio (ej. "2026-04-04T24:00"). */
  localBefore: string;
  /** Hora local a la que pasa el reloj en ese mismo instante. */
  localAfter: string;
  clocks: "atrasar" | "adelantar";
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone);

  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-CA", {
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
      minute: "2-digit",
      month: "2-digit",
      second: "2-digit",
      timeZone,
      timeZoneName: "longOffset",
      year: "numeric",
    });
    formatters.set(timeZone, formatter);
  }

  return formatter;
}

function partsAt(timeZone: string, instant: Date) {
  const parts = Object.fromEntries(
    formatterFor(timeZone)
      .formatToParts(instant)
      .map((part) => [part.type, part.value]),
  ) as Record<string, string>;
  const offset = (parts.timeZoneName ?? "GMT").replace("GMT", "") || "+00:00";

  return {
    localDateTime: `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`,
    offset,
  };
}

export function getChileTime(now: Date = new Date()): ZoneTime[] {
  return CHILE_ZONES.map((zone) => {
    const info = CHILE_TIME_ZONES[zone];
    const { localDateTime, offset } = partsAt(info.timeZone, now);

    return { ...info, localDateTime, utcOffset: offset, zone };
  });
}

/**
 * Cambios de hora de un año en cada huso de Chile, ordenados por fecha.
 */
export function getTimeChanges(year: number): TimeChange[] {
  if (!Number.isInteger(year) || year < 1970 || year > 2200) {
    throw new Error(`Expected year between 1970 and 2200, got: ${year}`);
  }

  const start = Date.UTC(year, 0, 1);
  const end = Date.UTC(year + 1, 0, 1);
  const changes: TimeChange[] = [];

  for (const zone of CHILE_ZONES) {
    const { timeZone } = CHILE_TIME_ZONES[zone];
    let previous = partsAt(timeZone, new Date(start)).offset;

    for (let hour = start + 3_600_000; hour <= end; hour += 3_600_000) {
      const offset = partsAt(timeZone, new Date(hour)).offset;

      if (offset !== previous) {
        changes.push(
          describeChange(zone, timeZone, findTransition(timeZone, hour - 3_600_000, hour)),
        );
        previous = offset;
      }
    }
  }

  return changes.sort((left, right) => left.instantUtc.localeCompare(right.instantUtc));
}

export function getNextTimeChange(
  zone: ChileZone,
  from: Date = new Date(),
): TimeChange | undefined {
  const year = from.getUTCFullYear();

  return [...getTimeChanges(year), ...getTimeChanges(year + 1)].find(
    (change) => change.zone === zone && Date.parse(change.instantUtc) > from.getTime(),
  );
}

// Busqueda binaria del primer minuto con el offset nuevo.
function findTransition(timeZone: string, low: number, high: number): number {
  const before = partsAt(timeZone, new Date(low)).offset;
  let lo = low;
  let hi = high;

  while (hi - lo > 60_000) {
    const mid = lo + Math.floor((hi - lo) / 120_000) * 60_000;

    if (partsAt(timeZone, new Date(mid)).offset === before) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return hi;
}

function describeChange(zone: ChileZone, timeZone: string, instant: number): TimeChange {
  const before = partsAt(timeZone, new Date(instant - 60_000));
  const after = partsAt(timeZone, new Date(instant));
  const minutes = (offset: string) => {
    const [, sign, hh, mm] = /^([+-])(\d{2}):(\d{2})$/.exec(offset) ?? ["", "+", "0", "0"];
    return (sign === "-" ? -1 : 1) * (Number(hh) * 60 + Number(mm));
  };
  const delta = minutes(after.offset) - minutes(before.offset);
  // El reloj marcaba before + 1 minuto justo en el instante del cambio.
  const wallBefore = addMinutes(before.localDateTime, 1);

  return {
    clocks: delta < 0 ? "atrasar" : "adelantar",
    instantUtc: new Date(instant).toISOString(),
    localAfter: after.localDateTime.slice(0, 16),
    localBefore: wallBefore,
    offsetAfter: after.offset,
    offsetBefore: before.offset,
    timeZone,
    zone,
  };
}

// Suma minutos a una hora local "YYYY-MM-DDTHH:mm:ss" y expresa medianoche como 24:00
// del dia anterior, que es como se anuncian oficialmente los cambios de hora.
function addMinutes(localDateTime: string, minutes: number): string {
  const date = new Date(`${localDateTime}Z`);
  date.setUTCMinutes(date.getUTCMinutes() + minutes);
  const iso = date.toISOString().slice(0, 16);

  if (iso.endsWith("T00:00")) {
    const previous = new Date(date.getTime() - 86_400_000).toISOString().slice(0, 10);
    return `${previous}T24:00`;
  }

  return iso;
}
