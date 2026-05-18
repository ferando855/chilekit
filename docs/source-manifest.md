# Source Manifest

Cada fuente de ChileKit debe declarar un manifiesto auditable.

```ts
{
  id: "banco-central",
  name: "Banco Central de Chile",
  category: "economia",
  auth: "optional",
  formats: ["json", "csv"],
  freshness: "daily",
  official: true,
  tools: [
    "get_uf",
    "get_dollar",
    "search_series",
    "get_series"
  ]
}
```

## Campos minimos

- `id`: slug estable, sin espacios.
- `name`: nombre humano de la fuente.
- `category`: dominio principal.
- `auth`: `none`, `optional` o `required`.
- `formats`: formatos de datos disponibles.
- `freshness`: frescura esperada.
- `official`: si la fuente es institucional/oficial.
- `tools`: herramientas que ChileKit expone o planea exponer.

## Criterio

Un conector puede estar en `0.1.0` solo como manifiesto si todavia no hay cliente
estable. Eso permite descubrir fuentes sin sobreactuar el soporte real.
