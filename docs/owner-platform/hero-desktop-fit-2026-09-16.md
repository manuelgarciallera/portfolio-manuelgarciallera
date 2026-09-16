# Hero desktop: tipografía y espacio

16/09/2026 · Codex · petición directa de Manuel. Base c82dbc3.

## Implementación

Solo escritorio (desde 768 px): columnas 1,3/0,7, margen lateral 8vw y titular hasta 9,5svh, limitado también por ancho. Interlineado 1 y separación CTA 7svh con límites. Se conservan texto HTML, barrido cromático, borde/halo, navegación, preferencias y móvil aprobado. Sin dependencias ni JavaScript público nuevos.

## Evidencia local

- Prueba nueva `scripts/verify-desktop-hero-fit.mjs`: RED a6bb17 con CSS anterior (separación insuficiente), GREEN d990aa en siete ventanas entre 768×600 y 1920×1080. Comprueba ausencia de solapamiento, título sin recorte, navegación despejada, CTA y escena dentro del viewport y separador en su borde.
- Referencia 1280×720: H1 54 → 68,4 px; separación visible 22,3 → 42,2 px; CTA termina en 604,1 px y hero en 720 px. Captura local revisada.
- El halo exterior hace que scrollWidth del enlace supere clientWidth; no equivale a recorte del texto. No se oculta este dato en la prueba.
- Reserva Hub 31f8df23-3830-4baa-a2d8-7bb164bff8ce. Móvil y publicación se verificarán antes del cierre.

Cambios compartidos del registro/protocolo y resto de archivos ajenos excluidos del commit. No se inicia ni modifica CMS, procesos ajenos o automatizaciones.
