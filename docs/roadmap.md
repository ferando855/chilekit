# Roadmap

## 0.1.0

- Monorepo publico con paquetes `core`, `sources`, `cli` y `mcp`.
- CLI y MCP con feriados, UF, comunas, datasets y catalogo de fuentes.

## 0.2.0

- Binarios que funcionan instalados via npm/npx (`chilekit`, `chilekit-mcp`).
- 11 indicadores economicos, dias habiles, proximo feriado y validacion de RUT.
- Endurecimiento para agentes: allowlist de hosts, timeouts, topes de tamaño,
  saneamiento de datos externos y anotaciones MCP.
- Supply chain: acciones fijadas por SHA, zizmor, dependency review, Scorecard y
  publicacion con provenance.

## 0.3.x

- Banco Central BDE como fuente oficial de UF, dolar e IPC, con credenciales opcionales
  (mindicador publica el IPC con meses de retraso).
- Feriados desde fuente oficial (BCN / datos.gob.cl) y verificacion cruzada con Boostr.
- Cache local opcional para fuentes lentas o inestables.
- Salida `csv` y `ndjson` en comandos de listas.
- `structuredContent` y `outputSchema` en las tools MCP.

## 0.4.x

- ChileCompra con rate limits documentados.
- BCN: busqueda de normas y citas.
- INE: busqueda de series.
- CNE: precios de combustibles por comuna.
- Recursos MCP para manifiestos de fuentes.
