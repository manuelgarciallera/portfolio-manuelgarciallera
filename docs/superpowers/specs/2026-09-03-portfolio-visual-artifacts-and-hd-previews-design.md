# Portfolio: artefactos visuales, capacidades y previews HD

## Objetivo

Refinar la landing sin añadir ruido visual. La página debe conservar su estructura editorial y mejorar su capacidad de retención mediante objetos 3D con identidad, pequeñas evidencias visuales y previews de proyecto nítidas. El sistema seguirá combinando fondos negros y blancos cálidos, color pastel y acentos fosforitos.

## Principios de diseño

- Cada objeto visual debe explicar una idea; ninguno se incorpora como decoración genérica.
- Un único protagonista visual por tramo de página.
- Fondos plenamente negros en modo oscuro y blancos cálidos en modo claro. Se eliminará la franja gris del escenario del hero.
- Los objetos tendrán materiales táctiles u ópticos, geometría sencilla, movimiento pausado y espacio negativo.
- El verde fosforito será un acento semántico para conexión, investigación o estado activo, no un color de relleno general.
- Todas las animaciones respetarán `prefers-reduced-motion`.

## 1. Hero y recuperación del artefacto original

Se recuperará del historial `archive/hero-v1` el artefacto WebGL refractivo basado en `HeroOrbCanvas`: una esfera líquida que deforma y refracta la tipografía situada detrás. No se sustituirá por una recreación generada ni por una imagen estática.

La adaptación conservará:

- deformación orgánica continua y lenta;
- refracción óptica y aberración cromática muy contenida;
- respuesta suave al puntero en escritorio;
- una única geometría estable durante toda la sesión;
- fondo `#050505` en modo oscuro y `#fbfbf8` en modo claro;
- fallback estático únicamente durante la carga o con movimiento reducido.

El artefacto no invadirá el titular ni reducirá su legibilidad. En móvil aparecerá completo después del bloque de texto, con una escala proporcionada y sin recorte accidental.

## 2. Evidencias visuales en las capacidades

Cada acordeón de «Lo que hago» incorporará, debajo del texto y del enlace, una imagen horizontal pequeña relacionada con la capacidad abierta. Solo se mostrará la imagen del acordeón activo.

Las seis direcciones visuales serán:

1. **Producto digital:** recorridos y decisiones representados como piezas conectadas.
2. **UX/UI y sistemas:** tokens o módulos que forman una estructura reutilizable.
3. **Frontend:** una superficie visual que pasa de estructura a interfaz ejecutable.
4. **Investigación HCI:** relación entre materia, percepción y acción humana.
5. **IA aplicada:** agentes conectados con un nodo humano claramente central.
6. **3D y arquitectura interior:** volumen, luz, material y escala espacial.

Las imágenes serán activos raster reales, con fondo transparente o adaptado al fondo claro de la sección. Tendrán baja densidad compositiva, proporción aproximada 16:9, sin texto incrustado y sin marcos pesados. Se cargarán de forma diferida y su apertura utilizará la misma transición del acordeón para evitar saltos.

## 3. Aire en el bloque HCI

El objeto de la esfera oscura con anillo se separará visualmente del cuerpo de texto. En móvil se añadirá entre 32 y 48 px de espacio efectivo antes del objeto; en escritorio se conservará la composición lateral existente.

La separación no debe crear un vacío desligado: el artefacto seguirá perteneciendo al bloque y permanecerá antes del CTA. Se verificará que el encabezado, el párrafo, el objeto y el CTA no se solapen en alturas móviles reducidas.

## 4. Transición hacia casos seleccionados

Antes de la etiqueta «Casos seleccionados» aparecerá un único artefacto 3D de transición. Representará tres capas —investigación, diseño e implementación— convergiendo en un nodo central de producto.

Será distinto del hero, del artefacto HCI, del objeto de capacidades y del footer. Usará materiales oscuros y pastel, con un acento fosforito, fondo transparente y movimiento suave al entrar en el viewport. No incluirá texto, CTA ni contenedor ornamental.

## 5. Previews de proyecto en alta definición

Las previews reutilizarán los archivos HD ya existentes. La mayoría de Buy&Sell alcanza 2514–3200 px y TheUXUnion 1290–1920 px; no se crearán duplicados de menor resolución.

Los cambios técnicos incluirán:

- calidad de optimización de Next Image entre 90 y 95;
- `sizes` ajustado al ancho real de cada preview en móvil y escritorio;
- revisión individual de `cover` y `contain` para evitar ampliaciones innecesarias;
- prioridad solo para la primera imagen visible y carga diferida para el resto;
- comprobación de densidad efectiva a DPR 2 y 3;
- revisión específica de LaLiga, cuyas capturas de escritorio son de 1424–1425 px y la captura móvil es de 390 × 843 px.

No se desactivará globalmente el optimizador de imágenes. Si una fuente concreta sigue perdiendo detalle, se corregirá únicamente esa imagen o se sustituirá por una exportación HD real.

## 6. Futuro acceso a Something Human

El enlace no se publicará hasta que exista un destino útil. La arquitectura queda preparada con esta nomenclatura:

- etiqueta breve de navegación: **Research Lab**;
- descriptor en menú desplegado: **Something Human · Human–AI Research**;
- tratamiento: acento verde fosforito restringido al enlace, punto de estado o indicador externo.

Esta combinación conserva la identidad de «Something Human» y explica el contenido a una persona que llega sin contexto. El destino futuro será un dominio propio y se abrirá como producto relacionado, no como una sección ambigua del portfolio.

## Responsive, accesibilidad y rendimiento

- Verificación en 390 × 844, 430 × 932, tableta, portátil y escritorio amplio.
- Ningún objeto 3D podrá bloquear enlaces, texto o desplazamiento táctil.
- Los canvas se pausarán fuera del viewport cuando sea posible.
- Los activos incluirán dimensiones intrínsecas para evitar cambios de layout.
- Las imágenes informativas tendrán texto alternativo; las puramente conceptuales serán decorativas.
- La experiencia seguirá siendo comprensible si WebGL no carga o el usuario reduce el movimiento.

## Verificación y criterios de aceptación

- El hero muestra el artefacto refractivo recuperado y utiliza el fondo correcto en ambos temas.
- El objeto del hero es estable: no cambia por otro recurso después de cargar.
- Cada capacidad abierta presenta una única imagen pertinente debajo del texto.
- El objeto HCI conserva al menos 32 px de separación respecto al texto en móvil.
- Existe un único artefacto distintivo antes de «Casos seleccionados».
- Las previews solicitan variantes de imagen adecuadas a DPR alto y se ven nítidas en móvil y escritorio.
- No hay solapamientos, desplazamiento horizontal, errores de consola ni regresiones de navegación.
- Pasan pruebas unitarias, revisión responsive, lint, TypeScript y compilación de producción.

## Fuera de alcance

- Publicar ahora el dominio o la sección Something Human.
- Rediseñar la navegación completa.
- Cambiar el contenido o la estructura narrativa de los casos.
- Crear nuevos proyectos o nuevas rutas.
