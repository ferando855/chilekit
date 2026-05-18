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
pnpm audit
```

## Versionado

Mientras el proyecto este bajo `0.x`, los cambios pueden moverse rapido. Aun asi, las
herramientas publicas deben mantener ejemplos y changelog claros.
