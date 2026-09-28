# Security Policy

## Versiones soportadas

Mientras ChileKit este en `0.x`, solo la ultima version publicada recibe parches de
seguridad.

## Reportar una vulnerabilidad

**No abras un issue publico.** Usa el reporte privado de GitHub:

<https://github.com/ferando855/chilekit/security/advisories/new>

Incluye:

- Version o commit afectado.
- Comando CLI o tool MCP afectada.
- Pasos de reproduccion o prueba de concepto.
- Impacto esperado.

Compromiso de respuesta: acuse de recibo en 72 horas y evaluacion inicial en 7 dias.
Coordinamos la divulgacion contigo y damos credito en el advisory si lo deseas.

## Alcance

Nos interesan especialmente:

- Formas de que datos de una fuente externa alteren la terminal del usuario o el
  comportamiento de un agente mas alla de lo documentado en el threat model.
- Salir de la allowlist de hosts (SSRF) o hacer que ChileKit contacte destinos no
  declarados.
- Cuelgues o consumo de memoria sin limite provocados por input o por respuestas remotas.
- Exposicion de datos personales, o cualquier via para usar ChileKit como rutificador.
- Problemas en la cadena de build y publicacion (workflows, dependencias).

El modelo de amenazas completo esta en [docs/threat-model.md](docs/threat-model.md).

## Politica de datos personales

ChileKit no acepta rutificadores, scraping de identidades, domicilios, telefonos,
correos personales ni bases de datos que unan RUT con personas naturales.

La validacion local de RUT como formato/digito verificador es aceptable. Consultar o
inferir identidad asociada a un RUT no lo es.
