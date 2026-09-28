import { type ChileZone, getChileTime, getNextTimeChange, type ZoneTime } from "@chilekit/core";

import { findCommuneInfo, resolveRegion, searchCommunes } from "./territorio.js";

const ISLA_DE_PASCUA_COMMUNE_ID = "05201";
const MAGALLANES_REGION_ID = "12";

export interface LocationQuery {
  region?: string;
  commune?: string;
}

/**
 * Huso horario que rige en una region o comuna. Isla de Pascua es una comuna de la
 * Region de Valparaiso con huso propio; toda Magallanes (incluida Antartica) usa el suyo.
 */
export function zoneForLocation(location: LocationQuery): ChileZone {
  if (location.commune) {
    const commune = findCommuneInfo(location.commune);

    if (!commune) {
      const candidates = searchCommunes(location.commune, 5).map((item) => item.name);
      throw new Error(
        candidates.length > 0
          ? `Comuna ambigua: "${location.commune}". Coincidencias: ${candidates.join(", ")}`
          : `Comuna no encontrada: ${location.commune}`,
      );
    }

    if (commune.id === ISLA_DE_PASCUA_COMMUNE_ID) {
      return "pascua";
    }

    return commune.regionId === MAGALLANES_REGION_ID ? "magallanes" : "continental";
  }

  if (location.region) {
    return resolveRegion(location.region).id === MAGALLANES_REGION_ID
      ? "magallanes"
      : "continental";
  }

  return "continental";
}

export interface ChileTimeAnswer extends ZoneTime {
  nextChange: ReturnType<typeof getNextTimeChange> | null;
}

export function getTimeFor(location: LocationQuery = {}, now: Date = new Date()): ChileTimeAnswer {
  const zone = zoneForLocation(location);
  const time = getChileTime(now).find((item) => item.zone === zone) as ZoneTime;

  return { ...time, nextChange: getNextTimeChange(zone, now) ?? null };
}
