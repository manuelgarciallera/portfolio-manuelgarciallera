# Tanda visual del portfolio · 22 de septiembre de 2026

Autor: Codex, a petición de Manuel. Base anterior: `9f064d4ce1dd9a0e95bb3d2801860e9d88a8be2d`.
Reserva pública: `af2aa6ab-e0b2-45d0-a51a-544a4eecdefd`, tema `portfolio-profesional::public-ui`.
Trabajo separado del CMS privado. No cambia el orbe azul, los contenidos, las rutas ni el SEO.

## Implementación

1. **Galería «Diseño que se siente».** Desplazamiento lento de las imágenes hacia la izquierda en escritorio con ratón; los extremos aceleran en ambos sentidos. El centro se detiene para facilitar la selección. Barra corta arrastrable, azul oscuro en tema oscuro y gris en claro. Se conservan gestos, teclado y flechas. Incluye pausa explícita; se detiene fuera de pantalla, con teclado y con movimiento reducido. No hay salto brusco ni duplicación de enlaces al llegar al final.
2. **Flechas compartidas.** Contorno de 2 px, trazo interior de 2 px y área de 44 px en proyectos y artículos. Un solo componente y una receta visual compartida.
3. **Jerarquía de casos.** Menos espacio entre galería y casos; 12 px entre «Casos seleccionados» y su titular. Se elimina la altura mínima que centraba el titular demasiado lejos del rótulo.
4. **CTA del Hero.** Cristal interior sobre toda la píldora, transición de 650 ms, etiqueta blanca independiente y dimensiones constantes. Sin expansión de borde al pasar el ratón. Se mantiene la respuesta de pulsación común existente.
5. **Posición del artefacto.** 28 px hacia arriba y 12 px hacia la izquierda en escritorio. Su ancho queda limitado por el espacio disponible para no recortar los anillos en tablet. En móvil no se aplica ese desplazamiento para conservar la separación respecto al texto.
6. **Saturno.** Esfera redonda de grafito satinado, detalle de superficie sin deformar la silueta, tres anillos finos y seis luces orbitales. Giro y precesión lentos; renderizado detenido cuando queda fuera de pantalla o se solicita movimiento reducido. Textura generada pequeña, sin dependencias ni recursos externos nuevos.

## Revisión y pruebas

La revisión independiente encontró dos defectos del planificador del carrusel: reiniciar el reloj con cada movimiento del ratón y no escuchar la salida de foco desde los controles inferiores. Ambos se corrigieron; la reproducción aislada confirma avance con 30 movimientos consecutivos, reanudación solo por salida de foco y limpieza de listeners, temporizadores y fotogramas.

La primera inspección visual de Saturno detectó una superficie demasiado negra/brillante. Se separaron los canales de relieve y rugosidad y se suavizó la iluminación. La geometría no cambió.

Evidencias locales: `.audit/public-round-20260922/`. Recorrido reproducible guardado en `scripts/verify-public-visual-round.mjs`, ejecutable con Node contra la vista previa local (variables opcionales `PUBLIC_TEST_URL` y `PUBLIC_TEST_OUTPUT`). No son métricas de usuarios reales ni una prueba en teléfono físico.

### Estado de las puertas

- Primera batería pública: 46 archivos, 294 pruebas correctas; guardas públicas 15/15, aislamiento de dependencias públicas correcto.
- Comprobaciones de Hero, tipografía responsive (8 perfiles), navegación móvil, lint y tipos correctas.
- Compilación de producción correcta. En este entorno hubo que retirar `--use-system-ca` de `NODE_OPTIONS` solo para el proceso de compilación, por incompatibilidad de sus workers; sin cambiar configuración del producto.
- Presupuesto público inicial correcto en 11 rutas; sin modificar el presupuesto de referencia. Auditoría de dependencias de producción: cero vulnerabilidades notificadas.
- El comando general `check:all` **no terminó en verde**: su detector de texto recorre copias antiguas de pruebas y archivos de terceros (Monaco) fuera del cambio. Comprobación explícita de los 351 archivos públicos fuente/scripts/contenido antes de promover el recorrido de navegador, incluidos nuevos archivos: sin marcadores de codificación. No se ocultó el fallo ni se alteró el detector para aprobarlo.
- Recorrido Chromium inicial: controles, modos claro/oscuro y tamaños 320/390 correctos. En 768 el primer toque alcanzó el panel de privacidad abierto, no la barra; se verificó el elemento receptor y se corrigió la preparación de la prueba cerrando el panel mediante su botón, sin aceptar analítica. La verificación final se registra a continuación.

### Resultado final

- **47 archivos / 299 pruebas unitarias correctas.** Cuatro nuevas regresiones del hook ejercitan su efecto y planificador con DOM/reloj controlados; no sustituyen al navegador. Ambas regresiones antiguas se reprodujeron en memoria antes de confirmar el verde.
- **Lint, tipos, compilación y presupuesto público correctos** tras los ajustes finales. Build local: `UshmyYgqGaMly2Ce-E75I`. El detector de compilación antigua detectó correctamente la incorporación tardía de la prueba; se recompiló, no se relajó la comprobación.
- **Chromium: 10 grupos de aceptación correctos, cero errores de ejecución.** Escritorio 1440 px, táctil 320/390/768 px; claro/oscuro, movimiento reducido, pausa/reanudación, ratón moviéndose por ambos extremos, arrastre y teclado del slider, flechas y dimensiones del CTA. Espaciados medidos: 36 px de la sección de galería al rótulo y 12 px del rótulo al titular en 1440; rótulo–titular 12 px también en los tres tamaños táctiles.
- Contorno y trazo de las cuatro flechas de proyectos/artículos comprobados en 2 px; controles de galería dentro de pantalla en los tres tamaños táctiles. Capturas inspeccionadas del cristal, galería oscura/clara y Saturno de escritorio/móvil/tablet; los anillos ya no se recortan en 768 px.
- La duración CSS del cristal se comprueba en 650 ms. El muestreo intermedio en navegador sin pantalla no prueba la curva temporal: la carga de captura alcanzó ya opacidad 1. No se afirma una medición fluida de fotogramas ni rendimiento en dispositivo físico.
- SHA256 del resultado Chromium: `e6e9b94c72b0b4abadddc838a386d9d7a0b9f302226500fc90f3dc3776044837`.
- **Firefox no verificado en este entorno Windows**: falla `newPage` antes de visitar la web. El mismo fallo se reprodujo con una página vacía; no se atribuye al producto ni se declara aprobado. Safari y teléfonos físicos no se han probado en esta tanda.

## Acceso y reversión

Vista previa local de producción en `http://127.0.0.1:3100/`; accesible solo desde este equipo mientras el servidor esté activo. No equivale a una dirección pública o accesible desde el móvil de Manuel.

Los cambios se guardan en un commit separado para poder revertir únicamente esta tanda, sin revertir el CMS ni el resto de trabajo compartido. No se publica ni hace push automáticamente. La autorización de publicación se ha solicitado aparte.
