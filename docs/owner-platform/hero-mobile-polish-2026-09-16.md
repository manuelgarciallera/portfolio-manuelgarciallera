# Hero móvil según croquis

Manuel aporta croquis y solicita orbe mayor, nombre completo en una línea, barrido azul lento cada4,5s y H1 diagonal desde esquina superior izquierda hasta inferior derecha. Base c46d89d; reserva5c50672f. Desktop se conserva.

## Cambios

- Escena móvil cuadrada hasta30rem; zoom2,35 en lugar de1,5 y centro vertical normalizado. El nombre queda en el flujo, debajo, en una línea adaptable. HTML seleccionable.
- Nombre: azul eléctrico398dff y claro9bdcff en oscuro; azules más oscuros en tema claro para contraste. Barrido2,7s/ciclo4,5s, vuelve al color del tema. Movimiento reducido usa texto sólido.
- H1 móvil: recorrido completo100%100%→0%0% en3,6s (doble distancia manteniendo velocidad de avance); ciclo18s. Desktop conserva1,8s y su arranque anterior.
- WebGL se suspende al tocar y durante scroll móvil/inercia; mantiene último fotograma y reanuda180ms después de cesar actividad. Eventos pasivos, sin React renders por scroll ni preventDefault. Limpieza de listeners/timer y recuperación al ocultar pestaña.
- Mismo máximo384px de buffer móvil; agrandar en CSS no incrementa resolución de cálculo. No acredita rendimiento físico ni elimina necesariamente todo lag.
- Fallbacks nuevos `hero-organic-static-mobile-v2-*.png` capturados del shader, antiguos preservados. Se descartó un querystring de versión incompatible con images.localPatterns; el fallo se detectó localmente, no se publicó.

## Verificación

RED ad417d: nombre3líneas, animación inexistente y drawCalls durante touch. Prueba real `verify-mobile-hero-polish.mjs`: composición, pixels del orbe, pigmento del nombre y vuelta a color sólido, recorrido H1, scroll real y pausa/reanudación. La instrumentación de dibujo vive solo en la prueba. Nuevas capturas en `.audit/mobile-hero-polish`.

Local: prueba móvil cuatro combinaciones320/390/430 y tema claro PASS227a79; pigmento cambia y regresa al color base; scrollY cambia y no hay drawCalls durante gesto/inercia, se reanuda después. Capturas oscuro/claro inspeccionadas. H1 cuatro escenarios PASSdf3cf6. 274 tests/43 archivos y ESLint PASS73f0ba, build30/typecheck PASS743a39. Presupuesto home138710raw/50637gzip sin errores0dfbb0, sin nuevas dependencias. La primera compilación falló por descarga transitoria Google Fonts; repetida correctamente.

Publicación pendiente de commit/READY/LIVE. No se sustituye la paleta pública por la variante experimental ni se añaden gotas nuevas. El diagnóstico previo SwiftShader es de laboratorio, no del teléfono del usuario. Próximo Manuel revisar sensación en dispositivo físico.
