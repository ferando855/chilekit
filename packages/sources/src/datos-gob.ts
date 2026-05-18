import type { OpenDatasetResult } from "@chilekit/core";

type FetchLike = typeof fetch;

export interface SearchOpenDatasetsOptions {
  fetchImpl?: FetchLike;
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
  const url = new URL("https://datos.gob.cl/api/3/action/package_search");
  url.searchParams.set("q", query);
  url.searchParams.set("rows", String(rows));

  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(url);

  if (!response.ok) {
    throw new Error(`datos.gob.cl returned ${response.status}`);
  }

  const payload = (await response.json()) as CkanPackageSearchResponse;

  if (!payload.success) {
    throw new Error("datos.gob.cl package_search failed");
  }

  return (payload.result?.results ?? []).map((dataset) => ({
    id: dataset.id,
    license: dataset.license_title,
    name: dataset.name,
    organization: dataset.organization?.title ?? dataset.organization?.name,
    resources: (dataset.resources ?? []).map((resource) => ({
      format: resource.format,
      name: resource.name ?? "resource",
      url: resource.url,
    })),
    title: dataset.title ?? dataset.name,
    url: `https://datos.gob.cl/dataset/${dataset.name}`,
  }));
}
