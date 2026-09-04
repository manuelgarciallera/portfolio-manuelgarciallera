# Auditoría visual y plan de reducción editorial · 3 septiembre 2026

## Decisión principal

La landing ya tiene buenos materiales y una dirección reconocible, pero intenta explicar demasiadas cosas antes de haber ganado la atención. La referencia de Clay funciona por la secuencia contraria: una promesa, una imagen, espacio y después profundidad.

La recomendación es una **reducción editorial**, no un cambio de identidad. Se conserva el contraste blanco/negro, la tipografía de gran escala, el vidrio, el color vibrante y el 3D; se eliminan duplicidades, separadores decorativos y microseñales que compiten entre sí.

## Comparación visual capturada

Todas las capturas se tomaron en el navegador integrado para comparar la referencia real con la implementación local.

### 1. Portada móvil de Clay · referencia

![Clay a 390 px](../artifacts/audit/2026-09-03-landing/12-clay-mobile-390.png)

**Estado:** saludable.

- Una sola frase de posicionamiento.
- Una única imagen dominante aparece antes de cualquier explicación extensa.
- Cabecera mínima: marca, contacto y menú.
- No necesita kicker, metadatos, indicador de scroll ni dos llamadas a la acción para orientar.

### 2. Portada móvil del portfolio · implementación

![Portfolio a 390 px](../artifacts/audit/2026-09-03-landing/13-portfolio-mobile-light-390.png)

**Estado:** visualmente fuerte, pero sobreexplicado.

- El artefacto tiene calidad suficiente y conserva el interés en móvil.
- Compiten el kicker, el nombre, cinco especialidades, dos botones y el indicador de scroll.
- El logo actual no comunica todavía `MG` y queda excesivamente abstracto.
- La promesa profesional se deduce de etiquetas; debería entenderse con una frase humana.

### 3. Portada de escritorio

![Portfolio de escritorio](../artifacts/audit/2026-09-03-landing/11-portfolio-light-desktop-top.png)

**Estado:** buena composición base, demasiados puntos de salida.

- El nombre y el artefacto equilibran bien la pantalla.
- Se repite `Explorar proyectos` dentro de la imagen y fuera de ella.
- Kicker, especialidades, metadatos de esquina, dos CTA e indicador de scroll fragmentan la jerarquía.
- La barra tiene el comportamiento correcto de aparecer al subir y ocultarse al bajar, pero puede estrecharse y simplificar su identidad.

### 4. Entrada a proyectos

![Introducción de casos](../artifacts/audit/2026-09-03-landing/05-portfolio-desktop-projects.png)

**Estado:** contenido correcto, entrada lenta.

- La portada visual tarda demasiado en aparecer después del encabezado.
- Número, etiqueta, título, párrafo y CTA forman una antesala demasiado larga.
- Conviene que el proyecto empiece por su título y contribución, seguido inmediatamente por la imagen a sangre.

### 5. Tarjeta de Buy&Sell

![Tarjeta Buy&Sell](../artifacts/audit/2026-09-03-landing/06-portfolio-desktop-project-card.png)

**Estado:** la mejor pieza actual; necesita edición, no rediseño.

- La composición de marca impacta y las cuatro vistas aportan storytelling.
- La secuencia de 5–7 segundos y el hover que acompaña al puntero son decisiones válidas.
- El pie duplica información presente en la imagen: índice, etiquetas, año y CTA.
- El título debe ir antes de la imagen, como ya se había solicitado.

### 6. Práctica de investigación

![Banner de investigación](../artifacts/audit/2026-09-03-landing/07-portfolio-desktop-approach.png)

**Estado:** legible, pero el objeto pesa demasiado y está construido como arte CSS.

- El negro y el verde fosforito funcionan.
- La pieza debe ser un artefacto real, sencillo y con transparencia, no una aproximación hecha con capas CSS.
- El anillo y los átomos pueden conservar la idea de sistema atomizado, pero con movimiento moderado y una lectura más limpia.

### 7. Footer

![Footer actual](../artifacts/audit/2026-09-03-landing/08-portfolio-desktop-footer.png)

**Estado:** enérgico, pero contrario al minimalismo pedido.

- Hay demasiados objetos, materiales, brillos, malla y ruido simultáneos.
- Debe quedarse un único artefacto protagonista, texto de alto contraste y navegación clara.
- Los objetos visibles hechos con CSS deben sustituirse por activos reales o generados expresamente.

## Hallazgos prioritarios

### P0 · Jerarquía y retención

1. La portada móvil contiene más del doble de señales que la referencia antes del primer visual.
2. `CapabilityAccordion`, `Enfoque` y `Capacidades` repiten la misma promesa con palabras distintas.
3. Las llamadas a la acción se repiten dentro y fuera de varias piezas.
4. Los proyectos presentan su título después de la imagen, en contra de la lectura editorial acordada.

### P1 · Sistema visual

1. La regla global que dibuja una línea al inicio de cada sección convierte el ritmo en una sucesión de separadores.
2. Números, guiones, flechas y versales aparecen incluso cuando no comunican estado ni progreso.
3. El arte CSS del banner, las miniaturas de artículos y el footer no tiene la calidad material de los activos 3D reales.
4. El artefacto orbital actual es bueno como imagen editorial, pero la esfera refractiva histórica de Three.js es más simple, dinámica y próxima al criterio indicado.

### P1 · Contenido

1. La voz ya es más personal, pero la repetición de `investigo`, `prototipo`, `sistemas` e `implemento` la vuelve programática.
2. La narrativa más sólida es: **del diseño gráfico y espacial al producto digital; de la investigación a un sistema implementado**.
3. `Atomic Design` puede afirmarse con rigor y enlazarse a Buy&Sell, donde Figma documenta átomos, moléculas y organismos.
4. El 3D y la arquitectura interior deben aparecer al final de las capacidades como práctica complementaria, no como una identidad paralela.

### P1 · Activos

1. Buy&Sell ya dispone de nueve exportaciones reales de Figma entre 1500 px y 6400 px; puede actualizarse sin inventar interfaces.
2. La captura móvil de LaLiga (390 × 843) y la vista MVP de TheUXUnion (1265 × 712) son insuficientes para grandes composiciones de escritorio.
3. Un reescalado puede reducir artefactos, pero no recuperar detalle. Para UI se necesitan exportaciones originales; la IA se reserva para fondos, iluminación, materiales y mockups.

## Dirección propuesta

### Portada

- Cabecera más estrecha, vidrio esmerilado al subir y ocultación al bajar.
- Marca geométrica `MG` legible, negra y reducida a una sola construcción.
- Una promesa: **«Conecto investigación, diseño y código para construir productos que se entienden, se usan y evolucionan.»**
- Un visual: recuperar la esfera refractiva histórica como artefacto interactivo principal; conservar la imagen orbital aprobada para otra sección.
- Un CTA máximo: `Ver proyectos`.
- Eliminar kicker, lista de especialidades, CTA sobre la imagen, metadatos de esquina e indicador de scroll.

### Secuencia de landing

1. Portada: promesa + artefacto.
2. Casos seleccionados: título y contribución antes de cada imagen a sangre.
3. Una sola sección de práctica/capacidades, basada en evidencia.
4. Cita de Frank Herbert centrada y sin bordes.
5. Artículos con miniaturas reales y distintas, dentro de un mismo lenguaje material.
6. Contacto breve y footer con un único objeto.

### Proyectos

- Mantener tres o cuatro escenas por proyecto y una duración total de 5–7 segundos.
- Conservar controles pequeños, alineados abajo, y hover contextual en escritorio.
- Pie reducido a título, una frase de contribución y, sólo cuando sea necesario, estado del proyecto.
- Eliminar índice decorativo, cadena de tecnologías y CTA duplicado.

### Separadores

- Retirar la línea global de todas las secciones.
- Conservar líneas únicamente en acordeones, formularios, tablas o progresos donde expliquen estructura.
- Sustituir la separación por espacio, cambio de escala y alternancia de fondo.

### Activos visuales

- UI: siempre exportación real de Figma, sin regenerarla con IA.
- Mockups: dispositivo/fondo generado o renderizado y pantalla real compuesta después.
- 3D: un objeto por escena, silueta clara, transparencia real, dos materiales como máximo y un acento fosforito.
- Movimiento: 5–7 segundos en carruseles; microinteracciones más cortas; alternativa estática con `prefers-reduced-motion`.

## Orden de implementación propuesto

1. Reducir portada y navegación.
2. Eliminar duplicación entre acordeón, manifiesto y capacidades.
3. Retirar separadores globales y metadatos decorativos.
4. Reordenar títulos de proyectos y simplificar sus pies.
5. Incorporar las exportaciones HD de Buy&Sell y generar derivados WebP/AVIF.
6. Recuperar el artefacto WebGL histórico con fallback estático.
7. Sustituir arte CSS de investigación, artículos y footer por activos reales.
8. Revisar 390, 768, 1440 y 1920 px; teclado, foco, contraste, reducción de movimiento y rendimiento.

## Criterio de aceptación

- En móvil, antes del primer visual sólo aparecen cabecera, una promesa y como máximo un CTA.
- Ningún proyecto repite la misma llamada a la acción en imagen y pie.
- Ninguna línea horizontal existe sólo como decoración.
- Ninguna interfaz se reescala por encima de su resolución útil o se regenera con IA.
- Todos los textos sobre blanco usan negro con contraste claro; sobre negro, blanco consistente.
- El sitio conserva personalidad 3D y color, pero cada viewport tiene un único foco dominante.

## Límite de la auditoría

Las capturas permiten juzgar composición, densidad y jerarquía. No demuestran por sí solas navegación por teclado, lectura con tecnologías de asistencia, contraste calculado, rendimiento ni funcionamiento de formularios. Esas comprobaciones corresponden a la fase de implementación y QA.

## Estado de implementación · cierre de fase

- Portada reducida a una promesa, un CTA y un único artefacto 3D. La primera carga utiliza un render estático de 21 KB y activa WebGL sólo tras interacción.
- Cabecera compacta y esmerilada, monograma `MG` legible, menú móvil comprobado y navegación con ocultación/reaparición según el scroll.
- Títulos y contribución de los proyectos aparecen antes del visual; se retiraron CTA duplicados, índices y separadores decorativos.
- Buy&Sell incorpora dos exportaciones HD reales de Figma. Los proyectos mantienen carruseles de 5–7 segundos con controles reducidos.
- La práctica de 3D y arquitectura interior queda al final y descrita como disciplina complementaria. `Atomic Design` se vincula a evidencia real del sistema Buy&Sell.
- El banner de investigación y el footer usan activos reales, sin ilustraciones construidas con CSS.
- QA final: 21 archivos de test y 54 pruebas superadas; tipado, lint y ocho perfiles responsive correctos.
- Lighthouse de producción: móvil 90/100/100/100 y escritorio 100/100/100/100 en rendimiento, accesibilidad, buenas prácticas y SEO.

### Pendiente deliberado

- La localización completa a inglés, francés, español, italiano, alemán y chino requiere una arquitectura de contenidos y revisión lingüística por idioma; no debe resolverse con traducción automática sin control editorial.
- LaLiga, Coordination Hub y TheUXUnion necesitan nuevas exportaciones originales seleccionadas por el autor para alcanzar en escritorio la misma calidad de imagen que Buy&Sell.
