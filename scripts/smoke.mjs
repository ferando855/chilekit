// Ejecuta los binarios compilados a traves de un symlink, igual que npm/npx
// cuando instalan el paquete. Protege contra entrypoints que no arrancan.
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const dir = mkdtempSync(join(tmpdir(), "chilekit smoke "));

try {
  const bin = join(dir, "chilekit");
  symlinkSync(resolve("packages/cli/dist/bin.js"), bin);

  const output = execFileSync(process.execPath, [bin, "regiones", "--json"], { encoding: "utf8" });
  const { regions } = JSON.parse(output);

  if (!Array.isArray(regions) || regions.length !== 16) {
    throw new Error(`expected 16 regions, got: ${output.slice(0, 200)}`);
  }

  const mcpBin = join(dir, "chilekit-mcp");
  symlinkSync(resolve("packages/mcp/dist/bin.js"), mcpBin);
  const request = `${JSON.stringify({
    id: 1,
    jsonrpc: "2.0",
    method: "initialize",
    params: {
      capabilities: {},
      clientInfo: { name: "smoke", version: "0" },
      protocolVersion: "2025-06-18",
    },
  })}\n`;
  const mcpOutput = execFileSync(process.execPath, [mcpBin], {
    encoding: "utf8",
    input: request,
    timeout: 10_000,
  });

  if (!mcpOutput.includes('"serverInfo"')) {
    throw new Error(`MCP server did not answer initialize: ${mcpOutput.slice(0, 200)}`);
  }

  console.log("smoke ok: chilekit and chilekit-mcp run through symlinks");
} finally {
  rmSync(dir, { force: true, recursive: true });
}
