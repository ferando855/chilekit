import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const fromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@chilekit/core": fromRoot("./packages/core/src/index.ts"),
      "@chilekit/mcp": fromRoot("./packages/mcp/src/index.ts"),
      "@chilekit/sources": fromRoot("./packages/sources/src/index.ts"),
    },
  },
  test: {
    passWithNoTests: false,
  },
});
