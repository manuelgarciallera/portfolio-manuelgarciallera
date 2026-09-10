# Claridad del editor de páginas · 2026-09-10

Base: `31f8911`. Alcance local; sin push, despliegue, cambios públicos, migraciones ni dependencias nuevas.

## Cambio

Etiquetas españolas en los campos propios de Páginas y sus cinco tipos de bloque: portada, texto enriquecido, galería de proyectos, imagen y sección especial. Las opciones de sección especial conservan sus valores internos. La animación muestra unidades: duración e intervalo en milisegundos, desplazamiento en píxeles. El identificador de URL conserva también el término técnico «slug».

No cambian claves persistidas, valores, límites, reglas de publicación, permisos ni render público. `slugField` se amplía únicamente en Páginas; no se modifica el campo compartido.

La traducción **no es completa**: las opciones de función del color, curvas, movimiento reducido y el grupo SEO compartido conservan terminología previa. No se afirma que todo el CMS esté localizado ni listo para clientes.

## Evidencia

- RED `43699f`: el recorrido real falla buscando el nombre accesible «Título de la página» antes del cambio.
- GREEN `b161eb`: edición por nombres accesibles, ordenación, guardado, recarga, previsualización privada y restauración a 390 y 1280 px. El contenido publicado permanece intacto.
- Responsive `d07f25`: 320, 390, 768, 1024, 1280 y 1680 px, claro/oscuro; navegación, cuenta, editor y previsualización sin desbordamiento según las comprobaciones existentes. Captura móvil inspeccionada por Codex.
- Regresión focal: 27 pruebas editoriales; tipos y lint terminan con salida 0 (`a00129`). El test de secciones especiales ahora comprueba los valores permitidos, no su antigua traducción inglesa.
- Frontera pública: 21 entradas, salida 0 (`2a07b0`).
- Primera suite completa `a02a2c`: 1171/1172; un timeout del `afterEach` de copia de revisiones, mientras se ejecutaba el navegador. No es una aserción de etiquetas. Se repite sin navegador y con dos workers, sin elevar límites de tiempo ni modificar almacenamiento.
- Repetición `npm test -- --maxWorkers=2`: 1172/1172 y 161 archivos, salida 0 (`74ade8`, 136,78 s). El timeout anterior no se reproduce en esta ejecución; no se atribuye una causa definitiva sin instrumentar ese cierre.

Revisión independiente de solo lectura: sin bloqueadores de compatibilidad; advierte correctamente que la traducción es parcial. Datos, credenciales y servidor de QA sintéticos y locales. No se prueba un teléfono físico ni infraestructura de producción en este incremento.

## Hallazgo abierto: control de medios restaurados

Actualización posterior: causa y corrección local verificadas en [restore-module-capability-2026-09-10.md](./restore-module-capability-2026-09-10.md). Se conserva a continuación el resultado original; no implica publicación de la corrección.

Ensayo adicional `restored-media-control.browser.mjs`, con seed nuevo: falla en `a95719` esperando que aparezca «Usar las imágenes actuales de la biblioteca», antes de alcanzar el campo de título cambiado. El servidor se cerró correctamente. No se considera este recorrido verificado ni se atribuye el fallo a caché o a la traducción. Debe comprobarse primero la relación `restoredMediaSnapshot` en la respuesta del borrador y después la condición del formulario. Este test conserva su cambio de selector de título al nuevo nombre accesible, pero el recorrido completo queda rojo.

No ampliar a producción mientras no se explique y cierre este hallazgo. El recorrido de restauración de contenido sí pasó; eso no sustituye la comprobación independiente del cambio de origen de imágenes.

## Siguiente puerta

Completar terminología compartida y ayudas con recorridos reales; después staging operativo con PostgreSQL y medios privados, copias restaurables y costes aprobados. No confundir pruebas locales con publicación ni con aislamiento multiempresa.
