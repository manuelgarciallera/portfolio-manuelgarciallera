# Hero móvil: identidad y pulsación sostenida

Petición directa de Manuel, base `ca85814`, reserva Hub `dac66eab-bbc5-46a6-a526-181265bdf555`.

- Nombre móvil en dos líneas: Manuel / García-Llera Añón; 8,6cqi hasta40px, frente6,7cqi hasta32px. Misma tipografía, color y barrido; desktop conserva composición.
- Espacio inferior del Hero +64px reales. El texto más alto también incrementa la sección; no se recorta ni se pinta sobre el contenido blanco siguiente.
- Contacto sostenido mantiene la onda localizada y su fase continua (antes impulso1,4s y fase limitada2s). Sigue la posición del dedo; soltar/cancelar/perder foco desvanece la reacción. El reloj de animación no se detiene. No captura del puntero ni bloqueo del scroll.
- Context menu prevenido solo en canvas decorativo, con selección/callout desactivados allí; texto del nombre seleccionable, gesto vertical y pinch zoom conservados. El menú nativo era una hipótesis adicional, no una causa física acreditada.

## Pruebas

RED publicado: pulsación deja de deformar (`fbc680`) y tipografía anterior (`c9bb40`). GREEN desarrollo con toque nativo Chromium vía CDP de2,4s y tiempo shader avanzando (`2a407c`). Build30rutas y tipos correctos (`7d4df7`),274unitarias/43archivos (`28a781`), lint/diff correctos (`ec7630`). Presupuesto inicial138706raw/50637gzip sin errores (`82f956`).

Layout compilado320/390/430/767 PASS (`7ce0ec`):2líneas sin overflow, orbe/H1/CTA en su posición previa y sección siguiente con exactamente la misma altura. En390: fuente26,13→33,54px; negro bajo nombre65→129px; finalHero1223,66→1334,16px. Captura390 inspeccionada. El comparador espera geometría estable de la fixture anterior para evitar carreras de estilo; fallo transitorio972a9b no se cuenta como PASS.

Pendiente al crear recibo: restantes regresiones compiladas, CI, publicación y LIVE. Chromium no sustituye una comprobación física del navegador Android del usuario ni acredita ausencia universal de lag. Movimiento reducido y pestaña oculta continúan siendo excepciones intencionadas a la animación.

Regresión compilada desktop390–1920 pasa (`af64d0`): desktop conserva altura de viewport y composición previa; móvil dos líneas. Pulsación nativa y sostenida compilada390/1280 pasa (`b1aafc`).

Ensayo ampliado compilado también pasa cancelación y pérdida de foco en390/1280 (`8d1405`). Commit `4cd3aac` subido; CI35161705913 validateSUCCESS, owner en curso al iniciar cierre. Automatización nocturna existente actualizada para preservar la reacción sostenida y estas decisiones, sin volver al impulso que caduca durante la pulsación.

## Publicación

CI35161705913 completaSUCCESS y logs error5min sin entradas (`be01f7`).

Producción `dpl_94PR7oS9dTa3PSVuXJG3iDoVgU1Z` READY y dominio original comprobado (`487da5`). LIVE: pulsación sostenida/nativa, release/cancel/blur y scroll390/1280 PASS (`1a8b38`); geometría320/390/430/767 PASS (`28faf7`). Barridos y layout claro/oscuro compilados PASS (`f16aa1`). Servidor3020 detenido;3015/3017 conservados. Rollback runtime `e6ea37e`, producción `dpl_8SSnduDukgszDw9F6Y797mbeBo2p`. Sin cambios CMS ni gasto. Pendiente revisión en teléfono físico del usuario; no atribuir a pruebas emuladas garantías universales.
