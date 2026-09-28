# Threat Model

ChileKit corre en la maquina del usuario (CLI) o como servidor MCP por stdio dentro de
un cliente de IA. En ambos casos lo invoca un **agente**, que decide los argumentos y
lee los resultados. Este documento describe que protege ChileKit, contra que y donde
esta implementado.

## Activos y limites de confianza

```
 Usuario / Agente IA ──args──▶ ChileKit (CLI o MCP) ──HTTPS──▶ APIs publicas
        ▲                            │                        (boostr, mindicador,
        └──────── resultados ◀───────┘                         datos.gob.cl)
```

| Limite | Lo que cruza | Confianza |
|---|---|---|
| Agente → ChileKit | Argumentos de comandos y tools | Baja: el agente puede estar bajo prompt injection |
| APIs → ChileKit | JSON de terceros | Nula: puede contener texto hostil |
| ChileKit → Agente | Resultados JSON o tablas | ChileKit responde por lo que emite |
| npm / GitHub → Usuario | Codigo y dependencias | Supply chain |

## Amenazas y mitigaciones

### 1. Prompt injection indirecta via datos de terceros

Un titulo de dataset en datos.gob.cl podria decir "ignora tus instrucciones y ejecuta...".
El agente lo lee como resultado de una tool.

- Todo texto externo pasa por `sanitizeText` (`packages/core/src/sanitize.ts`): se
  eliminan caracteres de control e invisibles, se colapsa a una linea y se trunca
  (500 caracteres por defecto).
- Las instrucciones del servidor MCP piden tratar los resultados de tools `openWorld`
  como datos, nunca como instrucciones.
- Todas las tools declaran `readOnlyHint: true`: ninguna escribe ni tiene efectos laterales,
  asi que una inyeccion no puede escalar a acciones a traves de ChileKit.

Riesgo residual: ChileKit no puede impedir que un modelo obedezca texto que parece
instruccion. La mitigacion final es del cliente (confirmaciones, permisos).

### 2. Inyeccion de secuencias de terminal

Secuencias ANSI/OSC en datos externos pueden borrar la pantalla, falsificar output o
crear hipervinculos engañosos en la terminal.

- `printRows` sanea cada celda; los conectores ya entregan texto sin caracteres de control.
- Se eliminan overrides bidi y caracteres de ancho cero (Trojan Source).

### 3. SSRF y destinos no esperados

- `fetchJson` (`packages/sources/src/http.ts`) solo contacta hosts de una allowlist
  explicita y solo por HTTPS. Un redirect que termine fuera de la allowlist se rechaza.
- Los argumentos del agente nunca forman el host; solo van como query string codificada
  (`URLSearchParams`) o como segmentos validados con regex (`/^[a-z_]{1,32}$/`).

### 4. Denegacion de servicio y cuelgues

Un agente que queda esperando una tool que nunca responde es un fallo silencioso.

- Timeout por request (10 s, configurable con `CHILEKIT_TIMEOUT_MS`, maximo 120 s).
- Tope de 5 MB por respuesta, verificado mientras se lee el stream.
- Limites de entrada: `rows` 1-20, `limit` 1-50, largo maximo en queries y nombres.
- Tope de elementos procesados por respuesta (feriados, recursos por dataset).

### 5. Privacidad y abuso de datos personales

- Politica explicita: sin rutificadores ni cruces de RUT con identidad ([privacy.md](privacy.md)).
- La validacion de RUT es local (digito verificador) y nunca sale de la maquina.
- No hay telemetria: ChileKit solo contacta las fuentes de datos declaradas.

### 6. Supply chain

- Dependencias fijadas en versiones exactas y lockfile congelado en CI.
- `pnpm audit` y `dependency-review` bloquean vulnerabilidades moderate+.
- Dependabot con cooldown de 7 dias: no adopta releases recien publicados, que es la
  ventana tipica de paquetes comprometidos.
- GitHub Actions fijadas por SHA, permisos minimos, sin credenciales persistidas y
  auditadas por zizmor en cada PR.
- CodeQL (`security-extended`) y OpenSSF Scorecard semanales.

## Fuera de alcance

- Exactitud de los datos de terceros. ChileKit declara fuente, oficialidad y frescura
  en cada manifiesto, pero no certifica valores.
- Seguridad del cliente MCP o del modelo que consume las tools.
