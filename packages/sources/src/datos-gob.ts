import type { OpenDatasetResult } from "@chilekit/core";
import { sanitizeOptionalText, sanitizeText, sanitizeUrl } from "@chilekit/core";

import { type FetchJsonOptions, fetchJson } from "./http.js";

export const MAX_DATASET_ROWS = 20;
export const MAX_DATASET_QUERY_LENGTH = 200;
const MAX_RESOURCES_PER_DATASET = 20;

export interface SearchOpenDatasetsOptions extends FetchJsonOptions {
  rows?: number;
}

interface CkanPackageSearchResponse {
  success: boolean;
  result?: {
    results?: CkanDataset[];
  };
}

interface CkanDataset {
  id: string;
  name: string;
  title?: string;
  license_title?: string;
  organization?: {
    title?: string;
    name?: string;
  };
  resources?: Array<{
    name?: string;
    format?: string;
    url?: string;
  }>;
}

export async function searchOpenDatasets(
  query: string,
  options: SearchOpenDatasetsOptions = {},
): Promise<OpenDatasetResult[]> {
  const rows = options.rows ?? 5;
  const trimmedQuery = query.trim();

  if (!Number.isInteger(rows) || rows < 1 || rows > MAX_DATASET_ROWS) {
    throw new Error(`rows debe ser un entero entre 1 y ${MAX_DATASET_ROWS}.`);
  }

  if (!trimmedQuery || trimmedQuery.length > MAX_DATASET_QUERY_LENGTH) {
    throw new Error(`La busqueda debe tener entre 1 y ${MAX_DATASET_QUERY_LENGTH} caracteres.`);
  }

  const url = new URL("https://datos.gob.cl/api/3/action/package_search");
  url.searchParams.set("q", trimmedQuery);
  url.searchParams.set("rows", String(rows));

  const payload = (await fetchJson(url, options)) as CkanPackageSearchResponse;

  if (!payload?.success) {
    throw new Error("datos.gob.cl package_search failed");
  }

  return (payload.result?.results ?? []).slice(0, rows).flatMap((dataset) => {
    const name = sanitizeOptionalText(dataset.name, { maxLength: 200, singleLine: true });

    if (!name || typeof dataset.id !== "string") {
      return [];
    }

    return [
      {
        id: sanitizeText(dataset.id, { maxLength: 100, singleLine: true }),
        license: sanitizeOptionalText(dataset.license_title, { singleLine: true }),
        name,
        organization: sanitizeOptionalText(
          dataset.organization?.title ?? dataset.organization?.name,
          { singleLine: true },
        ),
        resources: (dataset.resources ?? [])
          .slice(0, MAX_RESOURCES_PER_DATASET)
          .map((resource) => ({
            format: sanitizeOptionalText(resource.format, { maxLength: 20, singleLine: true }),
            name: sanitizeOptionalText(resource.name, { singleLine: true }) ?? "resource",
            url: sanitizeUrl(resource.url),
          })),
        title: sanitizeOptionalText(dataset.title, { singleLine: true }) ?? name,
        url: `https://datos.gob.cl/dataset/${encodeURIComponent(name)}`,
      },
    ];
  });
}
