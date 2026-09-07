# Paneles de acciones: verificación y relevo

## Alcance del cambio

Ocho paneles privados pasan de `admin.components.edit.beforeDocumentControls`
al primer campo de interfaz (`type: 'ui'`) de su documento. Afecta a paquetes,
revisiones, artefactos y preflights de publicación; restauraciones; propuestas
de asistencia; planes y revisiones de Figma.

El helper `src/collections/document-panel.ts` centraliza la colocación. No
cambia el contenido persistido, los permisos, los endpoints, las confirmaciones
ni los hooks. No añade dependencias ni modifica el portfolio público.

## Causa y evidencia de navegador

La barra nativa de Payload tiene altura restringida en móvil. Introducir un
formulario de varias líneas en ella superponía el panel al título y los campos.
En un paquete sintético, a 390 px, el panel terminaba en y=382,69 y el primer
campo empezaba en y=274,26. Después del cambio, el panel terminaba en y=592,06
y el campo empezaba en y=629,06: dejó de haber solapamiento.

Comprobación realizada antes de la pausa solicitada por Manuel, en un servidor
loopback con SQLite y propietario de QA exclusivos, sin datos de producción:

- Confirmación incorrecta de paquete rechazada con mensaje explícito.
- Confirmación válida crea la revisión inmutable, sin publicar.
- Desde la revisión se genera el artefacto interno.
- Desde el artefacto se ejecuta la validación de preparación: resultado con dos
  avisos. No es un despliegue ni una acreditación de calidad pública.
- Los paneles siguen disponibles en documentos de solo lectura.

Las puntuaciones de ese fixture son sintéticas y están identificadas como tal.
El script `tests/seed-workflow-qa.mjs` exige un primer registro exitoso y correo
`@example.invalid`; no debe ejecutarse contra un entorno existente del usuario.

## Regresión y límites de la cobertura

Los ocho contratos de colección fallaron antes del cambio por mantener sus
paneles en la barra; después pasaron las 28 pruebas de esos archivos. Se
conservan sus pruebas de autorización e inmutabilidad.

Verificación repetida al reanudar el 7 de septiembre:

- `npm --prefix owner-platform run test -- --maxWorkers=4`: 689 pruebas,
  141 archivos, exit 0.
- `npm --prefix owner-platform run test:integration -- --reporter=verbose`:
  20 integraciones SQLite, exit 0. Sin adaptador real de correo.
- `npm --prefix owner-platform run lint`: exit 0.
- `npm --prefix owner-platform run test:controls`: 22 comprobaciones, exit 0.
- `npm --prefix owner-platform run test:dashboard`: 8 combinaciones a
  320/390/768/1280 px, claro y oscuro, exit 0.
- `npm --prefix owner-platform run build`: compilación y TypeScript correctos,
  generación 23/23, exit 0. No es un despliegue.
- `npm run test:owner-isolation`: 8 pruebas, exit 0; incluye rechazar a
  propósito un hash de checkpoint inexistente.
- `npm run check:public-boundary`: 20 entradas públicas, exit 0.

Revisión independiente de código, solo lectura: sin incidencias críticas ni
importantes. Comprobó en Payload instalado que el campo UI no se persiste y
mantiene el contexto de documento. No repitió las suites; los resultados
anteriores corresponden a la ejecución del coordinador. La revisión de Claude
permanece pendiente de acuse.

La suite de controles en navegador verifica componentes aislados a 390 y
1280 px. No sustituye al recorrido dentro del shell de Payload. No se ha
certificado en este incremento cada estado de los ocho paneles dentro del
editor real a todos los anchos.

Queda una incidencia independiente: a 390 px el documento midió 402 px de
ancho desplazable, con elementos del menú nativo fuera del viewport. No se
ha aplicado un `overflow: hidden` global para ocultarla. Debe investigarse por
separado y comprobarse con menú abierto/cerrado, teclado y zoom.

La restauración mantiene cobertura de integración SQLite; faltan la prueba
operativa PostgreSQL y el almacenamiento duradero. Figma real y modelos de IA
siguen sin conectarse. Los límites completos están en `completion-audit-2026-09-05.md`.

## Reanudación cooperativa

El 7 de septiembre Manuel pidió cooperación entre Claude y Codex. Se envió por
el Hub la propuesta `bdf56ed6-7481-4c7c-8d24-11589a3bf8cd`, bajo el tema
`portfolio-profesional::portfolio-cms-cooperacion-2026-09-07`, especificando este
repositorio (el proyecto histórico del Hub tiene otra raíz).

Reparto propuesto, pendiente de acuse: Claude mantiene el portfolio público,
dominio, SEO y publicación; Codex cierra el CMS. Ningún mensaje equivale por sí
solo a aceptación. Los cambios en dominios, configuración raíz, publicación y
contratos compartidos requieren aviso y revisión cruzada. No se incluyen los
archivos pendientes del otro agente en un commit.

Dirección confirmada por Manuel: `.com` es el dominio principal; `.es` debe
redirigir al `.com`. No se modifica DNS desde este incremento, ni se inventan
identificadores ORCID/Scholar o contenido biográfico.

Siguiente entrega propuesta: edición visual privada sobre bloques propios,
manteniendo Payload/Lexical y el modelo persistido. Reordenación con teclado y
tacto, espaciados limitados por tokens, guardar borrador y recuperar estado.
Puck sigue siendo candidato, no una dependencia instalada ni una integración
terminada. El puente público conserva su puerta de comparación visual,
accesibilidad y rendimiento antes de activarse.
