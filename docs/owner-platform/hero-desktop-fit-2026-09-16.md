# Hero desktop: tipografía y espacio

16/09/2026 · Codex · petición directa de Manuel. Base c82dbc3.

## Implementación

Solo escritorio (desde 768 px): columnas 1,3/0,7, margen lateral 8vw y titular hasta 9,5svh, limitado también por ancho. Interlineado 1 y separación CTA 7svh con límites. Se conservan texto HTML, barrido cromático, borde/halo, navegación, preferencias y móvil aprobado. Sin dependencias ni JavaScript público nuevos.

## Evidencia local

- Prueba nueva `scripts/verify-desktop-hero-fit.mjs`: RED a6bb17 con CSS anterior (separación insuficiente), GREEN d990aa en siete ventanas entre 768×600 y 1920×1080. Comprueba ausencia de solapamiento, título sin recorte, navegación despejada, CTA y escena dentro del viewport y separador en su borde.
- Referencia 1280×720: H1 54 → 68,4 px; separación visible 22,3 → 42,2 px; CTA termina en 604,1 px y hero en 720 px. Captura local revisada.
- El halo exterior hace que scrollWidth del enlace supere clientWidth; no equivale a recorte del texto. No se oculta este dato en la prueba.
- Reserva Hub 31f8df23-3830-4baa-a2d8-7bb164bff8ce.
- Regresión hero ocho tamaños PASS f5d058: móvil 390×712 conserva H1 121,03–521,38 y CTA 592,81–640,81. Barrido, reposo, repetición y movimiento reducido en cuatro combinaciones móvil/desktop y claro/oscuro PASS c23834. Capturas oscuras y claras revisadas.
- Build de producción 30 rutas/tipos PASS 9be498. ESLint, estructura hero, ocho perfiles tipográficos y navegación móvil PASS 8ab420. Presupuesto PASS 9395e7: home 138.663 B raw / 50.598 B gzip, idéntico al anterior.
- Runtime b0113a4 commit/push 63ca60. Preview dpl_GwRN7mPJXXWVjNYHqRhPvSVzY6hk READY 076542. Promoción iniciada; no se afirma producción hasta verificar alias y geometría real.

## Publicado y verificado

Producción `dpl_Bc5CMgkNYgWNQJ3SAJUNxmu4zgka`, creada 17:41:14 CEST, READY y alias `manuelgarciallera.com` confirmado 477e26. Siete ventanas desktop y cuatro combinaciones de tema/movimiento verificadas directamente en el dominio, exit 0 e10198. CI 35116894634 completada: validate y owner SUCCESS d479fe. Consulta de errores últimos cinco minutos sin logs 3eb7ac; no implica monitorización continua. Rollback disponible a producción previa `dpl_FUimF13B4xxtE7L6vW22yihBJyN7`.

Reserva liberada con entrega al Hub. Siguiente responsable: Manuel, revisión visual en su escritorio. No requiere claves ni otra acción para desplegar.

Cambios compartidos del registro/protocolo y resto de archivos ajenos excluidos del commit. No se inicia ni modifica CMS, procesos ajenos o automatizaciones.
