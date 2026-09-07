# Idioma y encaje del editor owner

## Alcance y diagnóstico

Incremento privado sobre `5da1d06`. No modifica el portfolio público, sus
dependencias, imágenes o diseño. El checkpoint protegido sigue resolviendo a
`0f0adf686b2752e23c25d224f8c60815b10fd451`.

La navegación nativa de Payload usaba inglés junto a controles propios en
español. Se activa su diccionario español y se asignan nombres editoriales a
las 22 colecciones y a los permisos del asistente. Es traducción de interfaz,
no localización del contenido: no cambian slugs, permisos, campos almacenados
ni versiones existentes.

Referencia: [internacionalización oficial de Payload](https://payloadcms.com/docs/configuration/i18n).
`@payloadcms/translations` 3.88.0 ya estaba instalado transitivamente. Se declara
como dependencia directa del owner, a la misma versión: el lockfile añade una
sola declaración y ningún paquete o actualización al árbol resuelto.

La inspección del formulario real a 390 px detectó un problema adicional:
`PagePreviewLink` estaba inyectado dentro de la barra nativa de botones. Su
altura fija en móvil y su distribución flex comprimían el aviso hasta hacerlo
invadir el título del primer campo. La corrección usa un campo presentacional
`ui` en el flujo del formulario, compartido por páginas, proyectos y artículos.
No se oculta el texto ni se modifica globalmente la barra de Payload.

## Evidencia de uso real

Recorrido local con una base SQLite y un owner sintéticos, sin conectores:

- Login y navegación con acciones y nombres de colecciones en español.
- Menú móvil con las etiquetas largas visibles.
- Editor de página: sin overflow horizontal ni solapamiento entre aviso,
  acciones y primer campo a 320, 390, 768 y 1280 px.
- Creación de una página con un bloque Hero, guardado como borrador y acceso
  a su vista editorial privada. El titular guardado aparece en la vista previa.
- Ningún error de consola capturado al finalizar el recorrido.

Capturas locales de la sesión del 5 de septiembre, fuera del bundle y de Git:
`owner-platform/.data/language-qa/navigation-mobile.png` y
`owner-platform/.data/language-qa/page-create-mobile.png`.
El tab de QA se cerró y el viewport se restauró. No se eliminó la base de prueba.

Las comprobaciones geométricas corresponden al editor de páginas; la colocación
compartida en proyectos y artículos se comprueba además con el contrato de
configuración. No equivalen a una auditoría visual completa de todos los campos.

## Regresiones y límites

Dos pruebas de configuración se verificaron primero en rojo: idioma por defecto
y ubicación incorrecta del preview. Ambas pasan con la implementación.
La compilación owner del 7 de septiembre terminó correctamente, incluidas sus
23 páginas generadas y el análisis de TypeScript.

Reverificación del 7 de septiembre:

| Comprobación | Resultado |
| --- | --- |
| Unitarias owner (`--maxWorkers=2`) | 689 / 689, 141 archivos |
| Integración SQLite, última ejecución con reporter verbose | 20 / 20 |
| Dashboard browser, 320/390/768/1280 y claro/oscuro | 8 / 8 |
| Controles browser aislados, desktop/móvil | 22 / 22 |
| Lint owner | Correcto |
| Build owner y TypeScript | Correcto |
| Aislamiento de dependencias públicas | 20 entradas correctas |
| Regresiones de aislamiento/checkpoint | 8 / 8 |

Dos ejecuciones de integración terminaron con `Worker exited unexpectedly`,
tras 5 y 19 de las 20 pruebas. La segunda ya se ejecutó sin las otras suites.
No se cuentan como pases ni prueban una causa de memoria o concurrencia; el
cierre intermitente ya estaba documentado. La tercera ejecución, con reporter
verbose para identificar el punto de fallo, completó las 20 pruebas y finalizó
con exit 0. No se cambiaron tests, timeouts ni lógica para obtener ese resultado.
La consulta al registro Application de Windows no aportó un evento de fallo
de node. La inestabilidad del ejecutor sigue abierta: el último pase no acredita
que haya desaparecido.

Queda pendiente traducir los nombres de campos, bloques y algunas opciones
del editor: `Title`, `Brand Overrides`, `Layout`, `Hero`, etc. El grupo `Workflow`
tampoco cambia en este incremento. No se presenta como localización completa.

Prioridad siguiente: inspeccionar en el editor real los paneles avanzados de
publicación, restauración, propuestas y Figma. Sus pruebas browser aisladas no
certifican su encaje dentro de la barra nativa `beforeDocumentControls`; el fallo
del preview obliga a revisar ese mismo punto de integración antes de declararlos
responsive. No se altera su lógica sensible sin esta comprobación.

Siguen pendientes los requisitos de producción descritos en
`completion-audit-2026-09-05.md`: PostgreSQL y almacenamiento duradero probados,
correo, avisos de dependencias, conectores reales, aplicación reversible de
propuestas y puente de publicación. No hay despliegue ni activación externa.
