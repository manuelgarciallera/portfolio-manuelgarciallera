# CTA neón y cristal

16/09/2026 · Codex · propuesta aprobada por Manuel · base45c6d7e.

Solo CSS CTA: cian eléctrico #00d1ff, violeta #944dff y fucsia #ff38ca. Halo65% con bordes difuminados y centro despejado. Borde hueco1,5px. Misma geometría y giro4,8s inicial/8s hover; movimiento reducido sin giro. Desktop>=768, ratón fino y hover: superficie oscura86% translúcida, reflejo diagonal, backdrop blur12px/saturate1,35 y luz interior. Móvil sin estado cristal persistente. Texto y enlace a #casos intactos.

Prueba real actualizada en cuatro combinaciones390/1280 y claro/oscuro: REDfda847 contra halo anterior, GREEN5de6b8 con neón, hover, giro sincronizado, dimensiones, movimiento reducido, foco y navegación. Capturas móvil y hover desktop revisadas. Primera variante teñía el centro; se corrigió mediante máscara y halo con bordes suaves antes de publicar. ESLint/diff PASS0d1e92, estructura hero7a0531.

Primer build intermedio PASSf2082f. Build final b3301e falló por descarga de Playfair desde Google Fonts; reintento sin cambiar fuentes ni dependencias. Reserva699402ee-6b8f-4925-9325-ac8243d4dfec. Aún no publicado al crear este recibo.

Reintento final PASS46d0b1, 30 rutas/tipos. Presupuesto PASS357e3d: home138663 B raw/50598 B gzip, sin crecimiento JS. Runtime fdee992 commit/push10ff94. Se conserva fallo previo como incidencia de red, no se presenta como éxito.

## Publicado y verificado

Producción dpl_9Hreo48jHXZQHwBT6GLmBiWT5aHG, 18:14:49 CEST, READY/aliasmanuelgarciallera.com4052a9. LIVE cuatro combinaciones PASSa090a6. Primera lectura desktop e92e4f capturó el fondo opaco al inicio de transición180ms; la prueba espera ahora el alpha final0,86, sin cambiar runtime ni reducir exigencia. Lint/diff591e20. CI35120523107 validate+owner SUCCESSb5d3cd. Logs5min sin entradas487b9f. Rollback a dpl_ER3CYDKiiXQgta4mLJDWTbZykjkS.

Reserva liberada al entregar, siguiente Manuel revisión visual física. Sin CMS/cookies/procesos ajenos ni automatizaciones modificadas. Cambios compartidos del registro excluidos del commit.
