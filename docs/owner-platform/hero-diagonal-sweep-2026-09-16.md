# Barrido diagonal inmediato

16/09/2026 · Codex · ajuste acotado aprobado explícitamente por Manuel. Base ec96483.

El H1 inicia el barrido sin espera: banda a 135°, desplazamiento en ambos ejes, 1,2 segundos activos dentro de un ciclo de 20 segundos. El arranque al 80% coloca ya parte de la banda sobre el texto. Después permanece la tinta del tema. Sin cambios de geometría, CTA, HTML, cookies ni CMS. Movimiento reducido mantiene texto sólido.

Prueba `verify-hero-type-sweep.mjs` actualizada: detecta movimiento a 100ms, diagonal, final a 1200ms, reposo y repetición a 20600ms, geometría y contraste en ambos temas. RED f164fc contra versión previa. Primer GREEN detectó serialización CSS de cero como `0px` frente a `0%` (a2b10d); se compara cero numérico, sin relajar duración/posición. Captura móvil diagonal revisada.

Build 30 rutas/tipos PASS 007a42, estructura hero/lint/diff f6843f. JS idéntico: 138663 B raw / 50598 B gzip, presupuesto PASS 756a23. Reserva Hub bc399066-94fa-4ed7-80a7-82b56c95cf66. Publicación y prueba final pendientes al crear este recibo.
