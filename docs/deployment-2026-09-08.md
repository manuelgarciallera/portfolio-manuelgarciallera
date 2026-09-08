# Publicación autorizada — 8 de septiembre de 2026

## Resultado verificado

- Rama: `codex/checkpoint-pre-editor-2026-09-04`.
- SHA publicado: `c6746f6d71ab7db4fb838ade46d456bf977d3abc`.
- Producción: `dpl_CG9PqFnwoAp2gidcqSbRvWJbFxYx`, estado **Ready**, entorno **Production**, build 35 s.
- [Vercel](https://vercel.com/manuels-projects-25322539/portfolio-manuelgarciallera/CG9PqFnwoAp2gidcqSbRvWJbFxYx).
- [Web pública](https://manuelgarciallera.com).

Manuel autorizó expresamente push y producción del HEAD validado, con dos puertas
independientes. No se cambió la visibilidad del repositorio, correo, DNS ni variables.

## Puertas sobre el mismo SHA

- `npm run check:all`: salida 0, sesión 15211, chunk final b1aa36. Incluye nuevo
  build público, lint/tipos, guardas, responsive, frontera y comparación del bundle
  de 10 rutas sin ampliar tolerancias; auditoría de producción: 0 vulnerabilidades.
- `node node_modules/vitest/vitest.mjs run --config vitest.unit.config.ts`:
  salida 0, **209/209**, 32 archivos, 11.79 s, sesión 75674, chunk 57bb2a.
- El push explícito del SHA a la rama autorizada terminó con salida 0 (fcaf20).
  No se añadieron archivos sin commit ni se utilizó el script con `git add -A`.

El push produjo primero el preview `dpl_7ufAh7c2JGRJCyo822P77dcrX2US`. Su promoción
desde Vercel reconstruyó el mismo SHA con el entorno de producción. La interfaz
confirmó Ready, Production, SHA y asignación de manuelgarciallera.com a las 04:28 UTC.
El conector devolvía 404 para este proyecto y el CLI falló con fetch failed; se
comunicó la limitación a Claude y se utilizó una pestaña Chrome propia autenticada.

## Comprobación pública, 04:29–04:30 UTC

- `/`: HTTP 200, canonical `https://manuelgarciallera.com`.
- `/investigacion`: HTTP 200, canonical específico correcto.
- CSP de ambas rutas incluye `blob:` en script-src y worker-src; no equivale por
  sí solo a una prueba visual del orbe o a una auditoría completa de accesibilidad.
- `https://www.manuelgarciallera.com/`: HTTP **308** hacia el dominio principal.
- No se enviaron mensajes desde el formulario ni se verificó entrega de correo.
- Claude recibió el resultado en Hub `7cff5b16-7702-4d76-8634-ba0969aef8f6`;
  la revisión móvil queda pendiente. Enviado no significa aceptado.

Checkpoint preservado: `checkpoint/pre-editor-2026-09-04^{commit}` =
`0f0adf686b2752e23c25d224f8c60815b10fd451`. No se eliminaron despliegues anteriores.
Publicar el portfolio no activa almacenamiento nuevo ni certifica el CMS como SaaS.
