# Contraste del editor y arquitectura del CMS

## Conclusión ejecutiva

El CMS del portfolio tiene una base editorial comprobada, pero todavía no ofrece la autonomía completa de un creador visual de páginas ni una operación productiva recuperable. La mejora prioritaria no consiste en acumular librerías: consiste en cerrar el recorrido entre edición, representación fiel, persistencia y publicación. Mantener Payload como motor es la recomendación provisional; no hay evidencia suficiente para justificar una migración de plataforma.

La separación entre panel y web pública protege el diseño actual. También introduce una obligación: comprobar que los componentes publicados reproducen lo que el editor promete. Una previsualización alternativa de contenido no equivale a la página final. Conviene resolver esa correspondencia antes de ampliar mucho el catálogo de bloques.

Este informe desarrolla el primer bloque del contraste solicitado: edición visual, arquitectura y actualización. Consulta del 9 de septiembre de 2026, código local `9f16aab`. No constituye la auditoría completa de mercado, licencias, costes ni usabilidad. Las recomendaciones no son adopciones aprobadas.

## Estado contrastado con código local

| Necesidad | Evidencia local | Evaluación |
| --- | --- | --- |
| Páginas y contenido tipado | `owner-platform/src/collections/Pages.ts` define bloques y valida marca al publicar | Base reutilizable; no equivale a diseño libre |
| Control de acceso | Users y prueba HTTP de desbloqueo en `9f16aab` | Protección comprobada en el escenario REST/SQLite documentado |
| Edición y recuperación | Recibo `editorial-runtime-recheck-2026-09-08.md` | Flujo local móvil/desktop probado; no publicación pública |
| Previsualización | `PagePreviewView.tsx` carga contenido guardado y declara que no representa la portada ni sus animaciones | Es una vista editorial, no un editor visual en vivo |
| Borradores | `collections/shared.ts`: autosave desactivado y hasta 25 versiones por documento | Guardado explícito; no prometer recuperación de cambios nunca guardados |
| Marca y movimiento | `brand/model.ts`: roles de color, pesos, duración, stagger, recorrido, easing y movimiento reducido | Hay parámetros; falta acreditar su aplicación al renderer público |
| Medios | Media legacy activo; almacenamiento versionado probado por separado | Falta activación operativa y destino persistente |
| Producción | `dashboard/readiness.ts` mantiene publicación y bridge desactivados | Estado correcto: no preparado para vender como servicio operativo |

Las pruebas recientes no deben contarse como nuevas en este informe. Los recibos anteriores detallan su alcance. Tener muchos tests no demuestra que una persona pueda completar su tarea sin asistencia, ni que una versión pueda restaurarse después de cambiar código, esquema y archivos.

## Comparación de enfoques

### Payload: aprovechar primero el motor instalado

Payload documenta Live Preview mediante un iframe que recibe cambios del formulario por `postMessage`, con soporte de renderizado cliente y servidor. Permite actualizar la representación antes de guardar. Esa capacidad es distinta del enlace actual a una revisión guardada. [1]

La web del proveedor presenta también un editor visual entre sus capacidades enterprise. No debe suponerse que cualquier función mostrada comercialmente está incluida en las dependencias gratuitas instaladas. Se requiere confirmar edición, condiciones y compatibilidad exacta antes de adoptarla. [2]

Recomendación: realizar primero un ensayo privado de Live Preview con un solo bloque y el renderer objetivo. Validar origen y estructura de mensajes, identidad, aislamiento de borradores y ausencia de escrituras implícitas. Una vista previa no debe necesitar publicar para verse actualizada. No activar autosave por asociación: sería otra decisión sobre versiones, carga y conflictos.

### Puck: candidato de interacción, no sustituto del backend

Puck permite construir edición visual en React con componentes propios y campos asociados. Su núcleo se declara MIT; la documentación distingue ese núcleo de capacidades cloud. El repositorio enlazado anteriormente como measuredco/puck redirige actualmente a puckeditor/puck. [3][4]

Su principal encaje sería la composición visual de nuestro catálogo, no usuarios, permisos, backups o publicación. Adoptarlo exigiría decidir qué representación es canónica: los bloques de Payload o el documento del editor. Mantener dos árboles editables sin una conversión reversible introduciría pérdida de datos y divergencia.

Puck documenta migraciones tanto del formato del editor como de propiedades de componentes. Renombrar una prop puede romper documentos existentes aunque la aplicación compile. [5] Esto refuerza una necesidad propia: fixtures de contenido antiguo, transformación explícita y prueba de renderizado al actualizar componentes. El helper de una librería no migra automáticamente nuestra semántica de marca.

Decisión provisional: candidato para un spike aislado posterior, no dependencia instalada. El ensayo debe demostrar ida y vuelta sin pérdida, teclado, tacto, deshacer, recuperación tras recarga y cero código del editor añadido al público.

### Builder: composición controlada como patrón comercial

Builder documenta registro de componentes y un modo que restringe el editor a componentes, con opciones para limitar estilos y bloques. [6] Por tanto, proteger un sistema de diseño no exige ofrecer un lienzo sin reglas. La propuesta de un catálogo controlado tiene precedentes comerciales; no constituye por sí sola una ventaja exclusiva.

La recomendación es aprender del patrón, no incorporar un SDK completo para imitar una captura. Nuestro posible diferencial debe demostrarse en menos errores, recuperación más clara y mejores resultados para un tipo concreto de cliente. No hay en este análisis pruebas de usuarios ni comparativa de rendimiento de Builder.

### Sanity: conectar el elemento con su campo

Sanity documenta overlays que permiten seleccionar contenido en la vista previa y enfocar su campo correspondiente en Studio. [7] Esa conexión reduce la distancia entre «lo que veo» y «lo que debo editar» sin que todo texto se convierta en HTML libre.

Aplicación posible: identidad estable de bloque y ruta de campo en el renderer privado, con selección que lleve al formulario. No copiar un sistema de anotación completo ni introducir una segunda base de contenido para esta función. Tampoco confundir click-to-edit con edición inline o arrastre: son recorridos distintos que deben evaluarse por separado.

### GrapesJS: persistencia del proyecto, no solo HTML

Su Storage Manager conserva datos de proyecto JSON; la documentación advierte que el HTML/CSS no sustituye ese estado y describe almacenamiento local por defecto y opciones remotas. [8] La lección transferible es conservar el modelo editable. Exportar una página bonita no permite reconstruir necesariamente su edición.

No se propone sustituir los bloques actuales por ese formato. Habría que demostrar equivalencia de tokens, renderizado, medios y permisos. El alcance del producto actual favorece continuar con su modelo antes que mantener dos motores de composición.

## Mejoras propuestas y pruebas de aceptación

| Orden | Incremento | Prueba que justificaría conservarlo |
| --- | --- | --- |
| 1 | Destino persistente y restauración operativa | Reinicio real, referencias intactas, restauración conjunta de BD/medios y permiso denegado a escritores excluidos |
| 2 | Renderer fiel para una página privada | Comparación de salida contra su versión pública equivalente, mismos tokens y comportamiento reducido; borrador inaccesible anónimamente |
| 3 | Preview en vivo con Payload | Texto sin guardar se refleja; cerrar no publica; origen falso rechazado; tras guardar/recargar se conserva el valor correcto |
| 4 | Selección visual de bloque/campo | Tocar o enfocar un elemento lleva al control correcto sin perder cambios ni foco; funciona a 390 y 1280 px |
| 5 | Ensayo de Puck si persiste una necesidad de composición | Reordenación y edición sin pérdida, alternativa al arrastre, vuelta al modelo canónico y dependencia solo privada |
| 6 | Actualización compatible | Documento de versión anterior conserva representación o migra explícitamente; restauración de contenido compatible con su código |

Los órdenes 2–6 son propuestas de producto, no una autorización para activar el bridge público. Se pueden ensayar privadamente una vez acordados renderer y contrato. El almacenamiento elegido condiciona el consumidor operativo y sigue pendiente; no debe resolverse mediante una instalación improvisada.

## Usabilidad y límites de la libertad creativa

En móvil conviene probar tareas breves: corregir texto, sustituir una imagen, elegir un encuadre y guardar. Una miniatura de escritorio reducida no demuestra un editor móvil usable. La interacción de arrastre debe tener una alternativa mediante botones u orden explícito; el teclado virtual, la pérdida de red y la salida accidental requieren pruebas reales.

En desktop, un inspector junto a una vista fiel es una hipótesis razonable. No hay evidencia para construir ya una barra acoplable a los cuatro lados. Esa función debería justificar su coste frente a una disposición estable y comprensible. Se mantiene como posibilidad, no se elimina de la visión.

Los pesos de color deben expresarse como intención de uso, no como garantía de porcentaje exacto de píxeles. La cantidad visible cambia con contenido, imágenes, viewport y scroll. Del mismo modo, controlar parámetros de animación exige límites coherentes y una representación verificable: guardar un número en el panel no demuestra que el efecto público lo use.

## Coste y actualización

Sin instalar paquetes nuevos, la siguiente mejora puede apoyarse en capacidades existentes de Payload. Esto no implica coste total cero: almacenamiento, base de datos, backups, tráfico, soporte y tiempo de mantenimiento siguen existiendo. Tampoco se ha calculado todavía una tarifa comercial comparable entre proveedores.

La actualización automática debe proponer y comprobar cambios, no publicar ciegamente. Una dependencia más reciente puede cambiar formato, permisos o renderizado. La comparación útil incluye artefacto anterior, migración de contenido, pruebas editoriales, presupuesto de carga y recuperación. El aviso pendiente de Payload permanece separado de esta evaluación funcional.

## Siguiente tramo de investigación

### Ampliación económica: núcleo, servicios y operación

La consulta de precios permite descartar una equivalencia engañosa: editor abierto no significa IA alojada incluida. La decisión del editor debe poder tomarse sin comprar su servicio de IA. Las cifras siguientes son tarifas anunciadas en USD, no presupuestos para este CMS; no incluyen una conversión a euros, impuestos ni estimación de consumo.

| Opción | Dato observado | Consecuencia para el piloto |
| --- | --- | --- |
| Payload | Licencia MIT en el repositorio principal; Visual Editor figura como «Coming Soon» en enterprise [9][2] | No basar el calendario en un producto anunciado ni confundirlo con Live Preview disponible en documentación |
| Puck Cloud | Pay-as-you-go: coste del modelo +20%; Launch 199 USD/mes; Growth 799 USD/mes [10] | No necesario para evaluar el editor abierto; mantener IA como integración separable |
| Sanity | Free anuncia datasets públicos; Growth 15 USD/asiento/mes y datasets privados o públicos [11] | No comparar solo el precio cero: comprobar privacidad y necesidades de roles antes de una posible migración |
| Railway | Hobby mínimo 5 USD de consumo y Pro mínimo 20 USD, con créditos incluidos y excedentes [12] | Un mínimo no es el coste total de aplicación, base, volumen, tráfico y copias |

Puck especifica que BYOK en Launch/Growth sigue enrutando solicitudes por sus servidores. Por tanto, aportar clave propia no convierte el procesamiento en local ni elimina intermediarios. El plan sin cuota fija factura uso; no es IA gratuita. [10] Recomendación: excluir Puck Cloud del presupuesto inicial y evaluar únicamente el núcleo si el ensayo funcional lo justifica.

En Payload, MIT corresponde al software cubierto por esa licencia, no a un compromiso de alojamiento, soporte o acceso a funciones enterprise. Esta lectura no es una revisión jurídica de todas las dependencias y activos. No se ha fijado aún un inventario de licencias por versión; tampoco se han aceptado condiciones nuevas. [9]

No se obtuvieron tarifas comparables de Builder ni Render en las páginas consultadas: su representación recuperada no expuso importes utilizables. La URL `/pricing` de Payload devolvió 404. Esas ausencias se registran como información pendiente, no como coste cero ni como prueba de que no ofrezcan tarifas. [13][14]

### Escenario de presupuesto que falta medir

Para el primer owner, el presupuesto debe separar aplicación Node, PostgreSQL, medios y derivados, segunda copia independiente, transferencia, monitorización e IA opcional. Añadir también el trabajo periódico de mantenimiento; no presentarlo como dinero facturado por el proveedor, pero sí como esfuerzo propio necesario.

Escenario de cálculo propuesto, todavía no una medida del CMS: un editor, un proceso owner, 1 GB de base y 5 GB de medios antes de versiones. La retención puede multiplicar el volumen; el tamaño final depende de derivados, originales y frecuencia de sustitución. Medir primero memoria bajo edición/subida y el crecimiento real de versiones evita elegir un plan que solo sirva para el arranque.

Un presupuesto de consumo se calcula con recursos medidos y retención: `cómputo + base + medios/derivados/versiones + copia independiente + tráfico + servicios opcionales`. En planes con crédito incluido no se suma dos veces el mínimo y el consumo cubierto. No se da aquí un total mensual porque faltan memoria/CPU observadas, retención y destino. Ninguna tarifa anunciada demuestra por sí sola que el sistema pueda restaurarse.

Decisión provisional: continuar el desarrollo local sin cuota nueva; conservar Payload; no contratar IA/editor cloud; solicitar autorización únicamente ante una opción de alojamiento con presupuesto y alcance concretos. Reutilizar un servidor ya pagado podría evitar una nueva factura, pero todavía no se ha identificado uno autorizado ni su capacidad disponible.

Faltan comparativa económica con supuestos de uso, revisión de licencias por edición, repositorios fijados a SHA y pruebas ejecutables de los candidatos, estudios de tareas móvil/desktop, y contraste específico de IA y conectores. No se afirma que Puck o Live Preview sean mejores en nuestro entorno hasta ejecutar sus ensayos. El objetivo final sigue siendo un producto utilizable y mantenible, no un catálogo de tecnologías.

## Fuentes

Consultadas el 9 de septiembre de 2026. Documentación mutable; sin versión fijada salvo dependencias locales. Las afirmaciones comerciales proceden de sus proveedores, no de evaluaciones independientes.

1. Payload, [Live Preview](https://payloadcms.com/docs/live-preview/overview).
2. Payload, [Enterprise](https://payloadcms.com/enterprise).
3. Puck, [Introduction](https://puckeditor.com/docs).
4. Puck, [repositorio](https://github.com/puckeditor/puck), README y redirección consultados; no auditoría integral del código.
5. Puck, [Data Migration](https://puckeditor.com/docs/integrating-puck/data-migration).
6. Builder, [Components-only Mode](https://site.builder.io/c/docs/guides/components-only-mode).
7. Sanity, [Overlays and click-to-edit](https://www.sanity.io/docs/visual-editing/visual-editing-overlays).
8. GrapesJS, [Storage Manager](https://grapesjs.com/docs/modules/Storage.html).
9. Payload, [LICENSE.md en main](https://github.com/payloadcms/payload/blob/main/LICENSE.md), licencia mutable consultada; no inventario jurídico versionado.
10. Puck, [Pricing](https://puckeditor.com/pricing), tarifas cloud y aclaración BYOK.
11. Sanity, [Pricing](https://www.sanity.io/pricing), planes y privacidad de datasets.
12. Railway, [Pricing](https://railway.com/pricing), mínimos, créditos y consumo.
13. Builder, [Pricing](https://www.builder.io/pricing), consulta sin importes comparables recuperados.
14. Render, [Pricing](https://render.com/pricing), consulta sin importes comparables recuperados.
