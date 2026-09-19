# Nicepage / Artisteer: investigación aplicada al CMS

19 septiembre 2026. Responsable: Codex. Investigación documental y lectura de código público; no prueba práctica autenticada del editor, ni estudio con usuarios. No se instalan dependencias, importan plantillas ni publica CMS. Las propuestas siguientes no se presentan como implementadas.

## Conclusión ejecutiva

La oportunidad no es reproducir un constructor con cientos de controles: es permitir que alguien sin formación termine una web propia y sepa modificarla sin miedo. Recomiendo combinar **inicio guiado + bloques adaptables + marca global + edición contextual + recuperación clara**. El lienzo libre debe ser una opción avanzada, no la primera pantalla.

Artisteer anuncia oficialmente el cierre de su proyecto y remite a Nicepage. No era exclusivamente una herramienta para artistas: su sucesor se dirige a múltiples sectores. [Aviso oficial](https://www.artisteer.com/?order=new&p=website_templates), [historia de la compañía](https://nicepage.com/about).

Hay plantillas públicas de Nicepage, pero no son un catálogo que podamos redistribuir dentro de nuestro producto. Su licencia permite modificaciones y uso en una web, pero prohíbe ofrecer la plantilla descargable y redistribuirla, incluso modificada. Una respuesta informal de soporte no basta para sustituir esa condición. Para un catálogo integrado haría falta autorización específica o activos propios/con licencia compatible. [Licencia, apartados 2–4](https://nicepage.com/license-templates).

## Qué evidencia tenemos y qué no

| Evidencia | Alcance real | Confianza |
| --- | --- | --- |
| Cinco capturas entregadas por Manuel | Marketing: ejemplos, promesa sin código, dispositivos y catálogo | Alta sobre lo visible; ninguna sobre eficacia del editor |
| Documentación oficial enlazada | Funciones y recorrido documentado | Alta sobre lo documentado; no garantiza versión/interacción real |
| Repositorios y dos módulos fuente inspeccionados | Arquitectura y condiciones de reutilización concretas | Alta para archivos consultados; no auditoría de todo el motor |
| Código local Pages y content-layout + investigación previa | Estructura editorial existente | Alta para esa estructura; no prueba completa del CMS |
| Diagnóstico UX y prioridades siguientes | Inferencia profesional aplicada a nuestros objetivos | Media; necesita ensayo con principiantes |

No se ha medido frecuencia de problemas de usuarios de Nicepage. Tampoco se ha comprobado rendimiento, accesibilidad o paridad entre sus aplicaciones. Su guía inicial avisa que parte del vídeo corresponde a una versión anterior; las cifras de catálogo cambian entre páginas y no deben convertirse en requisitos nuestros.

## 1. Cómo orientan visualmente

### Las capturas de Manuel

La miniatura larga enseña un resultado final antes de explicar controles: reduce la necesidad de imaginar una página desde cero. El montaje de dispositivos comunica adaptación mediante una imagen fácil de entender. Los bloques «sin código» y «mobile-friendly» traducen tecnología a beneficios. La galería amplia transmite variedad.

Mi crítica: una galería extensa puede sustituir el miedo a la página vacía por el miedo a elegir mal. Las capturas largas también dificultan comparar estructura y legibilidad móvil. No copiaría su cantidad ni su estética publicitaria. En nuestro selector mostraría propósito, contenido necesario, vista móvil y posibilidad de cambiar después.

### La interfaz documentada

La guía distribuye navegación de páginas/bloques a la izquierda, lienzo al centro y propiedades a la derecha. La barra superior reúne modos responsive y guardar/previsualizar/publicar. Ofrece diseños iniciales, presets de bloques y estilos globales de color/tipografía. La selección distingue elemento, contenedor y bloque. [Inicio del editor online](https://nicepage.com/doc/1316/start-online-builder).

Inferencia: esa estabilidad espacial ayuda a aprender dónde buscar, pero tres niveles de selección pueden confundir. Nuestro panel debería titularse «Estás editando: imagen / tarjeta / sección», mostrar una ruta corta y ofrecer solo las propiedades más frecuentes. Los controles avanzados pueden desplegarse sin cambiar de pantalla.

## 2. Libertad, arrastre y precisión

Nicepage documenta imanes respecto a elementos y contenedores, distancias visibles, columnas de referencia, agrupación, bloqueo de capas y movimiento de bloques mediante flechas además de arrastre. [Editor visual](https://nicepage.com/features/c/visual-page-editor).

No basta con implementar drag and drop: el usuario necesita anticipar dónde caerá algo, si desplazará contenido y cómo revertirlo. Propuesta propia:

- **Modo guiado predeterminado:** arrastrar secciones o tarjetas; destino resaltado y hueco anticipado. Texto «Mover antes de Servicios», no solo una línea.
- **Alternativa accesible:** botones «Subir/Bajar», teclado y anuncio del nuevo orden. El móvil no debe depender de un gesto fino.
- **Modo libre dentro de un contenedor:** mostrar límites, anclaje y efecto responsive antes de confirmar. Nunca coordenadas globales arbitrarias como modelo único.
- **Cruceta de Manuel:** paso exacto editable en el centro, flechas y modo continuo. Detener al soltar, cancelar o perder foco. Un gesto sostenido debe ser una sola acción de deshacer, no cientos.
- **Imanes explicables:** «Alineado al margen» o «Alineado al centro» y un control visible para desactivarlos; evitar saltos misteriosos.
- **Selección y arrastre distintos:** tocar selecciona; asa explícita mueve. No secuestrar el scroll de toda la página en móvil.

## 3. Responsive: la parte que el marketing simplifica

La documentación permite cambios por modo, aconseja trabajar de mayor a menor y ofrece reinicio responsive por bloque. [Modos responsive](https://nicepage.com/doc/1125/responsive-modes). El grid estructura contenido en celdas, admite intercambio por arrastre y ocultación por dispositivo. [Grid](https://nicepage.com/doc/17389/grid-element).

Aplicación propuesta: enseñar «Heredado del diseño general» frente a «Personalizado para móvil». El usuario debe poder restaurar una propiedad sin borrar las demás. Diseñar con flujos, columnas y espaciados primero; excepciones después. Ocultar un elemento no debe ser la solución automática para contenido importante que no cabe.

La vista en tres dispositivos no certifica todos los anchos. Probar además tamaños intermedios, texto largo, zoom, tipografía cargando y pantalla pequeña. Un indicador «Móvil revisado» solo se marca tras revisión, no por existir una pestaña móvil.

## 4. Plantillas: qué conviene construir nosotros

Nicepage ofrece búsqueda y categorías como portfolio, fotografía, servicios y biografía. Es una referencia de descubrimiento, no permiso de importación. [Catálogo público](https://nicepage.com/html-templates).

Propongo un catálogo inicial propio de cuatro estructuras, reutilizando los mismos bloques y tokens:

| Plantilla propuesta | Objetivo | Contenido mínimo | Riesgo a prevenir |
| --- | --- | --- | --- |
| Portfolio profesional | Mostrar trabajo y conseguir contacto | Presentación, 3 proyectos, perfil, contacto | Imagen espectacular sin explicar aportación |
| Artista / fotógrafo | Recorrer obra | Serie, ficha de obra, autor, contacto | Galerías pesadas y pies ilegibles |
| Servicios independientes | Solicitar información | Propuesta, servicios, proceso, pruebas, contacto | Formularios sin destino/configuración |
| Perfil editorial | Leer y volver | Presentación, artículos, temas, perfil | Página vacía sin textos iniciales útiles |

Son diseños pendientes, no entregables ya construidos. Cada ficha debería incluir: objetivo, secciones incluidas, tiempo de contenido estimado como orientación, previa clara/oscura y móvil, recursos necesarios, autor y licencia. Seleccionar una plantilla crea un borrador, nunca reemplaza una web publicada.

Separar tres niveles: plantilla de sitio, composición de página y receta de bloque. Cambiar la paleta no crea una plantilla nueva. Cambiar plantilla debe proponer un mapa de contenido y conservar lo no encajado en una bandeja recuperable; no eliminarlo silenciosamente.

Contrato de datos propuesto: identificador/versionado, tipos de bloques admitidos, tokens de marca, contenido orientativo claramente marcado, requisitos de medios, licencia de cada activo y migraciones. Nada de HTML o JavaScript arbitrario pegado desde una descarga.

## 5. Código público: resultados de la búsqueda

El repositorio [NicepageApp/Nicepage](https://github.com/NicepageApp/Nicepage) contiene README e imágenes en su raíz; no se ha localizado allí el motor editable ni licencia que permita reconstruirlo. No confundir el HTML generado con código abierto del constructor.

| Candidato abierto | Licencia consultada | Utilidad para nosotros | Decisión provisional |
| --- | --- | --- | --- |
| [Puck](https://github.com/puckeditor/puck) | [MIT](https://raw.githubusercontent.com/puckeditor/puck/main/LICENSE) | Editor visual orientado a React; estudiar adaptación de componentes propios | Primer candidato para una prueba aislada, no sustitución inmediata |
| [GrapesJS](https://github.com/GrapesJS/grapesjs) | [BSD de tres cláusulas en core](https://raw.githubusercontent.com/GrapesJS/grapesjs/dev/packages/core/LICENSE) | Motor amplio y modular de creación visual | Referencia de arquitectura; mayor coste de adaptación a nuestro esquema |
| [Craft.js](https://github.com/prevwong/craft.js) | [MIT](https://github.com/prevwong/craft.js/blob/master/LICENSE) | Base React para construir un editor propio | Más control, pero también más interfaz que construir y mantener |

Las licencias permisivas requieren conservar avisos; no cubren automáticamente plugins, servicios comerciales, imágenes ni fuentes. No se afirma que estos proyectos tengan la misma cobertura funcional ni que sean igualmente mantenidos: falta evaluar versiones fijadas, issues, dependencias, accesibilidad y coste de integración antes de elegir.

### Lectura focal de código realizada

En [Puck, reducer/index.ts](https://raw.githubusercontent.com/puckeditor/puck/main/packages/core/reducer/index.ts) se separan operaciones de insertar, mover, reordenar, duplicar y eliminar. El interceptor permite decidir si una acción registra historial y diferencia cambios de interfaz/datos. Lección aplicada: seleccionar un elemento no debería llenar el historial del usuario; reordenar sí.

En [GrapesJS, undo_manager/index.ts](https://raw.githubusercontent.com/GrapesJS/grapesjs/dev/packages/core/src/undo_manager/index.ts) hay seguimiento de cambios con estados anterior/posterior, exclusiones para cambios parciales y operaciones de deshacer/rehacer. Depende de su modelo y otras bibliotecas: copiar el archivo aisladamente no es una integración sensata. Lección aplicada: separar previsualización durante el gesto del cambio final persistible.

No se ha copiado código. Antes de cualquier reutilización: fijar commit, registrar origen/licencia, analizar dependencias, comprobar compatibilidad con React/Payload, aislamiento autenticado, serialización sin pérdida y pruebas de interacción. La elección no se hará por estrellas ni por promesas de marketing.

## 6. Contraste con nuestro CMS actual

Lectura local: `owner-platform/src/collections/Pages.ts` ya define bloques editoriales y validación de marca antes de publicación. `owner-platform/src/preview/content-layout.ts` adapta páginas, artículos y proyectos a la vista previa sin aplanar el contenido original. No procede reemplazar ese esquema por el JSON de otro motor sin un adaptador y prueba de ida/vuelta.

La investigación previa [3D y CMS](interactive-3d-and-cms-research-2026-09-17.md) registra encuadre por formato e herencia en MediaPlacementEditor/placement-preview, pero no un lienzo libre ni cruceta. También existen componentes de revisión/publicación: su existencia no demuestra que el recorrido sea fácil para principiantes.

Recomendación: conservar Payload como fuente editorial y la publicación separada. Introducir mejoras de interfaz sobre los contratos existentes. Si se ensaya Puck, que sea un laboratorio autenticado con tres bloques propios, no una dependencia importada por el portfolio público. No cambiar autenticación, despliegue ni modelo comercial en esta fase.

## 7. Prioridades y problemas a validar

Frecuencia desconocida en todos los casos: no hay sesiones de usuarios en esta investigación. Severidad e impacto son hipótesis, no defectos medidos de Nicepage.

| Prioridad | Riesgo para un principiante | Severidad prevista | Confianza | Incremento verificable |
| --- | --- | --- | --- | --- |
| P0 | Confundir guardar con publicar | Alta | Alta por consecuencias | Borrador visible y resumen antes de publicar |
| P0 | Perder contenido cambiando diseño | Alta | Alta por consecuencias | Deshacer y preservación de contenido no mapeado |
| P1 | No saber por dónde empezar | Alta | Media | Tres opciones por objetivo y primera tarea útil |
| P1 | Ajustar móvil y romper desktop | Alta | Media | Herencia explícita y restauración por propiedad |
| P1 | No acertar con arrastre táctil | Media/alta | Media | Asas, flechas y destinos legibles |
| P2 | Duplicar estilos en cada bloque | Media | Alta por arquitectura | Recetas globales versionadas y excepciones visibles |
| P2 | Saturación de controles | Media | Media | Panel contextual con básicos primero |

La nueva respuesta de pulsación de los CTA es una primera receta compartida, no un sistema completo terminado. Próximas recetas: principal, secundario, foco, pulsación, deshabilitado, carga y error. Los estados de error o guardado no deben distinguirse solo por color ni usar halo decorativo para todo.

## 8. Flujo y prueba de aceptación propuestos

Flujo propio: elegir objetivo → elegir estructura → completar contenido → aplicar marca global → revisar móvil → previsualizar → confirmar publicación. Se puede volver atrás sin perder trabajo; los pasos completados no bloquean la edición libre posterior.

Primer ensayo con cinco personas de poca experiencia, sin tutorial previo obligatorio: escoger una estructura, cambiar título/imagen, mover una sección, corregir móvil, deshacer un cambio y explicar qué está publicado. Registrar éxito sin ayuda, dudas, errores, abandonos y comprensión del estado. Cinco sesiones detectan problemas, no estiman prevalencia poblacional.

Criterios de salida: ninguna pérdida de contenido; publicación siempre intencional; teclado y alternativa al arrastre; cancelación segura; mismos datos al guardar/reabrir; sin aumento del bundle público por el editor; contraste y foco revisados; tiempos de respuesta medidos en equipo medio. Objetivo inicial de usabilidad propuesto: al menos cuatro de cinco completan el recorrido principal sin intervención, con cero publicaciones accidentales. Ajustar tras piloto, no declararlo logrado ahora.

## 9. Límites y siguientes comprobaciones

Nicepage documenta exportación de proyectos/páginas/bloques, pero señala diferencias entre aplicaciones y plugins. Esto no equivale a exportar un proyecto editable a cualquier plataforma. [Exportación](https://nicepage.com/doc/5084/export-project-page-block).

Pendiente para una segunda fase práctica: recorrido real del editor con acceso autorizado, prueba táctil/teclado, errores de guardado, cambios entre formatos, muestra de exportación y evaluación de accesibilidad. No se ha creado cuenta, descargado aplicación ni usado datos privados. Tampoco se ha confirmado permiso para redistribuir activos de Nicepage.

Siguiente responsable: Codex, preparar un incremento acotado de selección guiada/herencia sobre el CMS existente. Decisiones de Manuel antes de ampliar alcance: primer público objetivo, tipos de web iniciales y si exportar a otras plataformas es requisito real. No hace falta bloquear los refinamientos actuales por estas decisiones.
