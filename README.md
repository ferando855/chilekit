# ChileKit

[![CI](https://github.com/ferando855/chilekit/actions/workflows/ci.yml/badge.svg)](https://github.com/ferando855/chilekit/actions/workflows/ci.yml)
[![CodeQL](https://github.com/ferando855/chilekit/actions/workflows/codeql.yml/badge.svg)](https://github.com/ferando855/chilekit/actions/workflows/codeql.yml)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/ferando855/chilekit/badge)](https://scorecard.dev/viewer/?uri=github.com/ferando855/chilekit)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Datos públicos de Chile para terminales, scripts y agentes de IA: feriados, días hábiles,
UF, dólar, UTM, regiones, comunas y datasets de datos.gob.cl. Funciona como **CLI** con
salida JSON y como **servidor MCP**.

```bash
$ npx @chilekit/cli sumar-habiles 2026-09-28 20
2026-09-28 + 20 dias habiles = 2026-10-27
Feriados saltados:
fecha       nombre
----------  -----------------------
2026-10-12  Encuentro de Dos Mundos
```

Los modelos de lenguaje no saben el valor de la UF de hoy, no conocen los feriados que
agrega cada ley y se equivocan contando días hábiles. ChileKit les da esas respuestas
desde fuentes trazables, sin credenciales y sin rutificadores.

> **English:** ChileKit is a CLI and MCP server that gives AI agents reliable access to
> Chilean public data (holidays, business-day math, economic indicators, territorial
> divisions, open datasets), hardened for agent use: host allowlist, timeouts, size caps,
> and sanitization of third-party text. See [docs/threat-model.md](docs/threat-model.md).

## Conectar a tu agente

El servidor MCP corre por stdio con `npx -y @chilekit/mcp`. No requiere API keys.

<details open>
<summary><b>Claude Code</b></summary>

```bash
claude mcp add chilekit -- npx -y @chilekit/mcp
```
</details>

<details>
<summary><b>Claude Desktop</b> (<code>claude_desktop_config.json</code>)</summary>

```json
{
  "mcpServers": {
    "chilekit": {
      "command": "npx",
      "args": ["-y", "@chilekit/mcp"]
    }
  }
}
```
</details>

<details>
<summary><b>Cursor</b> (<code>.cursor/mcp.json</code>)</summary>

```json
{
  "mcpServers": {
    "chilekit": {
      "command": "npx",
      "args": ["-y", "@chilekit/mcp"]
    }
  }
}
```
</details>

<details>
<summary><b>VS Code</b> (<code>.vscode/mcp.json</code>)</summary>

```json
{
  "servers": {
    "chilekit": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@chilekit/mcp"]
    }
  }
}
```
</details>

<details>
<summary><b>Codex CLI</b> (<code>~/.codex/config.toml</code>)</summary>

```toml
[mcp_servers.chilekit]
command = "npx"
args = ["-y", "@chilekit/mcp"]
```
</details>

¿Tu agente ejecuta comandos de shell? Entonces no necesitas MCP: `chilekit <comando> --json`
es el contrato recomendado ([docs/agents.md](docs/agents.md)). También hay una
[Agent Skill](skills/chilekit/SKILL.md) lista para copiar.

## Comandos

| Comando | Qué hace |
|---|---|
| `chilekit feriados [año]` | Feriados del año |
| `chilekit feriado [fecha]` | ¿Es feriado esa fecha? |
| `chilekit proximo-feriado [fecha]` | Próximo feriado y cuántos días faltan |
| `chilekit habiles <desde> <hasta>` | Días hábiles en `(desde, hasta]` |
| `chilekit sumar-habiles <fecha> <n>` | Fecha tras sumar `n` días hábiles |
| `chilekit indicadores` | Último valor de los 11 indicadores |
| `chilekit indicador <codigo> [fecha]` | UF, dólar, euro, UTM, IPC, Imacec, TPM, IVP, cobre, desempleo, bitcoin |
| `chilekit uf` · `dolar` · `utm` | Atajos |
| `chilekit convertir <monto> <de> [a]` | Convierte entre pesos, UF, UTM, dólar y euro (`3,5 uf`, `1.500.000 clp uf`) |
| `chilekit reajustar <monto> <desde> [hasta]` | Reajusta pesos por la variación de la UF entre dos fechas |
| `chilekit rut <rut>` | Valida dígito verificador localmente |
| `chilekit regiones` | Las 16 regiones |
| `chilekit comunas --region <region>` | Comunas de una región (`"Biobío"`, `8`, `VIII`, `RM`, `CL-VS`) |
| `chilekit comuna <nombre>` | Provincia y región de una comuna |
| `chilekit datasets <query>` | Busca en datos.gob.cl |
| `chilekit sources` · `source <id>` · `search <query>` | Catálogo de fuentes |
| `chilekit mcp` | Servidor MCP por stdio |

Todos aceptan `--json`. `habiles` y `sumar-habiles` aceptan `--sabado-habil` para plazos
que solo excluyen domingos y festivos.

## Tools MCP

| Tool | Red | Descripción |
|---|:---:|---|
| `get_holidays` · `get_holiday` · `get_next_holiday` | ✓ | Feriados (2026-2027 sin red) |
| `count_business_days` · `add_business_days` | ✓ | Aritmética de días hábiles, con los feriados considerados |
| `get_economic_indicator` · `get_latest_indicators` | ✓ | Indicadores económicos |
| `convert_currency` · `adjust_by_uf` | ✓ | Conversión CLP/UF/UTM/USD/EUR y reajuste por UF |
| `search_open_datasets` | ✓ | Datasets de datos.gob.cl |
| `validate_rut` | | Dígito verificador, local |
| `list_regions` · `list_communes` · `get_commune_info` | | División territorial |
| `search_chile_sources` · `get_source_manifest` | | Catálogo de fuentes |

Todas son de solo lectura y lo declaran con `readOnlyHint`. Las que salen a internet
declaran `openWorldHint`.

## Fuentes

Cada fuente tiene un manifiesto con origen, oficialidad, autenticación, formatos y
frescura esperada (`chilekit source <id>`).

| Fuente | Datos | Oficial | Estado |
|---|---|:---:|---|
| [Boostr / FeriadosApp](https://docs.boostr.cl/reference/holidays-info) | Feriados | No | Disponible, con snapshot local 2026-2027 |
| [@clregions/data](https://github.com/piperubio/clregions) | Regiones y comunas (BCN/SIIT, ISO) | No | Disponible, sin red |
| [mindicador.cl](https://mindicador.cl/) | Indicadores económicos | No | Disponible |
| [datos.gob.cl](https://datos.gob.cl/) | Datasets abiertos (CKAN) | Sí | Disponible |
| Banco Central, ChileCompra, BCN, INE, SERVEL, SINCA, CNE, IDE Chile, SNIFA | Varios | Sí | Manifiesto; conector en el roadmap |

Los valores que vienen de fuentes no oficiales incluyen `sourceId` y fecha real de
publicación, para que el agente pueda citar y detectar datos desactualizados.

## Seguridad

ChileKit asume que quien lo invoca es un agente y que los datos de terceros pueden ser
hostiles:

- Solo contacta hosts de una allowlist, por HTTPS, con timeout y tope de tamaño.
- Limpia el texto externo de secuencias de terminal, caracteres invisibles y payloads
  largos antes de entregarlo.
- No tiene tools con efectos laterales ni telemetría.
- CI con CodeQL, zizmor, dependency review, OpenSSF Scorecard y acciones fijadas por SHA.

Detalle en [docs/threat-model.md](docs/threat-model.md). Para reportar vulnerabilidades,
ver [SECURITY.md](SECURITY.md).

## Principios de datos

- Solo datos públicos, institucionales o agregados.
- Nada de scraping de personas ni rutificadores. El RUT solo se valida localmente como
  formato y dígito verificador ([docs/privacy.md](docs/privacy.md)).
- Toda fuente declara origen, licencia o términos, frescura y limitaciones.

## Desarrollo

```bash
pnpm install
pnpm check   # lint, typecheck, tests, build, smoke test de binarios y audit
```

Monorepo con cuatro paquetes:

| Paquete | Rol |
|---|---|
| [`@chilekit/core`](packages/core) | Tipos, fechas, RUT y saneamiento de texto |
| [`@chilekit/sources`](packages/sources) | Conectores, manifiestos y cliente HTTP endurecido |
| [`@chilekit/cli`](packages/cli) | Binario `chilekit` |
| [`@chilekit/mcp`](packages/mcp) | Binario `chilekit-mcp` |

Ver [CONTRIBUTING.md](CONTRIBUTING.md) para agregar fuentes y [docs/roadmap.md](docs/roadmap.md)
para lo que viene.

## Licencia

MIT. Ver [LICENSE](LICENSE).
