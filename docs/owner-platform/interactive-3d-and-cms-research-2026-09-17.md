# 3D interactivo y edición CMS · investigación aplicada

17/09/2026. Base pública `4cd3aac`; base de investigación `90292cb`. Investigación y pruebas de laboratorio, no certificación de fluidez en teléfonos físicos. No se cambia el motor 3D ni se publica CMS.

## Resultado medido, incluida la opción descartada

El diagnóstico anterior distingue coste de dibujo de errores de interacción: omitir temporalmente el dibujo del orbe mejora la cadencia en Chromium **SwiftShader software**. No equivale al rendimiento de una GPU móvil real. Presión sostenida, liberación, cancelación, pérdida de foco y scroll cuentan con pruebas funcionales independientes.

Se ensayó precalcular por fragmento matrices de rotación, posiciones y radios de lóbulos/gotas, reutilizándolos en los pasos de ray marching y las normales. El experimento conservó exactamente los píxeles en los cuatro escenarios probados, pero empeoró el tiempo: **ratio 1,342**, aproximadamente **34 % más lento**. Se descartó y se restituyó el shader de HEAD mediante un parche limitado al trabajo propio. No se publicó.

| Tiempo/tema/presión | Base mediana ms | Candidato ms | Diferencia máxima de canal |
| --- | ---: | ---: | ---: |
| 0 / oscuro / 0 | 84,1 | 121,7 | 0 |
| 4 / claro / 0 | 89,3 | 119,5 | 0 |
| 9 / oscuro / 0 | 91,4 | 118,7 | 0 |
| 4 / oscuro / 1 | 88,4 | 114,0 | 0 |

Evidencia `abf224`. Comparación inicial del shader consigo mismo: ratio1,005 (`248d95`), sin mejora, como corresponde. Primer intento con `gl.finish()` devolvió tiempos cero: medición inválida, no evidencia de rendimiento. El comparador usa lectura de un píxel para sincronizar; mide finalización más coste de sincronización, no un temporizador GPU puro. Nunca trasladar estas lecturas bloqueantes al cliente público.

`node scripts/compare-orb-shader.mjs` comprueba equivalencia visual contra `4cd3aac`. `--require-improvement` añade el umbral experimental de reducción del 15 %. No reducir el umbral para aprobar un candidato. Cuatro imágenes y siete muestras por escenario son una criba, no una prueba exhaustiva: ampliar fases, resoluciones, temas, presión y orden alternado antes de aceptar un cambio real.

## Criterios para la siguiente optimización

1. **Identificar el coste real.** Este orbe es procedural: comprimir un GLB, texturas KTX2 o reducir polígonos no resuelve su coste actual. Esas técnicas corresponderían a un modelo importado distinto. Aquí pesa el cálculo por fragmento.
2. **Conservar geometría y borde.** No bajar resolución ni quitar gotas para obtener un resultado artificialmente rápido. Mantener cobertura subpíxel: MSAA del cuadrilátero no suaviza por sí solo el contorno calculado del orbe. Comparar imágenes, no solo FPS.
3. **Separar gesto y animación.** Cancelar un puntero termina su deformación, no el reloj de render. Preservar scroll y zoom nativos; no añadir `preventDefault` global ni pausas mientras el dedo permanece apoyado.
4. **Ciclo de vida robusto.** Comprobar carga tardía, contexto perdido, desmontaje, pestaña oculta y movimiento reducido. Detener trabajo cuando está fuera de vista es distinto de congelarlo visible durante scroll. Mantener alternativa estática y limpieza de recursos/listeners.
5. **Evitar sincronizaciones innecesarias.** Consultas de errores/estado y lecturas de píxeles pertenecen al diagnóstico, no al bucle de producción. Revisar también medidas de layout repetidas y asignaciones, aunque no eliminan el coste GPU dominante.
6. **Worker no es garantía.** OffscreenCanvas puede aislar trabajo JavaScript; no elimina las operaciones del shader. No añadir complejidad de worker o una biblioteca 3D sin comparación real, manejo de eventos y recuperación.
7. **Gate de aceptación.** Mismo aspecto en ambos temas; presión sostenida, soltar/cancelar/blur y scroll continuo; fallback y movimiento reducido; presupuesto público sin regresiones; mediciones comparables y revisión posterior en dispositivo físico. No afirmar ausencia total de lag con la emulación.

Fuentes primarias consultadas: [buenas prácticas WebGL, MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices), [pointercancel](https://developer.mozilla.org/en-US/docs/Web/API/Element/pointercancel_event), [OffscreenCanvas](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas), [pérdida de contexto simulada](https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_lose_context), [smoothness, web.dev](https://web.dev/articles/smoothness). Las decisiones anteriores son aplicaciones al código propio, no citas ni garantías de los proveedores.

## CMS: investigación diferencial, no cambio de plataforma

Las fuentes documentan funciones, no demuestran que un producto sea universalmente el mejor ni que nuestra interfaz resulte usable sin ensayos.

| Referencia | Patrón útil | Aplicación concreta propuesta |
| --- | --- | --- |
| [Webflow: edición de contenido](https://help.webflow.com/hc/en-us/articles/33961251014931-Edit-site-content-as-a-content-editor) | Interfaz de contenido acotada, diseño protegido y permiso de publicación separado | Separar editar contenido de modificar diseño. Explicar borrador, revisión y publicación; guardar no debe aparentar publicar. |
| [Framer: edición sobre página](https://www.framer.com/help/articles/on-page-editing/) | Edición contextual de texto, imágenes y propiedades con permisos | Selección del elemento y controles próximos, sin exponer todo el esquema técnico al principiante. No incluir editor autenticado en el bundle público. |
| [Wix Studio: anclaje y espaciados](https://support.wix.com/en/article/studio-editor-working-with-docking-margins-and-padding) | Relaciones entre contenedor, márgenes y colocación | Priorizar layout guiado; modo libre delimitado, imanes y excepciones responsive explícitas, no coordenadas globales que rompan móvil. |

### Contraste con código real

- `MediaPlacementEditor.tsx` ya permite focal X/Y, zoom, ajuste, proporción y selección desktop/tablet/mobile. No es un editor libre de bloques ni una cruceta.
- `placement-preview.ts` hereda valores base cuando la excepción está vacía. Hay separación real de recetas por formato; falta valorar si la interfaz comunica esa herencia suficientemente y si permite restaurarla con claridad.
- `browser-media-placement.mjs` ya prueba crear, editar, guardar, reabrir, receta móvil independiente, controles bloqueados durante guardado y conservación de bytes originales. Es una prueba existente, **no reejecutada en navegador en esta investigación**.
- Se ejecutaron de nuevo cuatro suites focales: `content-layout`, `placement`, `placement-preview`, `brand/inheritance`: **57 pruebas pasan**, `a73a7b`. Esto valida adaptadores y reglas, no el recorrido completo ni usabilidad con principiantes.

### Siguiente incremento acotado

Antes de construir un motor libre: evaluar en el editor de encuadre cómo mostrar «heredado»/«personalizado» por formato y volver a la base sin destruir originales ni otros formatos. Ensayar editar → guardar → reabrir → previsualizar; comprobar readOnly/guardado en curso y teclado. Después retomar orden de bloques y deshacer.

La cruceta solicitada conserva paso exacto editable visible en el centro y modo continuo, con detención al soltar/cancelar/perder foco, una operación de deshacer por gesto y límites del contenedor. Sigue siendo **backlog**, no capacidad implementada. Lo mismo para presets de halo/borde/barrido y cristal. No introducir CSS o JavaScript arbitrario.

Próximo responsable: Codex, dentro del CMS aislado y de la ventana autorizada. No se necesita otra clave para estas comprobaciones. Infraestructura o decisiones de seguridad nuevas se reúnen en la entrega nocturna.
