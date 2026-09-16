# Hero: encaje en viewport — 16/09/2026

Petición directa posterior de Manuel: desktop completo en primera pantalla con separación al borde del viewport; móvil primera pantalla con H1 y CTA, esfera/nombre al bajar; nombre subordinado al H1. Base `b218153` más el CSS de esta entrega. Reserva Hub `a0300b5a-c70e-45b0-bfd3-2f9241bd7047`.

## Implementación

Solo maquetación en `src/features/redesign/redesign.css`: columna de texto más ancha, titular con límite dependiente de la altura, espacios verticales adaptativos y borde inferior. Se usa altura mínima, no una altura fija que recorte contenido. En móvil, el bloque de texto ocupa como mínimo `100svh` y la escena sigue en el flujo, fuera del primer viewport. La escala CSS del nombre baja un 12 %; su tamaño final también depende de la nueva anchura de columna. No se modifica el contenido, esfera, materiales, seguimiento ni dependencias.

## Evidencia nueva

- RED antes del cambio: a1280×720 hero829,125px y CTA hasta739,531px, fuera de la pantalla (`25f6c5`).
- GREEN en desarrollo y en build de producción local: 12 escenarios de `scripts/verify-hero-viewport.mjs`; anchos320–1920, seis desktop/tablet y cuatro móviles, más dos cambios de tamaño de fuente raíz al200 %. No equivalen a una auditoría universal de zoom/texto: el H1 emplea también unidades de viewport. Las mediciones se hacen con aviso cerrado sin consentir.
- Producción: desktop1280×720 separador720/CTA549,17; desktop1024×600 separador600/CTA467,44; móvil320×568 CTA430,25/escena568; móvil390×844 CTA589,16/escena844. Sin scroll horizontal ni titular recortado en los escenarios probados. Espera explícita de carga de imagen para capturas con movimiento reducido.
- WebGL real en build local: `verify-hero-html.mjs`, 8 combinaciones de cuatro anchos y ambos temas PASS (`abc252`): nombre completo seleccionable, tres líneas, accesible y sin recorte tras cargar la escena.
- 279unitarias/43archivos y lint completo PASS (`24625b`); estructuraHero y tipografía8perfiles PASS (`7cfd0a`).
- Build30páginas/tipos PASS (`d9f255`), sin sustituir el servidor de desarrollo3015 del usuario.
- Capturas revisadas: `.audit/hero-viewport-2026-09-16` y `.audit/hero-html-2026-09-16`, locales y no versionadas. No verificación en el teléfono físico del usuario.

## Publicación pendiente, limitación preservada

JavaScript idéntico a b218153: home138.318raw/50.545gzip, privacidad74.344raw/26.042gzip (`7eb5b7`). Continúa el exceso previo de408B raw sobre la tolerancia de privacidad. No se modifica la baseline ni se afirma presupuesto verde. No despliegue ni gasto. Próximo: Codex cerrar el margen de privacidad y verificar antes de publicar con autoridad aplicable. Rollback de esta entrega: revertir su commit, no restaurar ni limpiar el árbol compartido.
