# @chilekit/mcp

Servidor MCP por stdio de [ChileKit](https://github.com/ferando855/chilekit): feriados,
días hábiles, indicadores económicos, regiones, comunas y datasets de datos.gob.cl para
agentes de IA. Sin API keys.

```bash
claude mcp add chilekit -- npx -y @chilekit/mcp
```

```json
{
  "mcpServers": {
    "chilekit": { "command": "npx", "args": ["-y", "@chilekit/mcp"] }
  }
}
```

Todas las tools son de solo lectura (`readOnlyHint`) y las que usan red lo declaran con
`openWorldHint`. El texto de fuentes externas se limpia antes de entregarse al modelo.
Ver el [threat model](https://github.com/ferando855/chilekit/blob/main/docs/threat-model.md).

Lista de tools y configuración para otros clientes en el
[README del proyecto](https://github.com/ferando855/chilekit#conectar-a-tu-agente).
