# Entrega CMS: responsive y recuperación editorial

Fecha: 2026-09-07. Autor: Codex. Alcance local owner/CMS; no despliegue.

## Qué se ha implementado

- CSS del shell owner limitado a `max-width: 768px`, importado después del CSS de Payload en `owner-platform/src/app/(payload)/layout.tsx`.
- Breadcrumb con ancho flexible y desplazamiento horizontal propio: mantiene visible la cuenta sin ocultar el overflow global del documento.
- Menú móvil superpuesto: abrirlo ya no reduce a cero el ancho del editor. Conserva los mecanismos nativos de Payload de apertura, cierre e `inert`.
- Dos pruebas nuevas: `tests/shell-responsive.browser.mjs` y `tests/page-editor.browser.mjs` en owner-platform.
- Los scripts existentes de medios, artículos/proyectos y seed visual aceptan `OWNER_QA_PORT=3013`; mantienen 3011 por defecto. No admiten una URL arbitraria.

No se ha creado otro CMS, cambiado el modelo de datos ni sustituido el editor. Este incremento corrige el shell y comprueba funcionalidades que ya existían. No hay dependencias nuevas ni cambios de apariencia en la web pública.

## Diagnóstico reproducido

El hallazgo previo de 390→402 px no se reprodujo exactamente: la página probada a 390 px ya cabía. Sí se reprodujeron dos fallos objetivos a 320 px:

1. Documento de 347 px y cuenta hasta x=347,45: el flex item del breadcrumb impedía contraerse a la cabecera.
2. Al abrir el menú, documento de 517 px y editor de aproximadamente 0,125 px: el grid de escritorio reservaba 320 px al sidebar dentro de un viewport de 320 px.

Se escribió primero una prueba que falló con el primer defecto. Al ampliar la prueba a menú abierto se descubrió el segundo. Las reglas finales corrigen ambos sin `overflow-x:hidden` global, cambios en node_modules ni reglas desktop nuevas. El breakpoint y los selectores se contrastaron con Payload 3.88.0 instalado.

## Evidencia de esta sesión

Entorno Windows, Chromium local, Next dev y una base SQLite nueva exclusiva de QA en el puerto 3013. Usuario sintético `@example.invalid`; ninguna sesión ni base de datos del propietario utilizada. Las publicaciones de fixtures solo son estados dentro de esa base local, no publicaciones en Internet. Las puntuaciones de versiones son fixtures sintéticos, no métricas reales.

- Unitarias: `npm run test -- --maxWorkers=4`: 689 pruebas, 141 archivos, salida 0.
- Integración: `npm run test:integration -- --reporter=verbose`: 20 pruebas, salida 0. Transacciones y conservación de publicado incluidas.
- Shell: 320, 390, 768, 1024, 1280 y 1680 px, cada uno claro/oscuro; movimiento reducido en claro y normal en oscuro. Comprueba cabecera, menú abierto/cerrado, cierre tras navegación y preview privado sin ensanchar el documento. Móvil usa entrada táctil. Se añadió aserción del tema realmente resuelto por Payload.
- Editor de páginas a 390 y 1280 px: editar dos campos, reordenar dos bloques con el menú real, guardar borrador, recargar y abrir preview en nueva pestaña. Comprueba orden y persistencia; el publicado original no cambia. Un visitante sin sesión acaba en login y no ve el contenido privado.
- Restauración mediante UI: preparar/confirmar no muta contenido; ejecución restaura el borrador y conserva el publicado más reciente de la fixture. Se añadió comprobación explícita de ambos bloques restaurados y su orden.
- `media-editor.browser.mjs`: recorte/punto focal y receta móvil guardan y sobreviven a recarga; el override móvil no modifica la receta desktop.
- `modular-editor.browser.mjs`: artículos y proyectos basados en bloques guardan sin exigir un cuerpo legacy oculto.
- `seed-visual-qa.mjs` se ejecutó correctamente con el nuevo puerto allowlisted.
- Lint final: salida 0.
- Guardas públicas: `npm run test:owner-isolation` (8/8) y `npm run check:public-boundary` (20 entradas), salida 0. El mensaje de objeto Git ficticio en la primera suite forma parte de una prueba negativa que pasó.
- Repetición final tras revisión: shell 12/12 y editor/restauración 2/2, salida 0, incluidas las nuevas aserciones de tema y ambos bloques.
- Compilación: `npm run build` owner, salida 0; bundle optimizado, TypeScript y generación 23/23 completados. Se paró el servidor QA propio antes del build. `next-env.d.ts` quedó de nuevo sin diferencias; no se versionaron archivos de entorno generados.

Capturas locales no versionadas: `.audit/cms-editor-{320,390,768}-{light,dark}.png` y `.audit/cms-shell-{ancho}-{tema}.png`. Se inspeccionaron visualmente el editor a 320 px oscuro y el preview a 1280 px claro. La compilación no sustituye pruebas de navegador sobre un despliegue de producción.

## Revisión independiente y límites

El revisor read-only `review_cms_shell` no encontró defectos introducidos críticos o importantes. Contrastó las reglas con Payload instalado y ejecutó comprobaciones de sintaxis y `git diff --check`; no ejecutó la batería de navegador. Se incorporaron sus sugerencias de comprobar el tema efectivo y todos los bloques restaurados.

La prueba de teclado verifica orden breadcrumb→cuenta y activación de controles concretos enfocados explícitamente. **No acredita una auditoría de accesibilidad completa**: el opener móvil nativo tiene `tabIndex=-1`; la entrada natural por teclado al menú, trampa/restauración de foco y semántica de cierre requieren otro incremento. Tampoco certifica todos los tamaños táctiles, truncamientos nativos, zoom 200%, Safari/iOS o dispositivos físicos.

Pendientes operativos: staging PostgreSQL, almacenamiento de medios, correo, copia/restauración conjunta de código/datos/medios y publicación pública controlada de punta a punta. No se declara el producto comercial listo ni conectores IA/Figma/analítica activos por haber probado formularios y previews.

## Repetición segura de las pruebas

Desde owner-platform, usar dos terminales y un nombre de base **nuevo** en cada campaña. No reutilizar la base del propietario ni apuntar estos scripts a producción.

1. Terminal servidor: vaciar `DATABASE_URL`; asignar `LOCAL_DATABASE_NAME` a `qa-editorial-` + un GUID nuevo; generar un secreto sintético de bootstrap de al menos 32 caracteres en `OWNER_BOOTSTRAP_SECRET`. Ejecutar `node scripts/dev.mjs --hostname 127.0.0.1 --port 3013`.
2. Terminal pruebas: `OWNER_QA_EMAIL` terminado en `@example.invalid`, contraseña sintética en `OWNER_QA_PASSWORD` y el mismo secreto en `OWNER_QA_BOOTSTRAP`. Ejecutar `node tests/seed-workflow-qa.mjs`. Su primer registro debe tener éxito; aborta ante un owner existente.
3. Ejecutar `node tests/shell-responsive.browser.mjs` y `node tests/page-editor.browser.mjs`.
4. Para los otros recorridos, `OWNER_QA_PORT=3013`; ejecutar `node tests/seed-visual-qa.mjs`, después `node tests/media-editor.browser.mjs` y `node tests/modular-editor.browser.mjs`.
5. Parar solo el servidor QA propio antes de `npm run build`: el script de build limpia su caché `.next/dev`. No borrar otras bases, medios o procesos para hacer pasar las pruebas.

Las fixtures y capturas quedan ignoradas/no versionadas para inspección local. Git no es una copia de medios ni de la base de datos. No registrar contraseñas, cookies o secretos en el handoff.

## Coordinación y versión

- Base al reservar: `4c65314`, rama `codex/checkpoint-pre-editor-2026-09-04`.
- Durante el trabajo Claude añadió `687f849` (ORCID/Scholar). Se conserva sin atribuirlo a esta entrega.
- Checkpoint protegido: `checkpoint/pre-editor-2026-09-04^{commit}` = `0f0adf686b2752e23c25d224f8c60815b10fd451`. No se ha movido, publicado ni confundido con un backup externo.
- Reserva Hub: `6f774b90-5ce0-4288-8e8d-ac6048eeeeab`; avance: `49258b61-9cf2-48e8-ba99-57686f21b826`.
- Claude confirmó reparto en `e8998950-6d80-4cdb-acf9-be445c6e16f5`: público/dominio/SEO para Claude; owner/CMS para Codex. Respuesta procesada mediante `46a52629-6230-4887-957a-0613c11bd06d`, ACK `56a121ea-5f38-4ade-9fd6-c34d80199eb9`.
- Claude lee por sesión, sin heartbeat propio confirmado. Un mensaje enviado no acredita lectura permanente.
- Se preserva la entrada de REGISTRO sobre verificación Windows/dominio escrita por otro turno. Su hallazgo fflate sigue en el frente público: este incremento no aprueba una excepción ni actualiza dependencias.
- No DNS, Vercel, push, despliegue, costes, traslados de datos ni cambios en otros productos. `.es` continúa pendiente según el informe de Claude.

Siguiente responsable: Codex, auditoría específica de teclado móvil y puertas operativas del CMS; Claude, cierre público/SEO/dominio. Cualquier cambio de contratos, dependencias compartidas o publicación debe reservarse y verificarse por separado.

Reversión del incremento: retirar el import y el CSS owner mediante un commit inverso revisado, sin resetear la rama compartida. Las pruebas/documentación se pueden conservar. No requiere migración de datos.
