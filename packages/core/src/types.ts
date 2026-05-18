export type SourceCategory =
  | "aire"
  | "compras-publicas"
  | "datos-abiertos"
  | "economia"
  | "elecciones"
  | "energia"
  | "estadisticas"
  | "feriados"
  | "fiscalizacion"
  | "geodatos"
  | "leyes"
  | "territorio";

export type SourceAuth = "none" | "optional" | "required";

export type SourceFormat = "csv" | "geojson" | "html" | "json" | "pdf" | "sdmx" | "xml";

export type SourceFreshness =
  | "realtime"
  | "daily"
  | "weekly"
  | "monthly"
  | "annual"
  | "event-driven"
  | "unknown";

export type SourceStatus = "available" | "manifest-only" | "experimental";

export interface SourceToolManifest {
  name: string;
  description: string;
}

export interface SourceManifest {
  id: string;
  name: string;
  category: SourceCategory;
  official: boolean;
  auth: SourceAuth;
  formats: SourceFormat[];
  freshness: SourceFreshness;
  status: SourceStatus;
  baseUrl?: string;
  docsUrl?: string;
  license?: string;
  notes?: string;
  tools: SourceToolManifest[];
}

export interface Holiday {
  date: string;
  name: string;
  type: "bank" | "civil" | "election" | "religious";
  inalienable: boolean;
  sourceId: string;
  notes?: string;
}

export interface EconomicIndicator {
  code: string;
  name: string;
  unit: string;
  date: string;
  value: number;
  sourceId: string;
}

export interface ChileRegion {
  id: string;
  name: string;
  shortName: string;
  abbreviation: string;
  isoCode: string;
}

export interface ChileProvince {
  id: string;
  name: string;
  regionId: string;
}

export interface ChileCommune {
  id: string;
  name: string;
  provinceId: string;
  provinceName: string;
  regionId: string;
  regionName: string;
}

export interface OpenDatasetResult {
  id: string;
  name: string;
  title: string;
  organization?: string;
  license?: string;
  url: string;
  resources: Array<{
    name: string;
    format?: string;
    url?: string;
  }>;
}
