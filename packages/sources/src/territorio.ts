import type { ChileCommune, ChileProvince, ChileRegion } from "@chilekit/core";
import { normalizeText } from "@chilekit/core";
import { communes, provinces, regions } from "@clregions/data/array";

const ROMAN_NUMERALS = [
  "i",
  "ii",
  "iii",
  "iv",
  "v",
  "vi",
  "vii",
  "viii",
  "ix",
  "x",
  "xi",
  "xii",
  "xiii",
  "xiv",
  "xv",
  "xvi",
];

export function listRegions(): ChileRegion[] {
  return regions.map((region) => ({ ...region }));
}

export function listCommunesByRegion(regionQuery: string): ChileCommune[] {
  const region = resolveRegion(regionQuery);
  const regionProvinces = provinces.filter((province) => province.regionId === region.id);
  const provinceById = new Map<string, ChileProvince>(
    regionProvinces.map((province) => [province.id, province]),
  );

  return communes
    .filter((commune) => provinceById.has(commune.provinceId))
    .map((commune) => toChileCommune(commune, provinceById.get(commune.provinceId), region))
    .sort((left, right) => left.name.localeCompare(right.name, "es-CL"));
}

/**
 * Busca comunas por nombre. Una coincidencia exacta gana sobre las parciales.
 */
export function searchCommunes(communeQuery: string, limit = 10): ChileCommune[] {
  const query = toMatchKey(communeQuery);

  if (!query) {
    return [];
  }

  const exact = communes.filter((commune) => toMatchKey(commune.name) === query);
  const matches =
    exact.length > 0 ? exact : communes.filter((commune) => matchesWordPrefix(commune.name, query));

  return matches
    .map((commune) => {
      const province = provinces.find((item) => item.id === commune.provinceId);
      const region = province ? regions.find((item) => item.id === province.regionId) : undefined;

      return province && region ? toChileCommune(commune, province, region) : undefined;
    })
    .filter((commune): commune is ChileCommune => Boolean(commune))
    .sort((left, right) => left.name.localeCompare(right.name, "es-CL"))
    .slice(0, limit);
}

/**
 * Devuelve la comuna solo si la consulta es inequivoca.
 */
export function findCommuneInfo(communeQuery: string): ChileCommune | undefined {
  const matches = searchCommunes(communeQuery, 2);

  return matches.length === 1 ? matches[0] : undefined;
}

/**
 * Regiones que coinciden con la consulta. Acepta nombre, codigo ("13", "5"),
 * numero romano ("XIV"), abreviacion ("RM") o ISO 3166-2 ("CL-VS").
 */
export function matchRegions(regionQuery: string): ChileRegion[] {
  const query = stripRegionPrefix(toMatchKey(regionQuery));

  if (!query) {
    return [];
  }

  const exact = regions.filter((region) => regionKeys(region).includes(query));

  if (exact.length > 0) {
    return exact.map((region) => ({ ...region }));
  }

  return regions
    .filter((region) =>
      [region.name, region.shortName].some((value) => matchesWordPrefix(value, query)),
    )
    .map((region) => ({ ...region }));
}

export function findRegion(regionQuery: string): ChileRegion | undefined {
  const matches = matchRegions(regionQuery);

  return matches.length === 1 ? matches[0] : undefined;
}

export function resolveRegion(regionQuery: string): ChileRegion {
  const matches = matchRegions(regionQuery);

  if (matches.length === 0) {
    throw new Error(`Region no encontrada: ${regionQuery}`);
  }

  if (matches.length > 1) {
    throw new Error(
      `Region ambigua: "${regionQuery}" coincide con ${matches.map((region) => region.shortName).join(", ")}`,
    );
  }

  return matches[0] as ChileRegion;
}

function regionKeys(region: ChileRegion): string[] {
  const index = Number(region.id);

  return [
    region.id,
    String(index),
    ROMAN_NUMERALS[index - 1] ?? "",
    region.name,
    region.shortName,
    region.abbreviation,
    region.isoCode,
    region.isoCode.replace(/^CL-/i, ""),
  ]
    .map((value) => stripRegionPrefix(toMatchKey(value)))
    .filter(Boolean);
}

function toMatchKey(value: string): string {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function stripRegionPrefix(value: string): string {
  return value.replace(/^region( de la| del| de)? /, "").trim();
}

/**
 * La consulta debe calzar desde el inicio de una palabra, ignorando espacios:
 * "higgins" y "o higgins" calzan con "O'Higgins", pero "los" no calza con "Carlos".
 */
function matchesWordPrefix(value: string, query: string): boolean {
  const words = toMatchKey(value).split(" ");
  const needle = query.replace(/\s+/g, "");

  return words.some((_, index) => words.slice(index).join("").startsWith(needle));
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
