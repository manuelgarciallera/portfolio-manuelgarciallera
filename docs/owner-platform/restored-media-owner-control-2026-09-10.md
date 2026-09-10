# Volver a imágenes actuales desde el editor

Fecha: 2026-09-10. Base: `8931a53`. Alcance: CMS privado; sin publicación ni cambio de proveedor.

## Entrega

Una página restaurada conserva su captura de medios histórica. El editor muestra esa referencia protegida y ofrece «Usar las imágenes actuales de la biblioteca». La acción se envía al guardar el formulario ordinario, junto a los demás cambios. No añade columna: el checkbox es virtual. Solo un booleano explícito elimina la vinculación; la capacidad de restauración del servidor tiene prioridad. Las ACL de Pages siguen controlando el acceso. Los clientes no pueden asignar una captura arbitraria.

No se modifica Media compartido, la versión publicada ni las capturas anteriores al guardar borrador. Si la validación falla, la vinculación histórica permanece.

## Hallazgos y comprobaciones

- TDD de integración: antes del cambio seguía resolviendo la revisión histórica en vez de la biblioteca actual. Corregido en el hook existente.
- El primer control no aparecía: el dato de condición estaba oculto. Se expone como relación de solo lectura. Fue necesario reiniciar Next/Payload para recoger la configuración del panel.
- Browser encontró después el checkbox deshabilitado con el resto del formulario operativo. `payload/dist/fields/config/sanitize.js` hace virtuales de solo lectura por defecto. Se declara `admin.readOnly: false` en el comando, sin alterar la protección de la relación.
- Chromium emulado, 390 y 1280 px: restaurar página sintética, marcar opción, editar título, comprobar que nada cambia antes de guardar, guardar borrador mediante UI, comprobar título y referencia nula, ocultación del control, sin desbordamiento horizontal ni pageerrors. Capturas inspeccionadas. No es un móvil físico.
- El fixture de navegador no tiene imágenes: los bytes A/B, captura inmutable, validación fallida y versión publicada intacta se verifican en la integración HTTP con configuración completa, no se atribuyen al navegador.
- Resultado final: 1111 unitarias/158 archivos; integración SQLite focalizada 1/1; tipos y lint correctos; build 23 páginas; frontera pública 21 entradas; diff sin errores.
- PostgreSQL 17.11: integración focalizada 1/1 (14,22 s), motor real comprobado, cero sesiones restantes y clúster sintético detenido/eliminado por su controlador. No equivale a migración de una base existente.
- Revisión independiente Rawls: sin hallazgos importantes ni bloqueadores; solo lectura.

## Repetición y límites

`tests/restored-media-control.browser.mjs` exige servidor QA aislado en 127.0.0.1:3013 con credenciales sintéticas `@example.invalid` y la semilla `tests/seed-workflow-qa.mjs` (página/release 1). No ejecutar contra datos reales. Capturas en node_modules/.cache, no versionadas; servidor de esta prueba detenido. No se conservan credenciales en este documento.

Pendientes: migración de una base PostgreSQL ya existente, proveedor de almacenamiento en staging, aceptación visual con imágenes reales de prueba y despliegue controlado. El runtime predeterminado continúa con almacenamiento legacy: esta entrega no activa almacenamiento de objetos ni declara el CMS comercialmente listo. No cambios públicos, nuevas dependencias, gasto, push ni despliegue.
