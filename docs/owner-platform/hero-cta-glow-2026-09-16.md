# Halo sutil del CTA — 16/09/2026

Petición directa de Manuel: probar resplandor exterior de colores sincronizado con el borde, neón sutil. Base1dc3fc3; reserva Hub01996034. Runtimeb8c9666 commit/push066cb2. Solo CSS y ampliación del ensayo existente.

Halo difuminado6px, opacidad35%, extensión2px y mismo ángulo/tiempos que el borde: entrada4,8s y hover8s. Capas aisladas detrás de fondo opaco para conservar texto limpio; sin interceptar clics ni alterar dimensiones. Reduced-motion detiene ambas capas; forced-colors las oculta y mantiene contorno del botón. La guía de diseño motivó la intensidad baja y la ausencia de efectos adicionales.

RED972017 por halo ausente. GREEN1672dd390/1280 verifica degradado, blur, intensidad, sincronización real, movimiento reducido, geometría/foco y clic a#casos. Capturas390/1280 revisadas: primera aproximación con máscara recortaba el difuminado, sustituida por capas aisladas; prueba final repetida. Build final30rutas/tipos PASS ea2f8d; lint/diffcheck d0bf3d. Bundle fresco85ed26sin errores, JS home138663raw/50598gzip idéntico a anterior. No medición de GPU/batería ni prueba física del móvil.

Preview dpl_6xEhHFQYiLEtzS6JSvX5TZNKnQBz READYf015ea. Producción dpl_Cm9gjspQH1PfPYFU7xMXAbFkKnkP READY52c60f, creada17:05:52CEST y alias https://manuelgarciallera.com confirmado. Prueba LIVE390/1280 PASSb8bcee incluida sincronización del halo y reduced-motion; logs error5min sin entradas0d71d7. CI35112870670 validateSUCCESS, owner todavía en curso053def; no se afirma comprobación global finalizada. Rollback identificado: dpl_7a2gRg8bXNATMMdL7KTzQkmFyn5g. CMS, cookies y procesos del usuario intactos. Hito publicado y verificado técnicamente; siguiente Manuel revisión estética en móvil físico.
