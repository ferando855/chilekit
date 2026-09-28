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

if (!versionSource.includes(`"${expected}"`)) {
  mismatches.push(["packages/sources/src/version.ts", versionSource.match(/"(.+)"/)?.[1]]);
}

if (mismatches.length > 0) {
  for (const [path, version] of mismatches) {
    console.error(`${path}: ${version} (esperado ${expected})`);
  }
  process.exit(1);
}

console.log(`Versiones consistentes: ${expected}`);
