# Recorrido real owner — 8 de septiembre de 2026

Base: `8514aa0`. Continuación del CMS tras la publicación pública, sin nuevo despliegue ni push. El turno previo fue progreso verificado. Este incremento añade cobertura del acceso real, no funcionalidades de almacenamiento ni permisos nuevos.

## Entorno y aislamiento

Next 16.3.4 / Payload 3.88.0 en loopback `127.0.0.1:3013`, base SQLite nueva con nombre `qa-editorial-resume-<UUID>`, usuario exclusivo `@example.invalid`. `seed-workflow-qa.mjs` exigió primer registro exitoso antes de escribir fixtures. Datos, contraseña y claves sintéticos; sin medios o datos del owner habitual. No hay adaptador de correo: no se prueba recuperación de cuenta. El servidor de esta prueba se detuvo al acabar; la base sintética se conserva localmente, ignorada por Git.

## Evidencia recién ejecutada

- `tests/page-editor.browser.mjs`, sesión 23230, salida 0: 390 y 1280 px. Editar título y bloque, reordenar, guardar borrador, leer persistencia por API, recargar formulario, preview privado, rechazo del visitante anónimo y restauración confirmada. Confirmar no ejecuta; ejecutar restaura como borrador y conserva publicado, bloques, orden y estado tras recargar. Sin errores JS capturados.
- Nuevo `tests/login-ui.browser.mjs`, sesión 54459, salida 0: 390 y 1280 px. Navegación privada lleva al login; contraseña incorrecta devuelve 401 y muestra texto en región viva; `/users/me` sigue sin sesión. Envío válido mediante Enter devuelve 200, recupera la ruta original y mantiene sesión tras recarga. Sin overflow documental ni errores JS capturados.
- `tests/navigation-keyboard.browser.mjs`, sesión 44640, salida 0: 320/390/768 px en claro y oscuro. Tab alcanza apertura, foco contenido en diálogo, Escape/cierre devuelven foco, cambio de colección y resize móvil/desktop conservan semántica y foco. Ahora espera `aria-controls` del adaptador antes de empezar las pulsaciones, no solo silencio de red.

## Diagnóstico y límites de las pruebas

ESLint focal de ambos scripts, sesión 21024: salida 0. `git diff --check` correcto. No build nuevo: no se modifica runtime, configuración ni dependencias. Checkpoint resuelto al commit `0f0adf686b2752e23c25d224f8c60815b10fd451`.

El primer barrido de teclado falló al alcanzar el botón; una repetición sin cambio de runtime pasó los seis escenarios. La espera explícita verifica inicialización antes de medir Tab, pero no demuestra que el primer fallo tuviera exclusivamente esa causa. Si reaparece, capturar la secuencia de foco y la carga; no aumentar el número de Tab ni ocultar el fallo.

El primer test nuevo de login tenía dos supuestos incorrectos, corregidos tras inspeccionar respuesta y DOM: el aviso es un texto visible dentro de una región `aria-live=polite` cuyo contenedor puede no tener caja visible; y `/api/pages` admite lectura anónima de publicado por diseño. Se verifica identidad mediante `/users/me`, no convirtiendo la colección en privada para satisfacer la prueba. Ningún cambio de runtime fue necesario; esto es caracterización de comportamiento existente, no un arreglo TDD de producción.

Las fixtures de versión contienen puntuaciones sintéticas identificadas como tales. Estos recorridos no certifican WCAG, seguridad completa, publicación real, restauración física, PostgreSQL de staging ni almacenamiento duradero. No repetir ensayos sintéticos de recuperación ya cerrados como sustituto del siguiente requisito operativo.

## Siguiente trabajo

Queda acreditado de nuevo el recorrido básico local. Retomar `media-cutover-trust-protocol-2026-09-08.md`: persistencia/procedencia del pin, respaldo y exclusión de escritores antes de un consumidor operativo. Mantener `canApply: false` hasta que esas garantías estén implementadas y probadas. La base del usuario, checkpoint y web pública permanecen fuera de esta prueba.
