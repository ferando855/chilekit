// Falla si el tag del release no coincide con la version de todos los paquetes
// y con la constante VERSION que reportan el CLI y el servidor MCP.
import { readFileSync } from "node:fs";

const tag = process.argv[2] ?? "";
const expected = tag.replace(/^v/, "");

if (!/^\d+\.\d+\.\d+$/.test(expected)) {
  throw new Error(`Tag invalido: "${tag}". Se esperaba vX.Y.Z.`);
}

const manifests = [
  "package.json",
  ...["core", "sources", "cli", "mcp"].map((pkg) => `packages/${pkg}/package.json`),
];
const mismatches = manifests
  .map((path) => [path, JSON.parse(readFileSync(path, "utf8")).version])
  .filter(([, version]) => version !== expected);

const versionSource = readFileSync("packages/sources/src/version.ts", "utf8");
const sourceVersion = versionSource.match(/export const VERSION = "([^"]+)";/)?.[1];

if (sourceVersion !== expected) {
  mismatches.push(["packages/sources/src/version.ts", sourceVersion]);
}

// El registro MCP exige que server.json y el paquete npm declaren la misma version y nombre.
const server = JSON.parse(readFileSync("server.json", "utf8"));
const mcpPackage = JSON.parse(readFileSync("packages/mcp/package.json", "utf8"));

for (const [label, version] of [
  ["server.json version", server.version],
  ["server.json packages[0].version", server.packages?.[0]?.version],
]) {
  if (version !== expected) {
    mismatches.push([label, version]);
  }
}

if (mcpPackage.mcpName !== server.name) {
  mismatches.push([
    "packages/mcp/package.json mcpName",
    `${mcpPackage.mcpName} (server.json: ${server.name})`,
  ]);
}

if (mismatches.length > 0) {
  for (const [path, version] of mismatches) {
    console.error(`${path}: ${version} (esperado ${expected})`);
  }
  process.exit(1);
}

console.log(`Versiones consistentes: ${expected}`);
