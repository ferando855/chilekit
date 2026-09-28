#!/usr/bin/env node

import { startMcpServer } from "./server.js";

startMcpServer().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`chilekit-mcp: ${message}`);
  process.exitCode = 1;
});
