import { describe, expect, it } from "vitest";

import {
  findCommuneInfo,
  findRegion,
  listCommunesByRegion,
  matchRegions,
  searchCommunes,
} from "../src/index.js";

describe("regions", () => {
  it.each([
    ["Biobio", "08"],
    ["Región del Biobío", "08"],
    ["RM", "13"],
    ["Santiago", "13"],
    ["13", "13"],
    ["5", "05"],
    ["V", "05"],
    ["XIV", "14"],
    ["CL-VS", "05"],
    ["O Higgins", "06"],
    ["OHiggins", "06"],
    ["Región de la Araucanía", "09"],
  ])("resolves %s", (query, id) => {
    expect(findRegion(query)?.id).toBe(id);
  });

  it("reports ambiguity instead of guessing", () => {
    expect(matchRegions("Los").map((region) => region.id)).toEqual(["10", "14"]);
    expect(findRegion("Los")).toBeUndefined();
    expect(() => listCommunesByRegion("Los")).toThrow(/ambigua.*Los Lagos.*Los Ríos/);
  });

  it("fails clearly on unknown regions", () => {
    expect(() => listCommunesByRegion("Narnia")).toThrow(/no encontrada/);
    expect(matchRegions("   ")).toEqual([]);
  });

  it("lists communes by region ignoring accents", () => {
    const communes = listCommunesByRegion("Biobio");

    expect(communes.map((commune) => commune.name)).toContain("Concepción");
    expect(communes.every((commune) => commune.regionId === "08")).toBe(true);
  });
});

describe("communes", () => {
  it("prefers exact matches", () => {
    expect(findCommuneInfo("concepcion")).toMatchObject({ name: "Concepción", regionId: "08" });
  });

  it("returns undefined for ambiguous partial matches and exposes candidates", () => {
    expect(findCommuneInfo("San")).toBeUndefined();
    expect(searchCommunes("San", 50).length).toBeGreaterThan(5);
  });
});
