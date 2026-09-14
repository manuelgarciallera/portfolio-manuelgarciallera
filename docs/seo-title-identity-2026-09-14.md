# Nombre completo en títulos interiores

Codex · 14/09/2026 · base 1adf6c1. Corrección local, sin publicación.

La portada usaba SITE_TITLE con el nombre completo, pero la plantilla de títulos
del layout añadía SITE_NAME, deliberadamente abreviado para otros usos. Se cambia
solo la plantilla a PERSON_LEGAL_NAME; no se altera SITE_NAME globalmente, las
descripciones, los títulos Open Graph específicos, los artículos con título
absoluto, el contenido visible, el hero ni la configuración del CMS.

Prueba de regresión sobre HTML generado, no búsqueda de texto en el código:

```powershell
$env:PUBLIC_TITLE_BUILD_DIR='owner-platform/.data/verification-artifacts/release-proof'
node --test scripts/tests/public-title-identity.test.mjs
```

- RED: 10 títulos incompletos y 1 control de configuración aprobado (3415a2),
  artefacto anterior. Casos, Sobre mí, Investigación, Proceso, Artículos y cinco casos.
- GREEN: compilación pública nueva con TypeScript y 29 páginas termina 0
  (0a6972), sobre 1adf6c1 más cambio de una línea. Conserva el directorio de
  desarrollo; reemplaza exclusivamente el artefacto de prueba identificado.
- Los 11 controles del artefacto pasan (a17eec); frontera pública 21 entradas
  correcta. Syntax/lint dirigido/diff-check terminan 0 (d254c9).
- Cargador de fuentes real durante build; no mocks de metadata ni fuentes.

Reserva Hub3471b7e1: el test finalmente vive en scripts/tests, no en src/app,
porque comprobar el HTML compilado verifica la plantilla aplicada por Next sin
simular imports del layout. No se añade una dependencia ni se cambia package.json.
El comando debe ejecutarse explícitamente tras construir el artefacto.

No se ha hecho push, despliegue, solicitud Search Console ni cambio de baseline.
El HTML en producción puede seguir usando los títulos anteriores hasta publicar.
Pendientes independientes: títulos sociales abreviados, revisión factual del caso
Hub, cierre de correo real y criterio histórico de aislamiento del CMS.
