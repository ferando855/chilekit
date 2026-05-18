# Security Policy

## Alcance

Este proyecto expone conectores a datos publicos chilenos, un CLI local y un servidor
MCP por stdio. No debe manejar secretos salvo tokens opcionales de fuentes externas
cuando una integracion futura los requiera.

## Reportar vulnerabilidades

Abre un issue privado si el repo ya esta en GitHub con advisories habilitados. Si no,
contacta al mantenedor por el canal definido en el perfil del repositorio.

Incluye:

- Version o commit afectado.
- Comando o herramienta afectada.
- Pasos de reproduccion.
- Impacto esperado.

## Politica de datos personales

ChileKit no acepta rutificadores, scraping de identidades, domicilios, telefonos,
correos personales ni bases de datos que unan RUT con personas naturales.

La validacion local de RUT como formato/digito verificador es aceptable. Consultar o
inferir identidad asociada a un RUT no lo es.

## Dependencias

CI ejecuta `pnpm audit --audit-level moderate`. Dependabot queda configurado para
actualizar dependencias npm y GitHub Actions semanalmente.
