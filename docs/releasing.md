# Publicar una version

Los paquetes se publican en npm desde GitHub Actions (`.github/workflows/release.yml`)
con **provenance**: npm muestra una atestacion firmada que vincula cada version con el
commit y el workflow que la construyo.

## Configuracion inicial (una vez)

1. Crea la organizacion `chilekit` en npmjs.com (los paquetes usan el scope `@chilekit`).
2. Crea un token granular de npm con permiso de publicacion sobre `@chilekit` y
   guardalo como secret `NPM_TOKEN` del environment `npm` en GitHub
   (Settings → Environments → npm). Opcional: exige aprobacion manual en ese environment.
3. Publica la primera version (seccion siguiente).
4. En npmjs.com, para cada paquete, configura **Trusted Publisher** con GitHub Actions:
   repositorio `ferando855/chilekit`, workflow `release.yml`, environment `npm`.
5. Borra el secret `NPM_TOKEN`. Desde ahi la publicacion usa OIDC, sin tokens de larga
   duracion.

## Cada release

1. Actualiza la version en `package.json` (raiz y los cuatro paquetes) y en
   `packages/sources/src/version.ts`.
2. Agrega la entrada en `CHANGELOG.md`.
3. Mergea a `main` y crea el tag:

   ```bash
   git tag v0.2.0
   git push origin v0.2.0
   ```

El workflow verifica que el tag coincida con todas las versiones, corre `pnpm check`,
empaqueta, publica `core`, `sources`, `mcp` y `cli` en ese orden y crea el GitHub
Release con los tarballs adjuntos.
