# CMS: teclado móvil y preparación operativa

Fecha: 2026-09-07. Codex. Incremento local posterior a `4afeecb`, base `49b4977`. Correo excluido expresamente por Manuel: lo trabaja Claude. No despliegue, DNS, contratación ni modificación de datos reales.

## Implementado

1. `OwnerNavigationAccessibility.tsx`, registrado en el slot `afterNav` de Payload, completa el comportamiento del menú móvil existente sin copiar su lista de colecciones ni alterar permisos. Hasta 768 px: abridor accesible por Tab, `aria-expanded`/`aria-controls`, diálogo con nombre, foco inicial en cierre, contenido de fondo inerte, recorrido Tab/Shift+Tab contenido, Escape y devolución de foco. Al cambiar entre móvil y desktop el foco pasa al control visible; se limpian atributos, listeners y bloqueo de scroll. Desktop conserva la navegación nativa.
2. Validación compartida de configuración en `config/runtime.ts`: solo URLs PostgreSQL sintácticamente válidas con host, sin fragmentos/controles; rechaza otros protocolos, valores malformados y secretos de producción compuestos solo por espacios. Los errores no incluyen la cadena privada. La compilación conserva su base efímera sin conectar a producción.
3. `dashboard/readiness.ts` deja de certificar almacenamiento duradero por encontrar una cadena en una variable. Una URL válida significa `configured: true`, pero `durable: false`, `verification: not-tested`; nueva puerta `database-restore-verification`. No se hace una conexión ni se afirma TLS, backups o restauración probados. La publicación permanece bloqueada.
4. Pruebas de regresión de teclado en navegador y 11 casos unitarios nuevos; documentación operativa actualizada. Sin dependencias nuevas en owner ni cambios al diseño público.

El adapter de navegación depende del contrato DOM de Payload 3.88.0 instalado y de su estado `useNav`. Se documenta y caracteriza en navegador para detectar roturas al actualizar la librería; no se editó node_modules. Referencia de comportamiento: [W3C APG, Modal Dialog Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/). Estas pruebas no certifican conformidad WCAG completa ni sustituyen lectores de pantalla y dispositivos físicos.

## Diagnóstico y revisión

- Reproducción roja: el botón `.app-header__mobile-nav-toggler` nativo tiene `tabIndex=-1`; la prueba de Tab natural no alcanzaba el menú. La corrección se escribió después de observar ese fallo.
- El primer arranque de desarrollo agotó el timeout de login (compilación fría); se ajustó el límite a 120 s, como los demás recorridos. No se contó como el fallo funcional esperado.
- La primera prueba de enlaces apuntaba a Páginas estando ya en Páginas. Payload representa la colección actual como texto, no enlace. Se corrigió la prueba para navegar a Artículos, sin cambiar ese comportamiento legítimo.
- Revisión independiente `review_keyboard_readiness`: detectó pérdida de foco al ampliar a desktop porque el cierre móvil pasa a `display:none`. Se reprodujo en navegador, se añadió destino visible en ambos sentidos y se repitieron seis casos con éxito. No señaló defectos importantes en runtime/readiness.
- Los 11 casos nuevos de runtime/readiness fallaron antes de implementar la validación; los 31 casos focalizados pasaron después.

## Verificación real de esta sesión

- `npm run test -- --maxWorkers=4`: **700/700**, 141 archivos, salida 0.
- `npx vitest run src/config/runtime.test.ts src/dashboard/readiness.test.ts`: **31/31**, salida 0.
- `node tests/navigation-keyboard.browser.mjs`: **6/6**, Chromium, 320/390/768 px en claro/oscuro, movimiento reducido. Solo teclado para entrada, cierre y enlaces; comprobación de foco real tras resize a 1280 px y vuelta. No se fuerza `locator.focus()` para hacer pasar el recorrido.
- `npm run test:integration -- --reporter=verbose`: primera ejecución terminó con `Worker exited unexpectedly` tras 19/20; **repetición completa 20/20, salida 0**, sin alterar la suite. Causa de la caída no determinada; no se presenta la primera ejecución como válida ni se atribuye sin evidencia a Docker o memoria.
- `npm run lint` y `npm run typecheck`: salida 0. `shell-responsive.browser.mjs`: **12/12** (320 a 1680 px, claro/oscuro). `page-editor.browser.mjs`: **2/2**, 390/1280 px, incluida restauración íntegra como borrador sin alterar publicado.
- `npm run build`: compilación optimizada, TypeScript y generación **23/23**, salida 0; repetición final tras inspección visual también salida 0. Servidores QA propios detenidos y `next-env.d.ts` sin diferencias.
- `npm audit --omit=dev` owner: **salida 1, 12 paquetes afectados moderados, 0 altos y 0 críticos**. Esos totales son paquetes, no 12 vulnerabilidades independientes. No se aplicó `npm audit fix` ni el downgrade incompatible a 0.1.9 sugerido para varias cadenas.
- Guarda pública durante cambios concurrentes de correo: `npm run check:public-boundary` salió 1 por `nodemailer` no allowlisted, desde `src/app/api/contact/route.ts` → `src/lib/mailer.ts`. Avisado Claude; no se editó el allowlist para ocultarlo ni se mezcló su dependencia con esta entrega.

La comprobación visual adicional mostró una captura durante el fundido de apertura, con el editor todavía visible detrás. Se repitió esperando `opacity: 1`: fondo `rgb(20, 20, 20)`, menú por encima según `elementsFromPoint`, captura `.audit/cms-keyboard-menu-390-final.png` inspeccionada correctamente. No se añadió CSS para corregir un estado transitorio legítimo. Sin overlays de error ni errores de ejecución en la captura; foco en «Cerrar menú». El script auxiliar inicial también supuso incorrectamente que el primer Tab era el menú; no se usa esa suposición en la prueba de teclado versionada, que recorre el orden natural. La herramienta preferida de la guía de verificación visual no está instalada; se usó Playwright ya disponible, sin instalar otra dependencia.

Pruebas de navegador en puerto **3013**, base SQLite sintética exclusiva de QA creada en el incremento anterior, no base habitual del propietario. Las fixtures pueden publicarse dentro de esa base local para probar aislamiento; eso no publica la web. Repetición: seguir la preparación segura en [entrega anterior](./cms-responsive-editorial-2026-09-07.md) y añadir `node tests/navigation-keyboard.browser.mjs` antes de la regresión. Credenciales sintéticas en variables de entorno, nunca en documentos ni commits.

## Qué NO está resuelto y por qué

| Puerta | Evidencia / siguiente paso |
| --- | --- |
| PostgreSQL real | Sin servidor escuchando en 5432; no `.env` owner configurado, solo plantilla. Docker instalado pero API Linux sin conexión. `docker desktop start --timeout 45` no produjo un motor verificable; se cancelaron los comandos de inicio/consulta propios tras quedar sin respuesta. No se crearon contenedores ni descargaron imágenes. Necesita motor local funcional o staging explícitamente identificado. |
| Persistencia y restauración | No hay directorio de migraciones owner versionadas; el adapter de medios actual usa disco local. Preparar BD de prueba aislada, migraciones revisadas y almacenamiento versionado; probar recuperación conjunta de código, filas y originales antes de producción. No marcar durabilidad por configuración. |
| Correo | Claude, por instrucción de Manuel. Este incremento no instala/configura SMTP ni modifica contacto, MX o credenciales. |
| Publicación | El frontend sigue con contenido versionado en código; los artefactos y revisiones CMS no equivalen a un puente activado. Validación previa y entorno de preview antes de escribir en la web pública. |
| Seguridad de dependencias | 12 paquetes moderados pendientes en owner; guardas públicas de correo en trabajo de Claude. No se concede excepción de publicación. |
| Accesibilidad completa | Falta Safari/iOS, lectores de pantalla, zoom y cobertura de todos los formularios/objetivos táctiles. El alcance probado es navegación del shell y recorridos editoriales documentados. |

No se puede declarar «todo terminado» mientras estas puertas estén abiertas. La próxima acción útil es habilitar un entorno de datos y medios verificable, no añadir pantallas que simulen que ya está conectado.

## Coordinación y recuperación

Hub, tema `portfolio-profesional::cms-keyboard-readiness-2026-09-07`:

- Reserva: `38e7ae95-1b67-480a-9722-e94840cd1d42`.
- Avance con pruebas y límites: `fd146863-0a40-4e71-abaf-156efbc9d754`.
- Fallo de guarda de correo enviado a Claude: `d19f93ee-bed9-4c99-8e68-0259bd3dea90`, solicita respuesta.

Se preservan cambios concurrentes de Claude en package/lock/contacto y entradas ajenas de REGISTRO. Solo se versionan rutas propias y la entrada de entrega propia; no push ni deploy. Durante este incremento Claude guardó correo (`6077b2f`), baseline (`f27a547`), investigación (`4838a81`) y fflate (`b95b525`): no son cambios de esta entrega. La guarda pública de nodemailer sigue fallando en la repetición posterior; no se afirma regresión pública completa en verde. Checkpoint `checkpoint/pre-editor-2026-09-04` verificado intacto en `0f0adf686b2752e23c25d224f8c60815b10fd451`.

Reversión: commit inverso revisado del adapter/registro/importmap y de las validaciones si fuera necesario, sin resetear la rama compartida. No hay migración de datos. El informe y las pruebas pueden conservarse como evidencia. Un tag Git no respalda por sí solo bases ni medios.

Estado de guardado al cerrar: el intento de preparar las once rutas propias falló por `.git/index.lock` existente; el índice seguía vacío en la comprobación posterior. No se borró el bloqueo compartido ni se creó un commit de esta entrega. Los cambios quedan locales, pendientes de commit acotado cuando Git esté libre. Avisado Claude mediante Hub `667274d2-058b-419e-b2e7-434b18065881`. El checkpoint anterior no se ha alterado.

## Consolidación posterior · 2026-09-07, tras el push público de `30af18f`

Git ya no tiene el bloqueo observado arriba. Se revisaron los cambios existentes
contra HEAD y se repitieron las pruebas antes de consolidarlos, sin modificar
su implementación ni incorporar archivos ajenos.

- Unitarias: **700/700**, 141 archivos, salida 0 (148,70 s).
- Integración SQLite sintética y aislada: **22/22**, salida 0 (48,71 s).
- Lint y TypeScript: salida 0.
- Build: `OWNER_PLATFORM_BUILD_PHASE=1 node node_modules/next/dist/bin/next build`,
  salida 0, generación **23/23**. Se invocó Next directamente sin la limpieza del
  wrapper de build; no se borraron directorios ni se inició un servidor.
- Auditoría owner: **12 paquetes moderados, 0 altos y 0 críticos**, salida 1.
  No se cambiaron dependencias ni se dispensó esta puerta.
- `git diff --check` sin errores. Sin diferencias públicas en `src`, `scripts`
  ni manifiestos raíz. La auditoría pública de `fflate` ya pasó en `30af18f`;
  actualizado el runbook para no confundir aquel bloqueo resuelto con el owner.

No se repitieron pruebas de navegador en esta consolidación: las seis pruebas
de teclado, doce responsive y dos recorridos editoriales de arriba son evidencia
del incremento anterior, no nuevas ejecuciones. No había listeners locales en
3001, 3012, 3013 o 5432; Docker estaba detenido y `psql`/`pg_dump` no disponibles
en PATH. No se inspeccionaron secretos ni se tocaron bases habituales.

Próximas puertas: entorno PostgreSQL aislado y recuperable, restauración de
originales de medios, remediación compatible de dependencias y puente de
publicación probado fuera de producción. Este guardado local no publica el CMS
ni modifica el commit público `30af18f` entregado a Claude. Reserva de
consolidación: Hub `7e622883-cfe9-468c-a8a6-3f8ce65d857a`.
