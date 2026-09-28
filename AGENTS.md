# AGENTS.md

Guia para agentes de codigo que contribuyen a ChileKit. Para usar ChileKit desde un
agente, ver [docs/agents.md](docs/agents.md).

## Estructura

- `packages/core`: tipos, fechas, RUT y `sanitize.ts`. Sin dependencias ni red.
- `packages/sources`: conectores, `manifests.ts` y `http.ts` (unico punto de salida a red).
- `packages/cli`: `commands.ts` define los comandos; `bin.ts` es el entrypoint.
- `packages/mcp`: `server.ts` registra las tools; `bin.ts` es el entrypoint.

## Comandos

```bash
pnpm install
pnpm check                           # todo lo que corre CI
pnpm --filter @chilekit/sources test # tests de un paquete
pnpm --filter @chilekit/cli chilekit feriados --json   # CLI desde src
```

## Reglas no negociables

- Toda llamada de red pasa por `fetchJson` y su host debe estar en `ALLOWED_HOSTS`.
- Todo string de una fuente externa pasa por `sanitizeText`/`sanitizeOptionalText` y
  toda URL externa por `sanitizeUrl` antes de salir del conector.
- Los tests no usan red: inyecta `fetchImpl`.
- Cada tool MCP declara `title` y `annotations` (`LOCAL_TOOL` o `NETWORK_TOOL`) y valida
  sus inputs con zod, con largo maximo en strings.
- Cada comando nuevo del CLI acepta `--json` y valida sus argumentos con
  `parseInteger`/`parseIsoDate` antes de llamar a la fuente.
- Nada de rutificadores ni datos personales ([docs/privacy.md](docs/privacy.md)).
- Una fuente nueva parte por su manifiesto en `manifests.ts`.

## Estilo

Biome formatea y lintea (`pnpm format`). TypeScript estricto. Mensajes al usuario en
español; identificadores en ingles.
