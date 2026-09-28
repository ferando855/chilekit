# Changelog

## Unreleased

### Agregado

- `convertir` y tool `convert_currency`: montos entre pesos, UF, UTM, dolar y euro en
  cualquier fecha, aceptando formato chileno (`1.500.000`, `3,5`).
- `reajustar` y tool `adjust_by_uf`: reajuste de montos por variacion de la UF.
- Feriados regionales, comunales y bancario (`--region`, `--comuna`, `--bancario` y los
  campos `region`, `commune`, `include_bank_holiday` en MCP): 7 de junio en Arica y
  Parinacota, 20 de agosto en Chillan y Chillan Viejo y 31 de diciembre bancario, tambien
  en el calculo de dias habiles.
- `hora` y `cambio-hora`, tools `get_chile_time` y `get_time_changes`: hora oficial y
  cambios de hora de Chile continental, Magallanes e Isla de Pascua, sin red.
- `en-palabras` y tool `amount_to_words`: montos en palabras segun la RAE para pesos,
  UF, UTM, dolares y euros, con el formato usual de documentos.
- Tools MCP con `structuredContent` ademas del texto JSON.
- `server.json` y job de release para publicar en el registro oficial de MCP.

## 0.2.0

### Corregido

- `chilekit` no hacia nada al instalarse via npm/npx: el entrypoint comparaba rutas y
  fallaba con el symlink de `node_modules/.bin`. Ahora hay binarios dedicados
  (`chilekit` y `chilekit-mcp`) con smoke test en CI.
- Fechas imposibles (`2026-13-45`) se aceptaban; RUT como `1K2K` lanzaban excepcion;
  `--rows`/`--limit` no numericos devolvian resultados vacios en silencio.
- Regiones ambiguas ("Los") se resolvian en silencio a la primera coincidencia.
- La tool MCP `get_holiday` calculaba "hoy" una sola vez, al iniciar el servidor.
- La fecha de los indicadores se calculaba en UTC en vez de hora de Chile.

### Agregado

- Indicadores: dolar, euro, UTM, IPC, Imacec, TPM, IVP, cobre, desempleo y bitcoin,
  ademas de UF (`indicador`, `indicadores`, `dolar`, `utm`).
- Dias habiles: `habiles`, `sumar-habiles` y `proximo-feriado`, con `--sabado-habil`.
- Feriados 2027 incluidos para uso sin red.
- `chilekit rut` para validar digito verificador localmente.
- Regiones por numero romano, codigo e ISO; comunas ambiguas devuelven candidatas.
- Tools MCP: `get_latest_indicators`, `get_next_holiday`, `count_business_days`,
  `add_business_days`, `validate_rut` y `list_regions`.
- Errores en JSON por stderr cuando se usa `--json`.
- Agent Skill (`skills/chilekit`) y configuracion para Claude, Cursor, VS Code y Codex.

### Seguridad

- Cliente HTTP con allowlist de hosts, timeout (`CHILEKIT_TIMEOUT_MS`) y tope de 5 MB.
- Saneamiento de texto externo: secuencias ANSI, caracteres bidi e invisibles, URLs
  no http(s) y payloads largos.
- Anotaciones MCP (`readOnlyHint`, `openWorldHint`) e instrucciones para tratar
  resultados como datos no confiables.
- 41 vulnerabilidades de dependencias resueltas; Node >= 22.12.
- GitHub Actions fijadas por SHA con permisos minimos, zizmor, dependency review,
  CodeQL `security-extended`, OpenSSF Scorecard y cooldown en Dependabot.
- Publicacion en npm con provenance.
- Threat model en `docs/threat-model.md`.

## 0.1.0

- Inicializa monorepo `chilekit` con paquetes `core`, `sources`, `cli` y `mcp`.
- Agrega comandos MVP: feriados, UF, comunas, datasets, search, source y mcp.
- Agrega servidor MCP stdio con herramientas basicas para agentes.
- Agrega manifiestos de fuentes publicas chilenas y politica de privacidad de datos.
- Agrega readiness open source: licencia MIT, contribucion, seguridad, CI, Dependabot,
  templates de issues y PR.
