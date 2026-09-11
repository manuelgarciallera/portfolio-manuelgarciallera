# Protección de cambios sin guardar: recorrido nativo

Base12334d7, reserva Hub bf37b453. Sin cambios runtime: se verifica la
protección existente antes de construir otra interfaz o reimplementar lógica.

## Prueba

Página creada y guardada por el navegador. Cambiar título y primer bloque;
intentar ir al listado por la ruta de navegación del panel. Exigir confirmación,
cancelar y comprobar ambos valores sin guardar. Repetir y confirmar descarte;
volver al documento y comprobar título, bloque y documento completo persistido
contra el estado guardado anterior. Lectura API solo para contrastar el servidor;
ninguna escritura API prepara los cambios o simula los botones.

Ensayo actual: build producción con PostgreSQL y proveedor de objetos sintéticos
en contenedor sin red externa,390/1280. Checkout d004d7c con overlays posteriores,
no clon limpio ni proveedor real. Lint focal084830 y diffcheck47a8a4 pasan.
Primer ensayo completo `c91a8a`, cierre `51b2a4`, salida0: pasa390/1280,
también medios, artículos, privacidad y conservación tras reinicio. Revisión
read-only sin bloqueadores; se añade timeout de10s a la lectura final, tal
como recomienda el revisor. Lint final43a714 pasa. Repetición completa con
ese timeout: `53a816`, salida0. Cancela/descarte pasan a390/1280 y el resto
del recorrido, reinicio y limpieza también. No se ha cambiado lógica runtime.
No se repiten unitarias/types al ser solo pruebas MJS y documentación;
el build completo sí compila el CMS. Diffcheck sin errores.

No incluye cierre de pestaña, navegador físico, caída del dispositivo ni edición
offline. El comportamiento probado es navegación interna y descarte deliberado.
Sin publicación, push, datos reales o rediseño. Próximo responsable Codex.
