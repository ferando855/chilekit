import { todayInChile } from "@chilekit/core";
import { startMcpServer } from "@chilekit/mcp";
import {
  findCommuneInfo,
  getHoliday,
  getHolidays,
  getSourceManifest,
  getUf,
  listCommunesByRegion,
  listRegions,
  searchOpenDatasets,
  searchSources,
  sourceManifests,
} from "@chilekit/sources";
import { Command } from "commander";

import { printJson, printRows } from "./output.js";

interface GlobalOptions {
  json?: boolean;
}

interface JsonCommandOptions {
  json?: boolean;
}

export function createProgram(): Command {
  const program = new Command();

  program
    .name("chilekit")
    .description("CLI y MCP open-source para consultar datos publicos chilenos.")
    .version("0.1.0")
    .option("--json", "emite salida JSON para agentes y scripts")
    .showHelpAfterError("(usa --help para ver ejemplos)")
    .showSuggestionAfterError();

  program
    .command("feriados")
    .description("Lista feriados chilenos de un año.")
    .argument("[year]", "año a consultar", String(new Date().getFullYear()))
    .option("--json", "emite salida JSON para agentes y scripts")
    .option("--live", "consulta la fuente remota cuando este disponible")
    .action(async (year: string, options: JsonCommandOptions & { live?: boolean }) => {
      const output = getOutputOptions(program, options);
      const holidays = await getHolidays(Number(year), { live: options.live });

      if (output.json) {
        printJson({ holidays, source: "feriados", year: Number(year) });
        return;
      }

      printRows(
        ["fecha", "nombre", "tipo", "irrenunciable"],
        holidays.map((holiday) => [
          holiday.date,
          holiday.name,
          holiday.type,
          holiday.inalienable ? "si" : "no",
        ]),
      );
    });

  program
    .command("feriado")
    .description("Indica si una fecha ISO es feriado en Chile.")
    .argument("[date]", "fecha YYYY-MM-DD", todayInChile())
    .option("--json", "emite salida JSON para agentes y scripts")
    .option("--live", "consulta la fuente remota cuando este disponible")
    .action(async (date: string, options: JsonCommandOptions & { live?: boolean }) => {
      const output = getOutputOptions(program, options);
      const holiday = await getHoliday(date, { live: options.live });

      if (output.json) {
        printJson({ date, holiday: holiday ?? null, isHoliday: Boolean(holiday) });
        return;
      }

      if (!holiday) {
        process.stdout.write(`${date} no es feriado registrado.\n`);
        return;
      }

      process.stdout.write(
        `${holiday.date}: ${holiday.name} (${holiday.type}${holiday.inalienable ? ", irrenunciable" : ""})\n`,
      );
    });

  program
    .command("uf")
    .description("Consulta la UF desde mindicador.cl.")
    .argument("[date]", "fecha YYYY-MM-DD o 'hoy'", "hoy")
    .option("--json", "emite salida JSON para agentes y scripts")
    .action(async (date: string, options: JsonCommandOptions) => {
      const output = getOutputOptions(program, options);
      const indicator = await getUf({ date });

      if (output.json) {
        printJson({ indicator });
        return;
      }

      process.stdout.write(
        `${indicator.date} ${indicator.name}: ${indicator.value} ${indicator.unit}\n`,
      );
    });

  program
    .command("regiones")
    .description("Lista regiones de Chile.")
    .option("--json", "emite salida JSON para agentes y scripts")
    .action((options: JsonCommandOptions) => {
      const output = getOutputOptions(program, options);
      const regions = listRegions();

      if (output.json) {
        printJson({ regions });
        return;
      }

      printRows(
        ["id", "nombre", "abreviacion", "iso"],
        regions.map((region) => [region.id, region.name, region.abbreviation, region.isoCode]),
      );
    });

  program
    .command("comunas")
    .description("Lista comunas por region.")
    .requiredOption("-r, --region <region>", "region por nombre, codigo o abreviacion")
    .option("--json", "emite salida JSON para agentes y scripts")
    .action((options: JsonCommandOptions & { region: string }) => {
      const output = getOutputOptions(program, options);
      const communes = listCommunesByRegion(options.region);

      if (output.json) {
        printJson({ communes, region: options.region });
        return;
      }

      printRows(
        ["comuna", "provincia", "region"],
        communes.map((commune) => [commune.name, commune.provinceName, commune.regionName]),
      );
    });

  program
    .command("comuna")
    .description("Busca informacion territorial de una comuna.")
    .argument("<name>", "nombre de comuna")
    .option("--json", "emite salida JSON para agentes y scripts")
    .action((name: string, options: JsonCommandOptions) => {
      const output = getOutputOptions(program, options);
      const commune = findCommuneInfo(name);

      if (output.json) {
        printJson({ commune: commune ?? null, query: name });
        return;
      }

      if (!commune) {
        process.stdout.write(`No encontre comuna para "${name}".\n`);
        return;
      }

      printRows(
        ["comuna", "provincia", "region", "codigo"],
        [[commune.name, commune.provinceName, commune.regionName, commune.id]],
      );
    });

  program
    .command("datasets")
    .description("Busca datasets en datos.gob.cl.")
    .argument("<query>", "termino de busqueda")
    .option("--json", "emite salida JSON para agentes y scripts")
    .option("--rows <rows>", "cantidad de resultados", "5")
    .action(async (query: string, options: JsonCommandOptions & { rows: string }) => {
      const output = getOutputOptions(program, options);
      const datasets = await searchOpenDatasets(query, { rows: Number(options.rows) });

      if (output.json) {
        printJson({ datasets, query });
        return;
      }

      printRows(
        ["titulo", "organizacion", "licencia", "url"],
        datasets.map((dataset) => [
          dataset.title,
          dataset.organization ?? "",
          dataset.license ?? "",
          dataset.url,
        ]),
      );
    });

  program
    .command("search")
    .description("Busca fuentes ChileKit por texto.")
    .argument("<query>", "termino de busqueda")
    .option("--json", "emite salida JSON para agentes y scripts")
    .option("--limit <limit>", "cantidad de resultados", "10")
    .action((query: string, options: JsonCommandOptions & { limit: string }) => {
      const output = getOutputOptions(program, options);
      const sources = searchSources(query, { limit: Number(options.limit) });

      if (output.json) {
        printJson({ query, sources });
        return;
      }

      printRows(
        ["id", "nombre", "categoria", "estado", "oficial"],
        sources.map((source) => [
          source.id,
          source.name,
          source.category,
          source.status,
          source.official ? "si" : "no",
        ]),
      );
    });

  program
    .command("sources")
    .description("Lista fuentes registradas.")
    .option("--json", "emite salida JSON para agentes y scripts")
    .action((options: JsonCommandOptions) => {
      const output = getOutputOptions(program, options);

      if (output.json) {
        printJson({ sources: sourceManifests });
        return;
      }

      printRows(
        ["id", "nombre", "categoria", "estado"],
        sourceManifests.map((source) => [source.id, source.name, source.category, source.status]),
      );
    });

  program
    .command("source")
    .description("Muestra el manifiesto de una fuente.")
    .argument("<id>", "id de fuente")
    .option("--json", "emite salida JSON para agentes y scripts")
    .action((id: string, options: JsonCommandOptions) => {
      const output = getOutputOptions(program, options);
      const source = getSourceManifest(id);

      if (!source) {
        throw new Error(`Fuente no encontrada: ${id}`);
      }

      if (output.json) {
        printJson({ source });
        return;
      }

      printRows(
        ["campo", "valor"],
        [
          ["id", source.id],
          ["nombre", source.name],
          ["categoria", source.category],
          ["oficial", source.official ? "si" : "no"],
          ["auth", source.auth],
          ["formatos", source.formats.join(", ")],
          ["frescura", source.freshness],
          ["estado", source.status],
          ["docs", source.docsUrl ?? ""],
        ],
      );
    });

  program
    .command("mcp")
    .description("Inicia servidor MCP stdio. Preferir CLI para agentes simples.")
    .action(async () => {
      await startMcpServer();
    });

  return program;
}

function getOutputOptions(program: Command, commandOptions?: JsonCommandOptions): GlobalOptions {
  return {
    json: Boolean(program.opts<GlobalOptions>().json || commandOptions?.json),
  };
}
