# Umami — integración pública

Autorización: Manuel proporcionó el website ID y aprobó integrar, probar y publicar el seguimiento el 15-09-2026.

- Website: `7c0010a4-8f44-4340-8ee2-d8a7bda1152c` (identificador público, no credencial).
- Script oficial: `https://cloud.umami.is/script.js`, cargado después de la hidratación, solo en HTTPS y `manuelgarciallera.com`.
- Sin dependencias nuevas. El coste añadido es el bootstrap estático y una descarga externa diferida, no código CMS en el bundle público.
- Una página vista por carga/navegación SPA; sin eventos personales, sesiones grabadas, parámetros, fragmentos, títulos ni contenidos de formularios. Referencia limitada al origen.
- DNT/GPC impiden incluso cargar el script. Local y preview no cargan seguimiento.
- Página `/privacidad` y enlace en el pie. Aviso informativo, no certificación legal.

## Verificación previa

- 261 pruebas unitarias, TypeScript y lint: PASS.
- `node --test scripts/tests/umami-browser.test.mjs`: PASS usando script real, colección interceptada (no contamina el panel); comprueba carga inicial, navegación SPA, no duplicado y bloqueo de eventos personalizados.
- Build Next aislado `.owner-verification-builds/umami-release`: PASS, 30 páginas.
- Frontera pública: PASS, 22 entradas.
- Privacidad inspeccionada en navegador local; viewport 320: scrollWidth 305, sin desbordamiento y sin tracker local.

## Alcance de cierre

La instalación del tracker no equivale a un conector del Dashboard CMS. El conector autenticado y la confirmación visual del dato dentro de la cuenta Umami siguen separados. No se ha solicitado ni guardado una API key. Comprobar el despliegue público tras publicar; no inferirlo de este documento.

Rollback de referencia: producción anterior `dpl_7ANJZytUU4Xg8sLosVYko8zkWsbh` (runtime `3e18af2`).
