# Inserción de imagen en artículo: investigación y verificación

Base `5eb102c`, reserva Hub `5454b794-c44a-4c38-90ce-c43299d7aa28`.
Codex, único escritor; sin modificaciones runtime ni publicación.

Se añade prueba nativa para insertar en un artículo el medio/encuadre que otro
recorrido creó por UI. Verifica etiqueta accesible, relaciones guardadas,
texto alternativo contextual, conservación del cuerpo clásico y recorte móvil
en preview. La comparación de artículos tras reinicio ya existente incluirá
el nuevo bloque. Todavía no ha alcanzado ese punto: no se considera verificada.

## Ejecuciones terminadas

- Sesión 46117 / `203890`: timeout en browser-editor.mjs:75, encabezado
  del primer bloque de página ausente. Sucede antes de la nueva prueba.
- Repetición sin cambios, sesión 28176 / `a3e943`: páginas y medios pasan,
  pero al quitar la cita del artículo, el campo de cita sigue presente,
  menú de eliminar sigue presente y no hay errores de formulario.
  Esperar estado modificado agota 15 segundos. Es la intermitencia previa
  documentada, ahora con evidencia de que no se retiró el bloque.
- Ambas ejecuciones cerraron aplicación/clúster y limpiaron su raíz sintética.
- Syntax/diffcheck pasan; lint focal correcto desde owner (`f37fa7`).
  La primera llamada de lint desde raíz no encontró archivos y no cuenta.

## Siguiente acción

Investigar activación/foco del menú antes de tocar guardado o validadores.
ArrayAction de Payload llama removeRow y close en onClick. Popup distingue
apertura por teclado y aplica autofocus: revisar ese ciclo completo y observar
eventos/foco en una reproducción. No hay causa raíz confirmada todavía.
No ampliar timeouts, simular escritura API ni eliminar la prueba para obtener
un verde. El caso de imagen permanece pendiente detrás de esta puerta.

## Seguimiento: corrección y evidencia posterior

Los apartados anteriores conservan el estado inicial, no el resultado final.
Popup de Payload mantiene nodos ocultos y enfoca la primera acción mediante
requestAnimationFrame cuando se abre por teclado. La prueba anterior usaba
locator.press sobre un botón que podía existir antes de abrirse el menú.
Ahora espera foco nativo en la primera acción del menú visible, navega ArrowUp,
comprueba que Eliminar recibe el foco y activa Enter; verifica retirada del campo.
No se ha alterado Popup ni el guardado. Esto elimina esa carrera del arnés;
no demuestra que todos los fallos intermitentes anteriores tengan la misma causa.

La ejecución `dede62` supera el recorrido de cita y reproduce otro fallo:
no existe combobox con nombre accesible Encuadre en el bloque Imagen del artículo.
Articles.ts no incluía el binding ya usado por Pages.ts. Se reutiliza
RelationshipLabelBinding exclusivamente en ArticleMediaBlock. No cambian
esquema, relaciones, permisos ni valores; import map existente ya lo registra.

GREEN completo `bbe99c`, cierre `93b862` salida 0: creación y edición nativas,
texto clásico conservado, imagen contextual y receta móvil (posición 100% 0%,
zoom 4), guardado/recarga/preview a 390/1280. Dos artículos con sus bloques
se conservan tras reiniciar la aplicación; también páginas, marcas, encuadres,
objetos privados y rechazos anónimos. La imagen se decodifica en el navegador.
Typecheck/lint completos `5fc7f9` salida 0. Diffcheck/checkpoint `5b35c4` pasan.
Revisión interna read-only sin defectos importantes, no aceptación de Claude.
Suite completa `a619ad`: 1.301 pruebas / 170 archivos pasan, además del test
Node de recursos locales. Frontera pública `036aba`: 21 entradas pasan.

Entorno: Docker sin red externa, montajes ni puertos (`1b6f22`), PostgreSQL16,
Next producción y Chromium; checkout f0435bf con overlays, no SHA final limpio.
No móvil físico, Safari, usuarios reales, galería de artículos ni nube.
La prueba comprueba foco de etiqueta al seleccionar inicialmente y nombre
accesible tras recargar; no se afirma foco de etiqueta repetido tras recargar.
