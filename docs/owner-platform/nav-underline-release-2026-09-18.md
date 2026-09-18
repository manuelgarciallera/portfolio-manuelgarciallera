# Subrayado de navegación activa — 18/09/2026

Manuel confirma acercar la línea al texto y cruzar descendentes, desktop/móvil. Reserva Hub73125762, base8462cb8. Solo `responsive.css`: offset móvil0.45em→0.06em; línea continua1px sin skip-ink. Desktop usa subrayado nativo del mismo color accent, sin duplicar pseudo-elemento; hover de otros enlaces no cambia. Sin cambios de tipografía, layout, Hero, CV o CMS.

Prueba navegador `scripts/verify-nav-underline.mjs`: RED contra producción previa (offset0.45em, c2538e); GREEN contra build local real (4b048f): 320/390/768/1280, dos temas, proximidad/continuidad/grosor, cajas iguales, sin overflow, CV y Escape conservados. Capturas390/1280 inspeccionadas. Ensayo inicial de inyección CSS descartado por orden de cascada; verificación válida usa build real, no inyección.

Build aislado30páginas/TypeScript PASS60d6e0, responsive PASSdc6bfc, eslint y diffcheck. Presupuesto PASS57e0e0 sin aumento JS respecto a CV anterior (delta0); baseline intacta. Inclusiones transitorias tsconfig retiradas. Sin prueba en teléfono físico.

Pendiente publicación y LIVE. Reversión: revertir únicamente commit de este ajuste; producción anterior dpl_7fg98SVJefWn5WFzQ6GF27MTPzmS conserva CV. Siguiente Codex verificar despliegue, Manuel revisión visual.
