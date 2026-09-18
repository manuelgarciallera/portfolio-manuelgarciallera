# Respuesta táctil móvil de la M

Manuel aprueba un breve barrido móvil y sugiere sombreado de color. Base c29f8e4, producción anterior qEDVePom2DSDCAvzHpKvsq7jUdsQ. Reserva Hub57c098a4.

BrandSignature y CSS: pulso600ms de degradado + halo cian/rosa discreto (drop-shadow4px, alfa máxima0,4). Solo pointerType touch, puntero primario y ancho≤767. No captura punteros, no preventDefault, no touch-action restrictivo, no demora navegación ni muestra letras. El nodo tocado no se reemplaza. El temporizador se limpia al desmontar; cancelación nativa del puntero cancela el pulso; mantener pulsado no lo deja fijo. Movimiento reducido no activa la animación. Desktop y forma/paleta en reposo intactos.

RED `verify-brand-touch.mjs` contra anterior: animationName none en vez de rd-brand-spectrum (1bff5c). Prueba con eventos del navegador, toque nativo y arrastre CDP; emulación no equivale a móvil físico. Medir el pulso dentro de una evaluación evita que viajes del protocolo consuman sus600ms: GPUsoftware del Hero ralentiza el runner (451ms observados para lectura solicitada a60ms), no se altera el orbe para pasar pruebas.

280 tests PASS, build30+tipos, ESLint focal/responsive PASS, presupuesto público sin incidencias. Toque nativo CDP y captura del halo inspeccionados (1685dd); sin cambios ajenos, Hero ni CMS. Cierre funcional/publicación pendiente. Para revertir, revertir solo el commit de esta tarea.

GREEN funcional local (b2be96): pulso, halo, letras ocultas, timeout, pointercancel, movimiento reducido, toque nativo que navega a home y gesto nativo de arrastre iniciado sobre la marca que desplaza la página sin pulsar el enlace. Publicación pendiente.
