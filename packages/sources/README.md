# @chilekit/sources

Conectores y manifiestos de fuentes públicas chilenas de
[ChileKit](https://github.com/ferando855/chilekit).

```ts
import { addBusinessDays, getIndicator, listCommunesByRegion } from "@chilekit/sources";

await addBusinessDays("2026-09-28", 20); // { date: "2026-10-27", holidaysSkipped: [...] }
await getIndicator("dolar");
listCommunesByRegion("Biobío");
```

- Toda salida a red pasa por `fetchJson`: allowlist de hosts HTTPS, timeout y tope de tamaño.
- Los conectores aceptan `fetchImpl` para pruebas sin red externa.
- El texto de las fuentes se limpia antes de devolverse.
