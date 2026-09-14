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

## Continuación · títulos sociales de los cinco índices

Base f253c0d. Se corrige el nombre en og:title de Casos, Sobre mí, Investigación,
Proceso y Artículos mediante PERSON_LEGAL_NAME existente. Se mantienen intactas
descripciones, imágenes, rutas, credenciales y contenido visible. La nota anterior
de títulos sociales pendientes se conserva como histórico, no como estado actual
de estos cinco índices.

- RED c7d494: los cinco controles OG fallan por nombre incompleto; los once
  controles anteriores pasan sobre el artefacto precedente.
- Build aislado 396241 salida 0, TypeScript y 29 páginas. Base f253c0d más delta
  explícito de cinco páginas, no checkout del commit final.
- GREEN 0ce0ad: 16/16 controles; presupuesto público de diez rutas sin regresiones
  frente a baseline existente, sin modificarlo. Lint dirigido/diff-check c5cec2/0ce0ad.
- Revisión React: solo imports de constante existente y metadata en servidor;
  no hooks, componentes, fetches ni dependencias nuevos.

Reserva Hub3f2ef0a1. Sin publicación ni invalidación de cachés sociales. No prueba
de vistas previas en LinkedIn/Google. No se amplía este cierre a todas las cadenas
abreviadas del sitio ni a las descripciones. Siguiente: revisión factual del Hub y
pendientes operativos independientes del CMS.
