# Agent Usage

ChileKit es CLI-first para agentes.

La experiencia practica suele ser que los agentes consumen mejor comandos simples que
servidores MCP persistentes. Por eso el contrato principal es:

```bash
chilekit <command> --json
```

Tambien funciona:

```bash
chilekit --json <command>
```

## Reglas de contrato CLI

- No hay prompts interactivos.
- La salida machine-readable va por `stdout`.
- Los errores van por `stderr`.
- Exit code `0` significa exito.
- Exit code `1` significa error operacional o validacion fallida.
- `--json` esta disponible como opcion global y en comandos principales.

## Ejemplos

```bash
chilekit feriados 2026 --json
chilekit uf hoy --json
chilekit comunas --region "Biobío" --json
chilekit datasets "salud" --json
chilekit search "ipc abril 2026" --json
chilekit source banco-central --json
```

## Cuando usar MCP

Usa MCP cuando el cliente ya tenga buen manejo de tools, sesion persistente y schemas.
Para una consulta unica desde un agente, el CLI suele ser mas robusto y auditable.

```bash
chilekit mcp
```
