# Subrayado de navegación activa — 18/09/2026

Manuel confirma acercar la línea al texto y cruzar descendentes, desktop/móvil. Reserva Hub73125762, base8462cb8. Solo `responsive.css`: offset móvil0.45em→0.06em; línea continua1px sin skip-ink. Desktop usa subrayado nativo del mismo color accent, sin duplicar pseudo-elemento; hover de otros enlaces no cambia. Sin cambios de tipografía, layout, Hero, CV o CMS.

Prueba navegador `scripts/verify-nav-underline.mjs`: RED contra producción previa (offset0.45em, c2538e); GREEN contra build local real (4b048f): 320/390/768/1280, dos temas, proximidad/continuidad/grosor, cajas iguales, sin overflow, CV y Escape conservados. Capturas390/1280 inspeccionadas. Ensayo inicial de inyección CSS descartado por orden de cascada; verificación válida usa build real, no inyección.

Build aislado30páginas/TypeScript PASS60d6e0, responsive PASSdc6bfc, eslint y diffcheck. Presupuesto PASS57e0e0 sin aumento JS respecto a CV anterior (delta0); baseline intacta. Inclusiones transitorias tsconfig retiradas. Sin prueba en teléfono físico.

Publicado: commit/push `b9d196e`; preview HLwYPNSByJL77QeEhx2n1f4ikmmk READY, producción `dpl_ECN5FPy768f3bdqyhWAx9C44uud1` READY y alias manuelgarciallera.com confirmado721338/fe96aa. LIVE mismo ensayo4anchuras2temas PASS792ebc. Logs error últimos5min sin entradas3f0513. CI35333082382 validateSUCCESS; owner todavía en curso al entregar (sin cambios owner en este commit). No afirmar toda la CI terminada.

Reversión: revertir únicamente `b9d196e`; producción anterior dpl_7fg98SVJefWn5WFzQ6GF27MTPzmS conserva CV. Reserva73125762 liberada. Siguiente Manuel revisión visual.
