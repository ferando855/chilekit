import {
  assertIsoDate,
  CHILE_TIME_ZONES,
  currentYearInChile,
  getTimeChanges,
  parseChileanNumber,
  todayInChile,
  validateRut,
} from "@chilekit/core";
import { startMcpServer } from "@chilekit/mcp";
import {
  addBusinessDays,
  adjustByUf,
  convertCurrency,
  countBusinessDays,
  findCommuneInfo,
  getHoliday,
  getHolidays,
  getIndicator,
  getLatestIndicators,
  getNextHoliday,
  getSourceManifest,
  getTimeFor,
  INDICATOR_CODES,
  listCommunesByRegion,
  listRegions,
  resolveCurrencyUnit,
  searchCommunes,
  searchOpenDatasets,
  searchSources,
  sourceManifests,
  VERSION,
} from "@chilekit/sources";
import { Command, InvalidArgumentError } from "commander";

import { printJson, printRows } from "./output.js";

interface GlobalOptions {
  json?: boolean;
}

interface JsonCommandOptions {
  json?: boolean;
}

interface LocationOptions {
  region?: string;
  comuna?: string;
  bancario?: boolean;
}

function toHolidayOptions(options: LocationOptions) {
  return { bank: options.bancario, commune: options.comuna, region: options.region };
}

export function createProgram(): Command {
  const program = new Command();

  program
    .name("chilekit")
    .description("CLI y MCP open-source para consultar datos publicos chilenos.")
    .version(VERSION)
    .option("--json", "emite salida JSON para agentes y scripts")
    .showHelpAfterError("(usa --help para ver ejemplos)")
    .showSuggestionAfterError();

  program
    .command("feriados")
    .description("Lista feriados chilenos de un año.")
    .argument("[year]", "año a consultar", parseInteger("año", 1900, 2200), currentYearInChile())
    .option("--json", "emite salida JSON para agentes y scripts")
    .option("--live", "consulta la fuente remota cuando este disponible")
    .option("--region <region>", "incluye feriados regionales de esta region")
    .option("--comuna <comuna>", "incluye feriados regionales y comunales de esta comuna")
    .option("--bancario", "incluye el 31 de diciembre (sin atencion bancaria)")
    .action(
      async (year: number, options: JsonCommandOptions & LocationOptions & { live?: boolean }) => {
        const output = getOutputOptions(program, options);
        const holidays = await getHolidays(year, {
          ...toHolidayOptions(options),
          live: options.live,
        });

        if (output.json) {
          printJson({ holidays, source: "feriados", year });
          return;
        }

        printRows(
          ["fecha", "nombre", "tipo", "irrenunciable"],
          holidays.map((holiday) => [
            holiday.date,
            holiday.appliesTo ? `${holiday.name} (${holiday.appliesTo})` : holiday.name,
            holiday.type,
            holiday.inalienable ? "si" : "no",
          ]),
        );
      },
    );

  program
    .command("feriado")
    .description("Indica si una fecha ISO es feriado en Chile.")
    .argument("[date]", "fecha YYYY-MM-DD", parseIsoDate, todayInChile())
    .option("--json", "emite salida JSON para agentes y scripts")
    .option("--live", "consulta la fuente remota cuando este disponible")
    .option("--region <region>", "incluye feriados regionales de esta region")
    .option("--comuna <comuna>", "incluye feriados regionales y comunales de esta comuna")
    .option("--bancario", "incluye el 31 de diciembre (sin atencion bancaria)")
    .action(
      async (date: string, options: JsonCommandOptions & LocationOptions & { live?: boolean }) => {
        const output = getOutputOptions(program, options);
        const holiday = await getHoliday(date, {
          ...toHolidayOptions(options),
          live: options.live,
        });

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
      },
    );

  program
    .command("proximo-feriado")
    .description("Muestra el proximo feriado desde una fecha (por defecto hoy).")
    .argument("[date]", "fecha YYYY-MM-DD", parseIsoDate, todayInChile())
    .option("--json", "emite salida JSON para agentes y scripts")
    .option("--region <region>", "incluye feriados regionales de esta region")
    .option("--comuna <comuna>", "incluye feriados regionales y comunales de esta comuna")
    .option("--bancario", "incluye el 31 de diciembre (sin atencion bancaria)")
    .action(async (date: string, options: JsonCommandOptions & LocationOptions) => {
      const output = getOutputOptions(program, options);
      const next = await getNextHoliday(date, toHolidayOptions(options));

      if (output.json) {
        printJson(next);
        return;
      }

      process.stdout.write(
        `${next.holiday.date}: ${next.holiday.name} (en ${next.daysUntil} ${next.daysUntil === 1 ? "dia" : "dias"})\n`,
      );
    });

  program
    .command("habiles")
    .description(
      "Cuenta dias habiles entre dos fechas: desde el dia siguiente a <desde> hasta <hasta>.",
    )
    .argument("<desde>", "fecha YYYY-MM-DD", parseIsoDate)
    .argument("<hasta>", "fecha YYYY-MM-DD", parseIsoDate)
    .option("--sabado-habil", "cuenta los sabados como dias habiles")
    .option("--json", "emite salida JSON para agentes y scripts")
    .option("--region <region>", "incluye feriados regionales de esta region")
    .option("--comuna <comuna>", "incluye feriados regionales y comunales de esta comuna")
    .option("--bancario", "incluye el 31 de diciembre (sin atencion bancaria)")
    .action(
      async (
        from: string,
        to: string,
        options: JsonCommandOptions & LocationOptions & { sabadoHabil?: boolean },
      ) => {
        const output = getOutputOptions(program, options);
        const result = await countBusinessDays(from, to, {
          ...toHolidayOptions(options),
          saturdayIsBusinessDay: options.sabadoHabil,
        });

        if (output.json) {
          printJson(result);
          return;
        }

        process.stdout.write(`${result.businessDays} dias habiles entre ${from} y ${to}.\n`);
        printHolidayList("Feriados excluidos", result.holidaysExcluded);
      },
    );

  program
    .command("sumar-habiles")
    .description("Suma dias habiles a una fecha (sin contar la fecha inicial).")
    .argument("<fecha>", "fecha YYYY-MM-DD", parseIsoDate)
    .argument("<dias>", "dias habiles a sumar (1-1000)", parseInteger("dias", 1, 1000))
    .option("--sabado-habil", "cuenta los sabados como dias habiles")
    .option("--json", "emite salida JSON para agentes y scripts")
    .option("--region <region>", "incluye feriados regionales de esta region")
    .option("--comuna <comuna>", "incluye feriados regionales y comunales de esta comuna")
    .option("--bancario", "incluye el 31 de diciembre (sin atencion bancaria)")
    .action(
      async (
        from: string,
        days: number,
        options: JsonCommandOptions & LocationOptions & { sabadoHabil?: boolean },
      ) => {
        const output = getOutputOptions(program, options);
        const result = await addBusinessDays(from, days, {
          ...toHolidayOptions(options),
          saturdayIsBusinessDay: options.sabadoHabil,
        });

        if (output.json) {
          printJson(result);
          return;
        }

        process.stdout.write(`${from} + ${days} dias habiles = ${result.date}\n`);
        printHolidayList("Feriados saltados", result.holidaysSkipped);
      },
    );

  program
    .command("indicador")
    .description(`Consulta un indicador economico: ${INDICATOR_CODES.join(", ")}.`)
    .argument("<codigo>", "codigo del indicador, por ejemplo uf, dolar o utm")
    .argument("[date]", "fecha YYYY-MM-DD o 'hoy' (por defecto, ultimo valor publicado)")
    .option("--json", "emite salida JSON para agentes y scripts")
    .action(async (code: string, date: string | undefined, options: JsonCommandOptions) => {
      await printIndicator(program, code, date, options);
    });

  for (const code of ["uf", "dolar", "utm"] as const) {
    program
      .command(code)
      .description(
        `Consulta ${code === "uf" ? "la UF" : code === "dolar" ? "el dolar observado" : "la UTM"} desde mindicador.cl.`,
      )
      .argument("[date]", "fecha YYYY-MM-DD o 'hoy' (por defecto, ultimo valor publicado)")
      .option("--json", "emite salida JSON para agentes y scripts")
      .action(async (date: string | undefined, options: JsonCommandOptions) => {
        await printIndicator(program, code, date, options);
      });
  }

  program
    .command("convertir")
    .description("Convierte montos entre pesos, UF, UTM, dolar y euro.")
    .argument("<monto>", "monto, por ejemplo 3,5 o 1.500.000", parseAmount)
    .argument("<de>", "unidad de origen: clp, uf, utm, dolar o euro")
    .argument("[a]", "unidad de destino", "clp")
    .option("--fecha <fecha>", "fecha del valor YYYY-MM-DD (por defecto hoy)", parseIsoDate)
    .option("--json", "emite salida JSON para agentes y scripts")
    .action(
      async (
        amount: number,
        from: string,
        to: string,
        options: JsonCommandOptions & { fecha?: string },
      ) => {
        const output = getOutputOptions(program, options);
        const result = await convertCurrency(
          amount,
          resolveCurrencyUnit(from),
          resolveCurrencyUnit(to),
          { date: options.fecha },
        );

        if (output.json) {
          printJson(result);
          return;
        }

        process.stdout.write(
          `${formatAmount(result.amount, result.from)} = ${formatAmount(result.result, result.to)} (${result.date})\n`,
        );

        for (const rate of result.rates) {
          const note = rate.date === rate.requestedDate ? "" : ` (ultimo publicado, ${rate.date})`;
          process.stdout.write(
            `  1 ${rate.code.toUpperCase()} = $${formatNumber(rate.value)}${note}\n`,
          );
        }
      },
    );

  program
    .command("reajustar")
    .description("Reajusta un monto en pesos segun la variacion de la UF entre dos fechas.")
    .argument("<monto>", "monto en pesos, por ejemplo 1.000.000", parseAmount)
    .argument("<desde>", "fecha original YYYY-MM-DD", parseIsoDate)
    .argument("[hasta]", "fecha de reajuste YYYY-MM-DD (por defecto hoy)", parseIsoDate)
    .option("--json", "emite salida JSON para agentes y scripts")
    .action(
      async (amount: number, from: string, to: string | undefined, options: JsonCommandOptions) => {
        const output = getOutputOptions(program, options);
        const result = await adjustByUf(amount, from, to);

        if (output.json) {
          printJson(result);
          return;
        }

        process.stdout.write(
          `${formatAmount(result.amount, "clp")} de ${result.from} = ${formatAmount(result.result, "clp")} al ${result.to} (${result.variationPercent >= 0 ? "+" : ""}${formatNumber(result.variationPercent)}%)\n`,
        );
        process.stdout.write(
          `  UF ${result.from}: $${formatNumber(result.ufFrom.value)} · UF ${result.to}: $${formatNumber(result.ufTo.value)}\n`,
        );
      },
    );

  program
    .command("indicadores")
    .description("Ultimo valor de todos los indicadores economicos.")
    .option("--json", "emite salida JSON para agentes y scripts")
    .action(async (options: JsonCommandOptions) => {
      const output = getOutputOptions(program, options);
      const indicators = await getLatestIndicators();

      if (output.json) {
        printJson({ indicators });
        return;
      }

      printRows(
        ["codigo", "nombre", "valor", "unidad", "fecha"],
        indicators.map((item) => [item.code, item.name, item.value, item.unit, item.date]),
      );
    });

  program
    .command("hora")
    .description("Hora oficial actual en Chile y el proximo cambio de hora.")
    .option("--region <region>", "region, para usar su huso horario")
    .option("--comuna <comuna>", "comuna, para usar su huso horario (ej. Isla de Pascua)")
    .option("--json", "emite salida JSON para agentes y scripts")
    .action((options: JsonCommandOptions & { region?: string; comuna?: string }) => {
      const output = getOutputOptions(program, options);
      const time = getTimeFor({ commune: options.comuna, region: options.region });

      if (output.json) {
        printJson(time);
        return;
      }

      process.stdout.write(
        `${time.localDateTime.replace("T", " ")} (UTC${time.utcOffset}) · ${time.name}\n`,
      );
      process.stdout.write(
        time.nextChange
          ? `Proximo cambio: ${describeTimeChange(time.nextChange)}\n`
          : "Este huso no tiene cambios de hora programados.\n",
      );
    });

  program
    .command("cambio-hora")
    .description("Cambios de hora del año en cada huso horario de Chile.")
    .argument("[year]", "año a consultar", parseInteger("año", 1970, 2200), currentYearInChile())
    .option("--json", "emite salida JSON para agentes y scripts")
    .action((year: number, options: JsonCommandOptions) => {
      const output = getOutputOptions(program, options);
      const changes = getTimeChanges(year);

      if (output.json) {
        printJson({ changes, year });
        return;
      }

      printRows(
        ["huso", "cambio", "utc"],
        changes.map((change) => [
          CHILE_TIME_ZONES[change.zone].name,
          describeTimeChange(change),
          `${change.offsetBefore} -> ${change.offsetAfter}`,
        ]),
      );
      process.stdout.write("Magallanes mantiene UTC-3 todo el año.\n");
    });

  program
    .command("rut")
    .description(
      "Valida formato y digito verificador de un RUT, localmente y sin consultar identidad.",
    )
    .argument("<rut>", "RUT con o sin puntos y guion")
    .option("--json", "emite salida JSON para agentes y scripts")
    .action((rut: string, options: JsonCommandOptions) => {
      const output = getOutputOptions(program, options);
      const result = validateRut(rut);

      if (output.json) {
        printJson(result);
        return;
      }

      process.stdout.write(
        result.valid ? `${result.formatted} es valido.\n` : `RUT invalido: ${rut}\n`,
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
      const candidates = commune ? [] : searchCommunes(name);

      if (output.json) {
        printJson({ candidates, commune: commune ?? null, query: name });
        return;
      }

      if (!commune && candidates.length > 0) {
        process.stdout.write(`"${name}" es ambiguo. Coincidencias:\n`);
        printRows(
          ["comuna", "provincia", "region"],
          candidates.map((item) => [item.name, item.provinceName, item.regionName]),
        );
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
    .option("--rows <rows>", "cantidad de resultados (1-20)", parseInteger("rows", 1, 20), 5)
    .action(async (query: string, options: JsonCommandOptions & { rows: number }) => {
      const output = getOutputOptions(program, options);
      const datasets = await searchOpenDatasets(query, { rows: options.rows });

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
    .option("--limit <limit>", "cantidad de resultados (1-50)", parseInteger("limit", 1, 50), 10)
    .action((query: string, options: JsonCommandOptions & { limit: number }) => {
      const output = getOutputOptions(program, options);
      const sources = searchSources(query, { limit: options.limit });

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

async function printIndicator(
  program: Command,
  code: string,
  date: string | undefined,
  options: JsonCommandOptions,
): Promise<void> {
  const output = getOutputOptions(program, options);
  const indicator = await getIndicator(code, { date });

  if (output.json) {
    printJson({ indicator });
    return;
  }

  process.stdout.write(
    `${indicator.date} ${indicator.name}: ${indicator.value} ${indicator.unit}\n`,
  );
}

function printHolidayList(title: string, holidays: Array<{ date: string; name: string }>): void {
  if (holidays.length === 0) {
    return;
  }

  process.stdout.write(`${title}:\n`);
  printRows(
    ["fecha", "nombre"],
    holidays.map((holiday) => [holiday.date, holiday.name]),
  );
}

function describeTimeChange(change: {
  localBefore: string;
  localAfter: string;
  clocks: string;
}): string {
  const [day, time] = change.localBefore.split("T");
  const after = change.localAfter.split("T")[1];

  return `${day} a las ${time} se ${change.clocks === "atrasar" ? "atrasan" : "adelantan"} los relojes a las ${after}`;
}

function parseAmount(value: string): number {
  try {
    return parseChileanNumber(value);
  } catch (error) {
    throw new InvalidArgumentError(error instanceof Error ? error.message : String(error));
  }
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-CL", { maximumFractionDigits: 4 }).format(value);
}

function formatAmount(value: number, unit: string): string {
  return unit === "clp"
    ? `$${formatNumber(value)}`
    : `${formatNumber(value)} ${unit.toUpperCase()}`;
}

function parseInteger(label: string, min: number, max: number) {
  return (value: string): number => {
    const parsed = Number(value);

    if (!/^\d+$/.test(value.trim()) || parsed < min || parsed > max) {
      throw new InvalidArgumentError(`${label} debe ser un entero entre ${min} y ${max}.`);
    }

    return parsed;
  };
}

function parseIsoDate(value: string): string {
  try {
    return assertIsoDate(value);
  } catch {
    throw new InvalidArgumentError("se esperaba una fecha valida YYYY-MM-DD.");
  }
}
