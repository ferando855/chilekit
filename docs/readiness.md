# Readiness Open Source

Checklist para mantener el repo publico sin ruido:

- Licencia MIT.
- `SECURITY.md` con politica de reporte.
- `CONTRIBUTING.md` con reglas de datos y calidad.
- CI en Node 22 y 24.
- Dependabot para npm y GitHub Actions.
- CodeQL para JavaScript/TypeScript.
- Tests sin red externa.
- `pnpm audit --audit-level moderate`.
- Templates de bug, feature y PR.
- Sin secretos ni `.env` commiteados.
- Contrato CLI-first para agentes documentado en `docs/agents.md`.
