# Owner Studio: contraste competitivo y verificación

Fecha: 2026-09-05. Código inspeccionado: `490009c544d9d6799d177ed4c1962ad8adccee49`.
Alcance: revisión y pruebas locales, sin migraciones de producción, activación
de conectores, cambios de diseño ni despliegue. Este informe complementa,
no sustituye, `completion-audit-2026-09-05.md`.

## Conclusión

La base actual permite seguir construyendo un CMS independiente del renderer
público. No hay evidencia que justifique cambiar ahora de stack o incorporar
otro constructor al bundle del portfolio. Sí hay una brecha de experiencia:
el panel expone muchas operaciones técnicas y la preview editorial no reproduce
todavía toda la dirección artística pública. Antes de venderlo debemos cerrar
esa brecha, demostrar una integración real y probar tareas con usuarios.

La investigación compara documentación oficial disponible, no cuentas de pago
probadas personalmente ni velocidad medida de competidores. Sus funcionalidades
no prueban nuestra demanda, facilidad de uso o rentabilidad.

## Qué hacen y cómo lo integran

| Referencia | Mecanismo documentado | Aplicación propuesta, no implementada por este informe |
| --- | --- | --- |
| [Framer: edición sobre página](https://www.framer.com/help/articles/on-page-editing/) | Edición de texto, imágenes, propiedades y contenido CMS desde la página; las páginas nuevas de este recorrido dependen del CMS. | Seleccionar contenido en una preview fiel sin obligar a entender colecciones y campos. |
| [Wix Studio](https://www.wix.com/studio/management-tools) | Espacio multisite, roles, kits de entrega y modo de contenido para preservar el diseño. | Separar modo negocio y modo creador; introducción contextual para el cliente. No implica que nuestro sistema sea ya multicliente. |
| [Elementor: Role Manager](https://elementor.com/help/role-manager/) | Permiso para editar contenido existente sin añadir elementos, sobre roles de WordPress. | Restringir capacidades en servidor; ocultar controles no constituye autorización. |
| [Sanity: drag and drop](https://www.sanity.io/docs/visual-editing/enabling-drag-and-drop) | Overlays sobre preview que modifican el orden de arrays de contenido; el frontend vuelve a renderizar sus datos. | Reordenar bloques estructurados con identidad estable, no manipular el DOM como fuente de verdad. La documentación advierte que este drag and drop no es compatible con dispositivos táctiles: necesitamos alternativa móvil y teclado. |
| [Builder: componentes propios](https://www.builder.io/c/docs/custom-components-setup) | Registro de componentes e inputs editables en el editor visual. La página documenta límites de registro de RSC, aunque soporta SSR/SSG. | Reutilizar componentes propios y exponer parámetros, sin asumir que instalar el SDK preserve automáticamente peso o arquitectura. |
| [Builder: components-only](https://www.builder.io/c/docs/guides/components-only-mode/) | Restringe la composición al catálogo; documenta una variante React lite bajo condiciones concretas. | Un catálogo extensible puede preservar calidad sin exigir un lienzo arbitrario. Es un patrón a evaluar, no una instalación recomendada. |
| [Webflow: componentes IA](https://help.webflow.com/hc/en-us/articles/51168990228499-Build-AI-code-components) | Generación React mediante instrucciones; la capacidad IA se combina con el rol del sitio. Un editor de contenido no obtiene por ello permiso de crear componentes. | Permisos IA específicos por acción y separación entre generar, revisar, aplicar al borrador y publicar. |
| [Payload: Live Preview](https://payloadcms.com/docs/live-preview/overview) | Frontend en iframe y comunicación mediante postMessage para actualizar la preview. | Aprovechar la base existente, autenticar preview y validar origen/mensajes; conectar el renderer real es trabajo adicional. |
| [Odoo: formulario a CRM](https://www.odoo.com/documentation/19.0/applications/sales/crm/acquire_leads/opportunities_form.html) | La acción del formulario crea una oportunidad en el CRM. | Primer recorrido Linocube acotado: solicitud web a tarea de seguimiento. Fuente localizada en el buscador oficial; la extracción directa devolvió error. |

### Integración fiable: más que conectar una URL

[Framer](https://www.framer.com/help/articles/framer-form-webhook-setup/)
documenta POST JSON, respuesta 2xx, hasta cinco reintentos, secreto de firma e
identificador de envío. [HubSpot](https://developers.hubspot.com/blog/unlocking-the-power-of-webhooks-workflow-actions-in-hubspots-new-developer-platform)
recomienda verificar solicitudes, almacenar o encolar el evento y procesarlo
asíncronamente, con observabilidad de fallos. Los contratos concretos difieren
entre proveedores; no se debe reutilizar un verificador de firma indiscriminadamente.

Inferencia para Linocube: identificar sitio/cliente por credenciales autorizadas,
validar firma y esquema, persistir antes de confirmar recepción, deduplicar por
evento, reintentar y mostrar estado recuperable. La web no debería esperar al
CRM para renderizar. Esto no exige todavía comprar un servicio de colas ni
compartir una base de datos entre CMS y CRM.

El código actual de `src/connectors/linocube.ts` valida un manifiesto de
contenido y devuelve un consumidor desactivado. No es un receptor de solicitudes,
sincronización de contactos, SSO, ni aislamiento multicliente. Su digest acredita
integridad, no autenticidad de quien envía el manifiesto.

## Verificación nueva

| Ejecución | Resultado y límites |
| --- | --- |
| Portfolio: `npx vitest run --config vitest.unit.config.ts` | 207 pruebas, 32 archivos, exit 0. |
| Portfolio: `npm run check:all` | Guardas 11/11; frontera de 20 entradas, encoding, hero, tipografía (8 perfiles), navegación, lint, tipos y build correctos. Presupuesto de bundle de 9 rutas correcto con tolerancia existente. El comando global termina exit 1 por auditoría de seguridad. Las guardas estructurales no son capturas responsive. |
| Portfolio: `npm run test:owner-isolation` | 8/8, exit 0. Incluye rechazos deliberados de checkpoint manipulado. |
| Owner: `npm run check`, `VITEST_MAX_WORKERS=2` temporal | 653 pruebas en 141 archivos, 17 integraciones SQLite, lint, tipos y build; exit 0. Hubo aviso de timeout al terminar un worker de `summary-service.test.ts`: no se declara resuelto. |
| Owner: `npm run test:controls` | 22 casos de navegador, exit 0, a 1280/390 px. Componentes reales con contexto y transporte sustituidos; no E2E del servidor. |
| Owner real: `modular-editor.browser.mjs` | Guardado y reapertura de artículos/proyectos con bloques sin exigir texto legacy duplicado; exit 0. |
| Owner real: `media-editor.browser.mjs` | Teclado, guardado/reapertura del encuadre y separación de overrides móviles; exit 0. |
| Owner real: `dashboard-refresh.browser.mjs`, escenarios separados | Registro de versión y refresco del resumen; restauración en 1280/390 px conserva publicado y persiste al recargar. Preparación de publicación en ambos tamaños crea revisión, artefacto y preflight sin cambiar la página ni errores runtime. Ejecución separada final exit 0. No despliega. |
| Storybook: `npm run test:storybook` | Tres ejecuciones fallidas, la tercera con diagnóstico DEBUG. Ninguna ejecutó casos. Chromium abre páginas y conecta la API del orquestador, pero no completa la inicialización de sesión en el plazo. El log muestra load al cerrar las páginas; no basta para atribuirlo a aplicación, red o recursos. No se aumentaron timeouts ni se desactivó accesibilidad. |

Las pruebas reales usan una base SQLite nueva de QA y una cuenta ficticia
`@example.invalid`, en loopback 3011. No utilizan la base owner habitual. La
instalación sintética pasó; la clave bootstrap se retiró al reiniciar el servidor.
Se inspeccionó la pantalla de login y no se observó error overlay. No hay servicio
de correo configurado: el enlace de recuperación visible no acredita entrega real.

La primera prueba real de restauración quedó interrumpida porque el servidor
terminó con exit 1, sin causa concluyente en el log. No se interpretó el timeout
del botón como prueba suficiente de un fallo del componente. En el segundo
arranque, el mismo recorrido desktop restauró el borrador, conservó publicado
y persistió tras recarga. Se conserva el incidente como pendiente de diagnóstico.

El intento que habilitó simultáneamente `OWNER_QA_RESTORE=1` y
`OWNER_QA_PUBLICATION=1` encontró después un error del escenario de prueba: la
restauración navega al documento del plan, pero el paso de publicación intenta
leer un enlace del dashboard anterior. No es evidencia de fallo de publicación.
Ambos recorridos deben ejecutarse por separado con este harness; no se cambia
el producto para acomodar un locator obsoleto.

La repetición separada terminó correctamente en desktop y móvil. Se detuvo el
servidor aislado al acabar; los datos ficticios permanecen en `.data/` para
inspección, sin eliminar contenido del usuario. El checkpoint protegido resuelve
al commit `0f0adf686b2752e23c25d224f8c60815b10fd451` (el objeto tag anotado
tiene otro identificador; no es un movimiento de checkpoint).

## Hallazgos priorizados

1. **Antes de exposición pública:** auditorías npm no limpias. Portfolio:
   `fflate`, un paquete moderado; owner: 12 paquetes moderados por cadenas
   Payload y esbuild transitivo. Cero avisos high/critical en estas respuestas
   no equivale a ausencia de vulnerabilidades. El owner declara `unlock: ownerOnly`,
   pero eso no limpia el aviso del paquete. No ejecutar una remediación forzada
   que proponga bajar Payload a 0.1.9.
2. **Antes de afirmar QA completa:** resolver el arranque Storybook y explicar la
   terminación del servidor/worker. Faltan pruebas PostgreSQL, objetos duraderos,
   correo y conectores reales. No se ha repetido Lighthouse ni auditoría de
   producción en esta sesión; no se reutilizan puntuaciones antiguas como nuevas.
3. **Antes de entregar a clientes:** preview fiel al renderer, lenguaje consistente
   y tareas guiadas. El login sigue con etiquetas inglesas y marca Payload.
   Varias operaciones de publicación requieren frases y documentos intermedios;
   son trazabilidad técnica, no evidencia de un flujo fácil para un no técnico.
4. **Antes de ecosistema comercial:** contrato de entrada de solicitudes separado
   del manifiesto, permisos por cliente, aislamiento, reintentos, exportación,
   soporte y coste medido. No confundir una simulación con demanda validada.
5. **Validación humana:** probar comprensión de la propuesta y la primera tarea
   con participantes del sector piloto, midiendo ayuda requerida, errores,
   recuperación y tiempo. El enfoque aprender-haciendo es una hipótesis, no una
   mejora de usabilidad demostrada por estos tests.

## Decisión recomendada

Conservar Payload y el frontend propio mientras se resuelven estas puertas.
Tomar de la competencia los patrones comprobables, no añadir sus SDKs por
acumulación. Prioridad: estabilidad y preview fiel; después flujo de edición
guiado y un único recorrido CMS → Linocube. Arquitectura, diseño público y
conectores permanecen sin cambios en esta auditoría.

## Revalidación sobre `45f328f` (5 de septiembre, tarde)

Se repitieron las comprobaciones después de incorporar identidad de bloques,
título histórico y recetas de encuadre a los snapshots. No se modificó código
de aplicación, configuración de tests, dependencias ni contenido público.

| Comprobación repetida | Resultado observado |
| --- | --- |
| Owner `check`, con dos workers temporales | 687 unitarias, 20 integraciones SQLite, lint, tipos y build; exit 0. Reaparecieron avisos de timeout al terminar workers en cinco archivos; no se declara resuelta la estabilidad del ejecutor. |
| Portfolio unitarias, dos workers | 207/207; exit 0. |
| Portfolio `check:all` | 11 guardas, 20 entradas públicas, encoding, hero, tipografía en ocho perfiles, navegación, lint, tipos, build y presupuesto de bundle en nueve rutas superados. Exit 1 por `fflate`, un aviso moderado. |
| Aislamiento owner | 8/8; exit 0. El error del hash ficticio pertenece al caso negativo deliberado. |
| Owner `test:controls` | 22 casos browser a 1280/390 px; exit 0. Componentes reales con contexto y respuestas sustituidos, no E2E de proveedores. |
| Owner `npm audit --omit=dev --json` | Exit 1; 12 paquetes moderados por las cadenas de Payload y esbuild. No se aplicó `audit fix --force`. |

Las unitarias owner tardaron 214,52 s; las integraciones, 29,11 s. Se observó
aproximadamente 1,2 GiB de memoria física disponible en una máquina de 32 GiB
durante la ejecución. Es contexto diagnóstico, no una causa demostrada de los
avisos. El código del ejecutor sitúa esos mensajes en el cierre del worker;
el resumen final sí registra todos los casos como pasados. El warning de correo
sin adaptador también permanece: las pruebas no acreditan envío de emails.

Se inspeccionaron las dos capturas nuevas de comparación de propuestas a
1280/390 px: el texto largo se adapta, el marcado malicioso aparece como texto,
el foco de teclado es visible y la decisión aceptada indica que no ha aplicado
cambios. Esta inspección abarca ese componente, no todas las pantallas del CMS.

No se repitieron en esta pasada Storybook, Lighthouse, la matriz visual completa
ni los recorridos con un servidor owner real. Sus resultados anteriores y sus
incidencias siguen siendo históricos, no nuevas verificaciones satisfactorias.
Tampoco se probaron PostgreSQL, cuentas de proveedores o aislamiento multicliente.

### Contraste competitivo actualizado

Se volvieron a consultar las fuentes oficiales enlazadas en este informe.
La búsqueda adicional de Odoo confirmó en su resultado oficial el flujo
formulario → oportunidad y asignación comercial; la apertura directa siguió
sin ofrecer extracción utilizable. No se usaron reseñas de terceros para
acreditar capacidades técnicas ni se probaron cuentas de pago.

El detalle más cercano a la propuesta del owner aparece en
[Webflow, AI code components](https://help.webflow.com/hc/en-us/articles/51168990228499-Build-AI-code-components)
(actualizado el 2 de septiembre de 2026): asistente a izquierda/derecha o
flotante, posición recordada por sitio, lectura de estilos y variables para
guiar la generación y edición dirigida al elemento seleccionado. La generación
consume créditos; la edición visual no. La publicación de esos componentes
requiere planes de pago. Esto confirma un patrón de interacción existente,
no que debamos copiar su stack ni que nuestra implementación pueda operar gratis.

[Wix Studio](https://www.wix.com/studio/management-tools) comercializa también
la entrega al cliente: kit de ayuda, modo de contenido y reportes mensuales.
La inferencia para nuestro producto es que la propuesta comercial debe
explicar autonomía y seguimiento, no enumerar tecnologías. No hay todavía
evidencia de demanda, precio aceptable o coste de soporte de nuestro CMS.

Orden recomendado, sin activar integraciones desde esta auditoría:

1. Cerrar estabilidad, seguridad y restauración en infraestructura real.
2. Preview fiel y una tarea editorial sencilla de principio a fin, sin IA.
3. Aplicar propuestas al borrador con autorización explícita, control de
   concurrencia y copia recuperable. Una aceptación registrada no basta.
4. Probar un único recorrido comercial: formulario web → solicitud identificada
   → oportunidad en Linocube → siguiente acción visible. Credenciales por cliente,
   deduplicación, reintentos y trazabilidad antes de denominarlo ecosistema.
5. Validar ese recorrido con usuarios no técnicos; después valorar el panel
   acoplable y la expansión a un editor más libre.

El enfoque visual inspirado en videojuegos debe probarse como aprendizaje por
tareas y feedback comprensible, no como animación adicional obligatoria. Es una
hipótesis de diseño pendiente de validación, no una ventaja comercial demostrada.
