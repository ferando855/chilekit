import { todayInChile } from "@chilekit/core";
import {
  findCommuneInfo,
  getHoliday,
  getHolidays,
  getSourceManifest,
  getUf,
  listCommunesByRegion,
  searchOpenDatasets,
  searchSources,
} from "@chilekit/sources";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { textJson } from "./format.js";

export function createMcpServer(): McpServer {
  const server = new McpServer(
    {
      name: "chilekit",
      version: "0.1.0",
    },
    {
      instructions:
        "ChileKit exposes public Chilean data. Prefer the chilekit CLI with --json for simple one-shot agent calls; use MCP tools for persistent clients. Do not use ChileKit to query identities, rutificadores, addresses, or personal data.",
    },
  );

  server.registerTool(
    "search_chile_sources",
    {
      description: "Busca fuentes y herramientas disponibles en ChileKit.",
      inputSchema: z.object({
        query: z.string().min(1),
      }),
    },
    async ({ query }) => textJson({ query, sources: searchSources(query) }),
  );

  server.registerTool(
    "get_holidays",
    {
      description: "Lista feriados chilenos de un año.",
      inputSchema: z.object({
        year: z.number().int().min(1900).max(2200),
      }),
    },
    async ({ year }) => textJson({ holidays: await getHolidays(year), year }),
  );

  server.registerTool(
    "get_holiday",
    {
      description: "Indica si una fecha ISO es feriado en Chile.",
      inputSchema: z.object({
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .default(todayInChile()),
      }),
    },
    async ({ date }) => {
      const holiday = await getHoliday(date);

      return textJson({ date, holiday: holiday ?? null, isHoliday: Boolean(holiday) });
    },
  );

  server.registerTool(
    "get_economic_indicator",
    {
      description: "Obtiene un indicador economico inicial. En 0.1.0 soporta UF via mindicador.cl.",
      inputSchema: z.object({
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
        indicator: z.enum(["uf"]),
      }),
    },
    async ({ date, indicator }) => {
      if (indicator !== "uf") {
        throw new Error(`Indicador no soportado en 0.1.0: ${indicator}`);
      }

      return textJson({ indicator: await getUf({ date }) });
    },
  );

  server.registerTool(
    "list_communes",
    {
      description: "Lista comunas por region chilena.",
      inputSchema: z.object({
        region: z.string().min(1),
      }),
    },
    async ({ region }) => textJson({ communes: listCommunesByRegion(region), region }),
  );

  server.registerTool(
    "get_commune_info",
    {
      description: "Busca comuna, provincia y region.",
      inputSchema: z.object({
        name: z.string().min(1),
      }),
    },
    async ({ name }) => textJson({ commune: findCommuneInfo(name) ?? null, query: name }),
  );

  server.registerTool(
    "search_open_datasets",
    {
      description: "Busca datasets en datos.gob.cl.",
      inputSchema: z.object({
        query: z.string().min(1),
        rows: z.number().int().min(1).max(20).default(5),
      }),
    },
    async ({ query, rows }) =>
      textJson({ datasets: await searchOpenDatasets(query, { rows }), query }),
  );

  server.registerTool(
    "get_source_manifest",
    {
      description: "Obtiene el manifiesto de una fuente ChileKit.",
      inputSchema: z.object({
        id: z.string().min(1),
      }),
    },
    async ({ id }) => {
      const source = getSourceManifest(id);

      if (!source) {
        throw new Error(`Fuente no encontrada: ${id}`);
      }

      return textJson({ source });
    },
  );

  return server;
}

export async function startMcpServer(): Promise<void> {
  const server = createMcpServer();
  const transport = new StdioServerTransport();

  process.on("SIGINT", async () => {
    await server.close();
    process.exit(0);
  });

  await server.connect(transport);
  console.error("ChileKit MCP server running on stdio");
}
