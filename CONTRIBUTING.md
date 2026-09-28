# Contribuir a ChileKit

Gracias por mirar este proyecto. ChileKit busca ser util, trazable y aburridamente
seguro con datos publicos chilenos.

## Setup local

```bash
pnpm install
pnpm check
```

## Agregar una fuente

Antes de escribir codigo, agrega o actualiza su manifiesto en `@chilekit/sources` con:

- `id` estable.
- Nombre y categoria.
- Si es oficial o no.
- Requisitos de autenticacion.
- Formatos disponibles.
- Frescura esperada.
- URL de documentacion o portal.
- Herramientas expuestas.
- Limitaciones conocidas.

Luego, en el conector:

1. Agrega el host a `ALLOWED_HOSTS` en `packages/sources/src/http.ts` y usa `fetchJson`.
   No llames a `fetch` directamente.
2. Limpia cada string externo con `sanitizeText` o `sanitizeOptionalText`, y cada URL
   con `sanitizeUrl`, antes de devolverlo.
3. Valida los inputs (rangos, largo, formato) antes de salir a la red.
4. Agrega tests con `fetchImpl` simulado, incluido al menos un payload hostil.
5. Expón la funcionalidad en CLI (con `--json`) y MCP (con `annotations`).

`AGENTS.md` resume estas reglas para agentes de codigo.

## Reglas de datos

- No agregar rutificadores ni fuentes que unan RUT con identidad, direccion, telefono,
  email personal u otros datos personales.
- Preferir APIs oficiales o portales de datos abiertos.
- Si una fuente no es oficial, marcarla como tal y documentar por que se usa.
- Las pruebas no deben depender de red externa.

## Calidad

Todo PR debe pasar:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm smoke
pnpm audit
```

O todo junto con `pnpm check`.

## Versionado

Mientras el proyecto este bajo `0.x`, los cambios pueden moverse rapido. Aun asi, las
herramientas publicas deben mantener ejemplos y changelog claros.
