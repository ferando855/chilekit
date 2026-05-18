import { normalizeText } from "@chilekit/core";

import { sourceManifests } from "./manifests.js";

export interface SearchSourcesOptions {
  limit?: number;
}

export function searchSources(query: string, options: SearchSourcesOptions = {}) {
  const limit = options.limit ?? 10;
  const tokens = normalizeQueryTokens(query);

  return sourceManifests
    .map((source) => {
      const haystack = normalizeQueryTokens(
        [
          source.id,
          source.name,
          source.category,
          source.notes ?? "",
          ...source.tools.flatMap((tool) => [tool.name, tool.description]),
        ].join(" "),
      );
      const score = tokens.reduce(
        (currentScore, token) =>
          haystack.some((candidate) => candidate.includes(token)) ? currentScore + 1 : currentScore,
        0,
      );

      return {
        score,
        source,
      };
    })
    .filter((result) => result.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((result) => result.source);
}

function normalizeQueryTokens(value: string): string[] {
  return [
    ...new Set(
      normalizeText(value)
        .split(/\s+/)
        .map((token) => token.trim())
        .filter((token) => token.length > 0 && !/^\d{4}$/.test(token)),
    ),
  ];
}
