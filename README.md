# ChileKit

CLI-first y MCP open-source para consultar datos publicos chilenos desde terminales,
scripts, agentes e IAs.

ChileKit nace como un toolkit personal y publico para juntar fuentes chilenas utiles en
un solo repo, con una regla sencilla: datos publicos, fuentes trazables y cero
rutificadores.

## Estado

Version inicial: `0.1.0`

Paquetes:

- `@chilekit/core`: tipos, normalizacion y utilidades seguras.
- `@chilekit/sources`: manifiestos, conectores y datasets base.
- `@chilekit/cli`: ejecutable `chilekit`.
- `@chilekit/mcp`: servidor MCP por stdio para agentes.

## Instalacion local

```bash
pnpm install
pnpm build
pnpm --filter @chilekit/cli chilekit --help
```

Tambien puedes ejecutar el binario compilado directamente:

```bash
node packages/cli/dist/index.js feriados 2026
```

## Comandos MVP

```bash
chilekit feriados 2026
chilekit uf hoy
chilekit comunas --region "Biobío"
chilekit datasets "salud"
chilekit search "ipc abril 2026"
chilekit source banco-central
chilekit mcp
```

Cada comando soporta `--json` para integraciones:

```bash
chilekit feriados 2026 --json
chilekit uf hoy --json
chilekit comunas --region "Biobío" --json
```

Para agentes, el contrato recomendado es CLI-first. Ver
[docs/agents.md](docs/agents.md).

## MCP

El servidor MCP corre por stdio. Es util para clientes con buen soporte de tools
persistentes; para consultas simples de agentes, prefiere `chilekit <command> --json`.

```bash
chilekit mcp
```

Herramientas incluidas en `0.1.0`:

- `search_chile_sources(query)`
- `get_holidays(year)`
- `get_holiday(date)`
- `get_economic_indicator(indicator, date?)`
- `list_communes(region)`
- `get_commune_info(name)`
- `search_open_datasets(query)`

## Fuentes iniciales

ChileKit separa fuente y herramienta. Cada fuente tiene manifiesto con `id`, nombre,
categoria, autenticacion, formatos, frescura, oficialidad y tools disponibles.

Fuentes registradas en `0.1.0`:

- Feriados legales via Boostr/FeriadosApp como fuente operativa no oficial, con
  fallback local para 2026 y respaldo legal futuro via BCN.
- Division territorial via `@clregions/data`, que compila datos territoriales desde
  fuentes como BCN/SIIT, normas y codigos territoriales.
- Indicadores economicos via `mindicador.cl` para el MVP sin credenciales, y manifiesto
  preparado para Banco Central.
- Datos abiertos via CKAN de `datos.gob.cl`.
- Manifiestos preparados para ChileCompra, BCN, INE, SERVEL, SINCA, CNE, IDE Chile y
  SNIFA/SMA.

## Principios de datos

- Solo datos publicos, institucionales o agregados.
- Nada de scraping de personas, domicilios, identidades o rutificadores.
- RUT solo puede validarse localmente como formato/digito verificador; nunca se consulta
  identidad asociada.
- Toda nueva fuente debe declarar origen, licencia o terminos, frescura esperada y
  limitaciones conocidas.

## Desarrollo

```bash
pnpm install
pnpm check
```

Scripts principales:

- `pnpm lint`: Biome.
- `pnpm typecheck`: TypeScript estricto.
- `pnpm test`: Vitest.
- `pnpm build`: build ESM de paquetes.
- `pnpm audit`: auditoria de dependencias.

## Roadmap corto

Ver [docs/roadmap.md](docs/roadmap.md).

## Licencia

MIT. Ver [LICENSE](LICENSE).
