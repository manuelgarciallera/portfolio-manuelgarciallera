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

## Publicado y comprobado — 19:59 Madrid

- Commit runtime `f72a420`, push confirmado en GitHub.
- Preview `dpl_F2kaCH1TDwSJLvAfNWFumm1Tymzv` Ready; HTML de privacidad y website ID verificados antes de promover.
- Producción `dpl_8LDCkrdVAGvgAvaDCi6UVwNJb8YF` Ready, alias `manuelgarciallera.com` confirmado.
- Prueba opt-in `UMAMI_PRODUCTION_SMOKE=1 node --test scripts/tests/umami-production-smoke.test.mjs`: PASS. HTML 200, colección Umami 200, ID correcto, ruta `/privacidad`, sin título y una única etiqueta de seguimiento.
- Esta prueba sí registra una visita QA real; la prueba interceptada anterior no. La inspección adicional del navegador puede registrar otra visita de QA.
- Página publicada inspeccionada en navegador. Presupuesto público PASS: límites existentes intactos; nueva ruta privacidad 25.223 bytes gzip de chunks propios del build (no incluye script remoto).
- Pendiente solo confirmación visual del dato en la cuenta Umami; la recepción HTTP no acredita por sí sola la presentación del panel. El Dashboard CMS no está conectado todavía.
