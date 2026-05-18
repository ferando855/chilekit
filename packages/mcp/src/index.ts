import { startMcpServer } from "./server.js";

export { createMcpServer, startMcpServer } from "./server.js";

if (import.meta.url === `file://${process.argv[1]}`) {
  startMcpServer().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`chilekit-mcp: ${message}`);
    process.exitCode = 1;
  });
}
