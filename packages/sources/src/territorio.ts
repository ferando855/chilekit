import type { ChileCommune, ChileProvince, ChileRegion } from "@chilekit/core";
import { normalizeText } from "@chilekit/core";
import { communes, provinces, regions } from "@clregions/data/array";

export function listRegions(): ChileRegion[] {
  return regions.map((region) => ({ ...region }));
}

export function listCommunesByRegion(regionQuery: string): ChileCommune[] {
  const region = findRegion(regionQuery);

  if (!region) {
    throw new Error(`Region not found: ${regionQuery}`);
  }

  const regionProvinces = provinces.filter((province) => province.regionId === region.id);
  const provinceById = new Map<string, ChileProvince>(
    regionProvinces.map((province) => [province.id, province]),
  );

  return communes
    .filter((commune) => provinceById.has(commune.provinceId))
    .map((commune) => toChileCommune(commune, provinceById.get(commune.provinceId), region))
    .sort((left, right) => left.name.localeCompare(right.name, "es-CL"));
}

export function findCommuneInfo(communeQuery: string): ChileCommune | undefined {
  const normalizedQuery = normalizeText(communeQuery);
  const exact = communes.find((commune) => normalizeText(commune.name) === normalizedQuery);
  const candidate =
    exact ?? communes.find((commune) => normalizeText(commune.name).includes(normalizedQuery));

  if (!candidate) {
    return undefined;
  }

  const province = provinces.find((item) => item.id === candidate.provinceId);
  const region = province ? regions.find((item) => item.id === province.regionId) : undefined;

  if (!province || !region) {
    return undefined;
  }

  return toChileCommune(candidate, province, region);
}

export function findRegion(regionQuery: string): ChileRegion | undefined {
  const normalizedQuery = normalizeText(regionQuery);

  return regions.find((region) =>
    [region.id, region.name, region.shortName, region.abbreviation, region.isoCode].some(
      (value) =>
        normalizeText(value) === normalizedQuery || normalizeText(value).includes(normalizedQuery),
    ),
  );
}

function toChileCommune(
  commune: { id: string; name: string; provinceId: string },
  province: ChileProvince | undefined,
  region: ChileRegion,
): ChileCommune {
  if (!province) {
    throw new Error(`Province not found for commune ${commune.name}`);
  }

  return {
    id: commune.id,
    name: commune.name,
    provinceId: province.id,
    provinceName: province.name,
    regionId: region.id,
    regionName: region.name,
  };
}
