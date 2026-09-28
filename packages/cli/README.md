# @chilekit/cli

CLI de [ChileKit](https://github.com/ferando855/chilekit): datos públicos de Chile para
terminales, scripts y agentes de IA.

```bash
npx @chilekit/cli feriados 2026
npx @chilekit/cli sumar-habiles 2026-09-28 20
npx @chilekit/cli indicadores --json
```

O instalado globalmente:

```bash
npm install -g @chilekit/cli
chilekit --help
```

- Sin prompts interactivos.
- `--json` en todos los comandos; errores como JSON por `stderr`.
- Exit code `0` para éxito y `1` para errores.

Comandos y semántica completos en el
[README del proyecto](https://github.com/ferando855/chilekit#comandos) y en la
[guía para agentes](https://github.com/ferando855/chilekit/blob/main/docs/agents.md).
