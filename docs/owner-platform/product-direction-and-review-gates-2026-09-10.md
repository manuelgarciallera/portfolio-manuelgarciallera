# Owner Studio: dirección de producto y puertas de revisión

Solicitado por Manuel el 10 de septiembre de 2026. Registro de intención y criterios propuestos, no especificación aprobada de un rediseño ni promesa de disponibilidad comercial.

## Orden y restricción explícita

1. Cerrar el funcionamiento del CMS existente.
2. Enseñar la interfaz real y permitir que Manuel la pruebe.
3. Solo después, acordar cambios radicales de interacción o aspecto.

No reemplazar el panel actual por un lienzo nuevo durante su ausencia. No publicar ni alterar el portfolio para demostrar el editor. No considerar el botón nativo «Publicar cambios» una conexión con la web pública: hoy afecta al estado editorial del CMS; el puente público permanece desactivado.

## Pautas que deben conservarse

- Temas predefinidos reutilizables, con Avada como referencia conceptual aportada por Manuel, sin copiar código o activos.
- Catálogo visual de bloques: icono, nombre comprensible y previsualización de lo que se inserta.
- Seleccionar, añadir y reordenar contenido mediante arrastre; conservar alternativas por botones y teclado, especialmente en móvil.
- Borrado visible sobre el bloque y posible destino de papelera al arrastrar, siempre con recuperación/deshacer. La papelera no debe ser la única manera de borrar.
- Texto, jerarquías tipográficas, imágenes, recorte y encuadre accesibles sin código ni dependencia obligatoria de IA.
- Temas y bloques sobre contratos comunes, sin una copia divergente del repositorio por cliente. Cada identidad debe poder conservar su carácter.
- IA opcional que proponga ordenar o editar bloques conocidos. Vista previa, diferencias, permisos y confirmación antes de aplicar; no código arbitrario ni publicación implícita.
- Integración futura CMS/CRM/e-commerce por módulos y contratos; no acceso transversal automático a todos los datos.

## Requisitos visuales concretados por Manuel · 11 de septiembre

Son requisitos para el siguiente diseño revisable, no capacidades verificadas
por las pruebas del editor actual:

- Inspector contextual: mostrar qué caja se selecciona y qué cambia cada control.
- Tipografía seleccionable con muestras reales; colores visibles junto al valor,
  selector gráfico y combinaciones de paleta previsualizables.
- Bordes por lado o conjuntos, grosor/color/estilo; radios conjuntos o por esquina;
  fondos sólidos y degradados con dirección y posiciones visibles.
- Composición guiada por filas y columnas, proporciones predefinidas y destino de
  inserción resaltado. Mostrar/ocultar guías y pasar a vista previa sin controles.
  No sustituirlo por posicionamiento libre absoluto.
- Efectos predefinidos seleccionables sobre texto o imagen y temas precargados que
  agrupen colores, tipografías y efectos. Herencia de tema con ajustes explícitos
  por bloque; posibilidad de volver al tema y deshacer.
- Mantener equivalentes por teclado/botones, controles adaptados a móvil y respeto
  a movimiento reducido. Hover no puede ser necesario para acceder al contenido.

Primer alcance de diseño: una sección completa con inspector y previsualización,
revisada con Manuel antes de extender o reemplazar la interfaz. Las decisiones
visuales y las licencias/carga de fuentes deben quedar comprobadas, no inferidas.

## Estado del editor existente

El CMS actual usa formularios y bloques de Payload, perfiles de marca, recetas de encuadre, previsualización y evidencia de versiones. No es aún un lienzo libre tipo Figma ni un producto equivalente a Avada. Las capturas locales del 10/09 a las17:44–17:46 muestran contenido sintético de QA; no son un nuevo ensayo del build final ni una cuenta de cliente.

La asistencia actual permite preparar/revisar propuestas, pero no hay proveedor de modelos conectado ni aplicación automática. La selección de modelos y proveedores, sus costes y condiciones siguen pendientes. Ningún login de ChatGPT/Claude se presume equivalente a acceso gratuito a API.

## Hitos propuestos y prueba de cierre

| Hito | Evidencia necesaria | Responsable / decisión |
| --- | --- | --- |
| CMS operativo | Crear → editar → preview → revisar → publicar en destino de prueba → restaurar; cuenta y medios recuperables | Codex; infraestructura real pendiente |
| Revisión de la interfaz | Manuel prueba una página y señala lo que no entiende, sin tutorial continuo | Manuel con entorno preparado por Codex |
| Primer tema reutilizable | Segunda landing con identidad distinta, mismas piezas, sin duplicar repo ni degradar rendimiento/accesibilidad | Diseño revisado antes de implementar |
| Editor de bloques simplificado | Añadir, mover, editar y deshacer con ratón, teclado y móvil; errores y tiempos medidos | Codex implementa; Claude revisión acordada |
| Asistencia útil | Propuesta de orden sobre bloques existentes, comparación, aprobación y reversión verificadas | Modelo y coste requieren decisión explícita |
| Primer flujo entre productos | Consulta consentida de una web → CRM, sin duplicados ni cruces entre clientes | Acordar contratos con responsable de Linocube |

## Vía doctoral, separada de la comercial

Posible pregunta a concretar con dirección de tesis: cómo cambia el control, la consistencia visual y el esfuerzo de autoría al usar reglas de un sistema de diseño y asistencia generativa frente a edición manual por bloques. No se afirma novedad científica sin revisar literatura.

Conservar versiones del sistema, configuraciones, decisiones y resultados reproducibles. Comparar condiciones con las mismas tareas y contenido; medir errores, recuperación, tiempo, accesibilidad y percepción de control. Un CMS funcionando no demuestra por sí solo una contribución doctoral. Estudios con personas o datos reales requieren consentimiento, privacidad y procedimiento académico apropiado antes de ejecutarse.

El e-commerce adaptativo por ventas o atención es otra hipótesis, no una función acordada para esta fase. No equiparar tiempo de permanencia con intención de compra; contrastar criterios, control del comerciante y consecuencias antes de experimentar. No reutilizar TFM/LALIGA ni sus activos sin revisar autoría y permisos.

## Siguiente trabajo sin rediseño radical

Validar controles y recorridos existentes, corregir fallos demostrados y preparar una demostración local comprensible. Mantener limitaciones de almacenamiento productivo, publicación y proveedores visibles. El resultado comercial se evaluará con uso real y soporte, no por número de funcionalidades o pruebas automáticas.

## Verificación de controles de esta sesión

Actualización 11/09: las puertas HTTPS de editor y medios ya pasan en Docker
aislado, según `docker-editor-verification-2026-09-11.md`. La creación nativa
por formulario se amplía en `native-page-creation-verification-2026-09-11.md`.
Esto no sustituye staging real ni la revisión del nuevo diseño con Manuel.

`node tests/dashboard.browser.mjs` y `node tests/document-controls.browser.mjs`: salida0 (`ae2dad`). Dashboard320/390/768/1280 en claro/oscuro: búsqueda, navegación, teclado y controles táctiles. Acciones editoriales1280/390: confirmaciones, revisión de propuestas y estados de error. Son componentes reales montados en fixtures con API sintética y sustituciones de contexto, no recorrido completo contra Payload ni validación de usuarios reales. No se cambió la interfaz ni se desplegó. Se mostró una captura real histórica del editor a768px, no una captura recién tomada ni una demo interactiva.
