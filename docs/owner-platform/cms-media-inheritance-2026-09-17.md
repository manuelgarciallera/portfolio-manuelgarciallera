# CMS · herencia del encuadre por formato

17/09/2026, base `f3801d5`. Reserva `aa9182a7-00a7-4701-89a2-1cf82998cabe`. Incremento acotado del editor existente; no motor de colocación libre ni publicación CMS.

## Implementado localmente

- El editor explica que escritorio es la base de móvil y tablet.
- Al seleccionar móvil/tablet, distingue receta heredada de ajustes propios, contando también valores cero y valores iguales a la base que se hayan fijado explícitamente.
- «Usar encuadre de escritorio» elimina únicamente las excepciones del formato seleccionado. No modifica la imagen ni escritorio/otro formato.
- La acción está deshabilitada cuando no hay excepciones, durante inicialización/guardado o sin permiso de edición. Los controles siguen permitiendo volver a personalizar después.
- Mensaje discreto y botón táctil con foco visible; no nuevo modal, dependencia ni cambio de esquema. La guía de diseño orientó el lenguaje directo y la integración con los estilos existentes.

Archivos: `MediaPlacementEditor.tsx` y su CSS; prueba de componente, arnés interactivo y fixture de contexto; ampliación de la prueba editorial con base real y del recorrido nativo de medios.

## Evidencia

1. RED del componente real: faltaba la indicación de base (`dc48db`). El primer intento no resolvía el alias de Next; corregido en el test, sin sustituir las funciones reales de preview.
2. RED de interacción real del componente: no existía la acción para móvil (`3cd6ea`).
3. GREEN: 22 pruebas focales (`3cd231`) y 12 escenarios de navegador (`03aa08` cierre):320/390/1280 × editar/solo lectura/guardando/inicializando. Reset con teclado y clic; valores heredados visibles, tablet/escritorio preservados y personalización posterior posible; sin errores JS ni overflow. El contexto de Payload está sustituido por un proveedor de prueba con estado React; **no es un CMS nativo ni acredita guardado real**.
4. Prueba independiente con SQLite real, configuración editorial y usuario sintético: guardar excepciones, borrarlas con `null`, reabrir, conservar base/tablet y bytes del original PASS (`ee7242`). El backend ya resolvía correctamente este caso: no se modificó. Las otras39 pruebas de ese archivo estaban filtradas, no aprobadas por esa ejecución.
5. Captura320 revisada visualmente: controles dentro del viewport. Artefactos locales `.data/verification-artifacts/media-inheritance/`.

## Incidencias de verificación y alcance pendiente

- El recorrido nativo completo se detuvo en el preflight TLS de Windows (`1e80d0`, `ERR_CERT_AUTHORITY_INVALID`), antes del editor. No se desactivó verificación TLS ni CSRF.
- Se preparó una copia aislada de fuentes comprometidas más los tests propios en el contenedor existente `owner-editor-6dc5c51-0911`, ruta nueva `/work/owner-responsive-20260917`. No se tocaron copias previas ni otros contenedores.
- Instalación Linux interrumpida por DNS `EAI_AGAIN` del registro npm. Se obtuvieron paquetes exactos `zod@4.6.4` y `yaml@2.9.1` desde el host para la caché, sin cambiar lockfile ni versiones. **No se acredita instalación completa**.
- Una suite completa Windows y otros comandos terminaron sin resultado válido durante la interrupción del entorno (códigos1073807364/-1073741205). No atribuir esos códigos por sí solos a un defecto del CMS ni contarlos como PASS.
- Al retomar a las06:35CEST, Docker no respondía en su named pipe. No se arrancaron servicios compartidos por iniciativa propia. Se reejecuta `npm run check` en Windows; resultado por completar abajo.

El test nativo ampliado está escrito pero pendiente de ejecución satisfactoria: crear, personalizar, guardar, volver a escritorio, guardar/reabrir, personalizar de nuevo y comprobar preview de página. Antes de cerrar aceptación completa, ejecutarlo con la configuración y dependencias actuales, incluyendo PostgreSQL cuando esté disponible. No confundir pruebas de componente + SQLite con esa puerta.

## Estado de entrega

Repetición de los12escenarios de componente tras recuperación del host PASSef58f7, misma implementación. Preparada para commit recuperable; aceptación nativa sigue pendiente. Se arrancó solo el contenedor QA propio owner-editor-6dc5c51-0911; npm ls detectó instalación interrumpida (4a32f3), se rehace npm ci offline en la copia aislada, sin tocar servicios Linocube/PostgreSQL ajenos.

`npm run check` Windows termina con salida0 (sesión79298,34677f):1377 unitarias, integración SQLite, ambas recuperaciones físicas, lint, tipos y build23rutas. El mismo recorrido arrancó en f3801d5 y durante su ejecución se comprometió fdafc99 solo público; CMS permaneció con su delta local constante. No acredita el browser nativo pendiente. Docker vuelve a responder tras intervención de Manuel; contenedor QA no arrancado todavía. Pendiente commit recuperable CMS. La web pública avanzó separadamente con ajuste móvil fdafc99; sin publicación CMS, gasto, cambios de permisos ni datos reales. Siguiente Codex: retomar aceptación nativa y cerrar entrega CMS.
