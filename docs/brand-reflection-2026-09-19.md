# Reflejo táctil translúcido de la M

Manuel rechaza la franja de color opaca de `12a5085` y aprueba sustituirla por un reflejo diagonal tipo H1, con halo fino cian/rosa ajustado a la silueta. Base: `236964e`. Reserva Hub: `046f7db8`.

## Cambio

Solo CSS móvil: reflejo transparente de 1200ms recortado a la M completa, composición `screen` aislada para sumar luz sin oscurecer el fondo original. No desplaza ni sustituye el degradado base. Halo mediante sombras de la silueta, sin caja rectangular. Sin cambios en eventos, navegación, desktop, Hero, CMS ni dependencias.

La prueba del ciclo opaco se sustituye por `verify-brand-reflection.mjs`; el historial conserva la anterior. El test nuevo compara los canales de píxeles interiores en cinco momentos, ambos temas, comprueba luminosidad visible y retorno de colores con tolerancia de 2/255 por rasterización. No afirma identidad de los bordes antialiasados entre capas con/sin filtro.

## Verificación

- RED `71efdb`: la versión anterior oscurece píxeles a los 300ms.
- GREEN `71d508`: no banda oscura, reflejo visible, retorno de colores y movimiento reducido, ambos temas. Capturas en `.audit/brand-reflection` inspeccionadas.
- Build 30 rutas y tipos PASS `10030c`; 280 pruebas/45 archivos y ESLint PASS `eaf798`.
- Presupuesto público sin cambiar baseline y responsive PASS `ecdd6b`.
- Gestos integrados: toque, timeout, cancelación, reduced motion, home y arrastre nativo emulado PASS `475869`. Primera revisión visual paralela agotó `networkidle` a 30s (`dfc019`, `ff5511`); sin error del servidor y `/sobre-mi` HTTP200 (`be90c4`). Se repite por separado, sin modificar runtime ni rebajar aserciones. ESLint final PASS `ba3ba9`.

- Repetición secuencial PASS en 390/768/1280 dark/light, hover/foco/layout/sin errores (cierre `ff8ee8`). Captura integrada del halo por toque nativo PASS `ee2457`, revisada visualmente.

Pendiente commit y publicación. No probado en teléfono físico. Próximo: Codex cierre; Manuel valoración visual.
