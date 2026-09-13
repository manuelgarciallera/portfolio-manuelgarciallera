# Stack responsive — 2026-09-13

Petición de Manuel: todos los iconos visibles, con tamaño conservado y salto de fila, nunca desplazamiento horizontal.

Se retira `overflow-x: auto` residual de responsive.css. Competía con la regla de wrap/overflow visible de redesign.css según el orden de carga. No se modifica el tamaño de los iconos ni el CMS.

Prueba real Chromium: `node scripts/check-tech-stack-layout.mjs`. Reproduce antes del cambio el fallo `auto !== visible` al invertir el orden de las hojas globales (4110ce). Después pasa en ambos órdenes y en 21 combinaciones de Buy&Sell, NudeProject y The UX Union a 320/390/600/767/768/1024/1440 px (19dbf3). Comprueba wrapping, ausencia de región de scroll, dimensiones de scroll y límites de todos los elementos. Ocho pruebas unitarias TechStack/metadata pasan (e7b1a8). Diff check correcto.

La primera prueba de rutas usaba networkidle y terminó por timeout; se sustituyó por load más espera del stack. No confundir aquel fallo del harness con un defecto de layout.

Verificado contra localhost:3015; no publicado ni verificado en producción en esta entrega. Adobe CC ya tiene SVG en el código local previo. Siguiente responsable: Codex, verificar artefacto público y despliegue antes de cerrar incidencia pública.
