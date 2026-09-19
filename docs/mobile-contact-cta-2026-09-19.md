# Contacto prioritario en el menú móvil

Manuel aprueba: borde tipo Hero solo en Contacto interior, giro lento/halo suave; Contacto superior intacto y CV neutro algo más próximo. Base recuperable `fe5cf28`. Reserva Hub `e45942ed`.

## Implementación

- `SiteHeader.tsx`: halo decorativo aria-hidden reutilizando la cápsula del Hero.
- `mobile-cv.css`: anillo de 1,5px, mismos colores, giro de 10s únicamente con menú abierto; halo más tenue (0,4 / blur 3px). Contraste de texto según tema, foco visible, reducción de movimiento y modo de colores forzados.
- Separación de 32px entre Contacto y utilidades/CV, sin distribuir espacio vacío entre ambos. Cápsula visible mínima de 44px; el pseudo-elemento de área táctil anterior queda reemplazado por el anillo y no reduce el objetivo real.
- No cambios en Hero, desktop, PDF, comportamiento de navegación o CMS. Sin dependencias nuevas.

## Evidencia

- RED `62c8b4`: producción anterior sin anillo en Contacto interior.
- Build 30 rutas/TypeScript PASS `811ed6`; 280 pruebas/45 archivos PASS `bb8ea4`.
- Presupuesto público y guardas responsive PASS `7e2ea7`, baseline intacta. ESLint PASS `74d3f0`.
- Primera prueba integrada pasa borde/CV/navegación y se detiene al reabrir cabecera oculta tras salto al footer (`8f40af`). Ajustado el recorrido del test para volver arriba, sin cambios runtime.
- Captura 320 dark inspeccionada: cápsula, CV próximo, superior sin efectos. En pantalla corta el menú mantiene scroll.

- GREEN integrado: 320/390/768 en ambos temas, CV ES/EN desplegable, cápsula táctil, gap32, Contacto superior intacto, reduced motion, cierre/navegación/Escape y escritorio1280 PASS (`ed4dca`). Capturas 390 dark y 320 light inspeccionadas; el azul del CV en la segunda es su hover existente tras la prueba, no animación añadida. ESLint final PASS `b9dfc0`.

Pendiente commit/publicación. Validación emulada, no teléfono físico. Próximo Codex cierre; Manuel valoración visual.
