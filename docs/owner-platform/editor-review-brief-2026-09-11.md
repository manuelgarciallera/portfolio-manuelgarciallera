# Revisión del editor: punto de partida verificable

Base: bad903ba01161eb56f7e19f55c49a404f415e068. Preparación de revisión,
no implementación ni aprobación de un rediseño.

## Qué ver

La captura `.audit/cms-editor-768-light.png` es del 10/09, con datos sintéticos.
Muestra el editor de formularios existente, no una interfaz nueva ni el build
actual ejecutándose. La prueba HTTPS posterior acredita recorridos, no que
esta captura sea reciente. No contiene una cuenta real de cliente.

## Contraste actualizado · 14/09, base 4cea3f4

La base del encabezado y la captura anterior se conservan como historia. Esta
tabla se ha vuelto a contrastar con las colecciones y controles actuales.

| Necesidad | Estado comprobado | Próximo incremento propuesto |
| --- | --- | --- |
| Elegir colores visualmente | HexColorField combina texto y selector nativo; BrandProfiles lo registra | Mejorar identificación contextual y revisar tamaño/claridad, sin duplicar el selector |
| Ver la paleta | BrandPalettePreview muestra colores, proporciones y total; publicar valida el perfil | Revisar comprensión de roles y herencia; los porcentajes son objetivos, no mediciones de píxeles |
| Elegir fuentes con muestras | TypographyFamilyField ya combina texto, selector de familias y muestra; conserva valores no incluidos en la lista y permite heredar | Revisar comprensión con Manuel; la muestra depende de fuentes instaladas, no descarga ni garantiza una familia entre dispositivos |
| Añadir y ordenar secciones | Pages registra cinco tipos: Portada, Texto, Galería de proyectos, Imagen y Sección especial; hay recorridos nativos guardados/reabiertos para cada tipo | Catálogo más visual, preservando formularios y teclado; Sección especial guarda una referencia y muestra un aviso, no conecta todavía un módulo público |
| Bordes, esquinas, degradados y hover | No hay controles correspondientes en los bloques examinados de Pages | Proponer inspector de una sección antes de extender esquema y render |
| Filas/columnas con guías | Layout actual es una lista de bloques, no un lienzo de composición | Propuesta guiada revisable, sin posicionamiento absoluto libre |

Fuentes: `owner-platform/src/collections/BrandProfiles.ts`,
`owner-platform/src/collections/Pages.ts`, componentes HexColorField y
BrandPalettePreview y TypographyFamilyField; recibos typography-preview,
operational-gates y page-blocks-native-verification-2026-09-14.md.
Esta inspección no acredita ausencia de utilidades similares en todo el repo.

## Recorrido para revisar con Manuel

1. Crear un borrador con Portada y Texto, sin publicar.
2. Cambiar título, añadir imagen y mover una sección por controles visibles.
3. Cambiar un color de marca y comprobar la vista previa guardada.
4. Guardar, recargar y localizar cómo recuperar una versión anterior.

Registrar éxito sin ayuda, dudas, errores y posibilidad de recuperarse. No
confundir pruebas automáticas verdes con facilidad de uso para una persona.
El botón Publicar del CMS no publica hoy en el portfolio: puente desactivado.

## Decisión de alcance

Primero mejorar un control y una sección conservando edición existente,
valores históricos y acceso por teclado/táctil. No construir ahora un clon
de Figma ni añadir servicios IA. La propuesta visual debe verse y revisarse
antes de sustituir la interfaz. Infraestructura de staging, correo y copias
reales siguen siendo puertas separadas; no declarar producto listo para venta.

## Entrega

Codex conserva integración y commits. Resultado QA bad903b enviado a Claude
por Hub 24e29a4e-4baa-4b2c-b82e-5c83852a2c43; no se presume leído o aceptado.
Esta revisión solo añade documentación; no requiere ni afirma tests runtime
nuevos. Sin despliegue ni alteración del checkpoint.

Actualización 14/09: 82 pruebas focales de TypographyFamilyField, herencia,
manifiestos, servicio de preview y colección de snapshots pasan (8f025b).
Esto verifica comportamiento de código, no usabilidad humana. La prueba nativa
más reciente de bloques/etiqueta accesible figura en el recibo del 14/09; no se
ha repetido una batería de navegador únicamente para actualizar esta nota.
