# Piloto GA4: medición consentida y resumen privado

Fecha: 16/09/2026. Base de inspección: dbf44e4. Estado: diseño para revisión de Manuel; no implementación ni autorización de gasto, despliegue CMS o acceso a Google Cloud. Esta especificación acota el primer piloto, no construye multi-tenant ni obliga a sustituir Umami.

## Contexto y decisiones

Manuel creó G-SD9S08GHWS y pidió avanzar medición, integrar analítica en el Dashboard existente y conservar investigación comercial. El código público carga únicamente Umami. No existe gestor de consentimiento en src. El owner dispone de importación, validación, snapshots y presentación: no crear otro panel ni otro login.

Alternativas examinadas: pegar gtag sin interfaz (descartado: no cumple la propuesta de consentimiento); modo avanzado con pings sin cookies (no elegido: amplía recogida antes de aceptar); modo básico con carga tras aceptación (recomendado). Un CMP externo podría valorarse en futuros clientes, pero no se contrata ni añade dependencia ahora.

## Incremento A: consentimiento y medición pública

### Aprobación y modificación de Manuel (16/09/2026)

Manuel autoriza implementar la tarjeta discreta adaptada a la web. Esta modificación sustituye las menciones anteriores a consentimiento sólo de Google: **ambos proveedores estarán apagados por defecto**. Primera capa con «Aceptar analítica», «Rechazar analítica» de igual prominencia y detalles desplegables; segunda capa con Google Analytics y Umami desmarcados inicialmente. Guardar selección permite elegir uno, ambos o ninguno. Cerrar y pulsar fuera no aceptan. No se contrata CMP ni plan Pro. La persuasión se limita a explicar el beneficio real de mejorar contenidos; no se esconde el rechazo. La integración pública exige retirar el cargador Umami anterior y revisar WebVitals; un componente aislado no acredita cumplimiento de la web desplegada.

- Aviso no modal al pie, adaptable a móvil/desktop, sin ocultar Contacto ni bloquear navegación. Texto claro sobre Google Analytics, enlace a privacidad y botones equivalentes «Aceptar Google Analytics» / «Rechazar Google Analytics». No confundir rechazo de Google con rechazo global de Umami, que se conserva temporalmente y se explica por separado.
- Control permanente «Preferencias de analítica» para reabrir la elección. Sin casillas preseleccionadas ni aceptación por navegar o cerrar. Un cierre sin elección mantiene GA4 apagado.
- Estado local versionado con fecha y caducidad propuesta de seis meses; almacenamiento ausente, corrupto, caducado o inaccesible se trata como no aceptado. Esta duración es decisión de implementación propuesta, no certificación legal.
- DNT/GPC activos impiden cargar GA4 aun con elección almacenada. Sin red a Google antes de aceptar ni después de rechazar. No preconnect, SDK o ping de consentimiento previo. Sólo dominio HTTPS canónico; fuera del portfolio público no carga.
- Al aceptar: inicializar consentimiento con publicidad denegada, habilitar únicamente analítica y cargar una vez la etiqueta. Registrar una vista actual, no reproducir páginas anteriores a la aceptación. No activar Google Signals, personalización, User-ID, publicidad, formularios automáticos ni replay.
- Rutas SPA mediante mecanismo de navegación del framework, no parche global de history compartido con Umami. Sólo una vista por navegación efectiva; query/hash no disparan vistas. Carga automática de vistas desactivada y medición mejorada del flujo confirmada apagada antes de probar.
- Sólo rutas de contenido conocidas: fuera de allowlist no se envía la ruta cruda. Nunca parámetros, fragmentos, título libre, valores de formularios ni identificadores privados. Referrer omitido o limitado al origen según prueba real del SDK; parámetros de configuración revisados antes del primer config.
- Retirada: detener envío, activar flag de deshabilitación, retirar únicamente cookies GA creadas por esta integración en dominios/rutas conocidos y recargar tras guardar rechazo para descargar runtime de terceros. No borrar cookies ajenas ni afirmar borrado de datos históricos en Google. Anunciar recarga y no perder borradores de formulario sin aviso; si hay datos sin guardar, pedir confirmación antes de ejecutar retirada con recarga.
- Propagación entre pestañas con storage event; volver a primer plano revalida elección/caducidad. No perpetuar consentimiento antiguo.
- Fallo de carga/bloqueador no rompe la web ni reintenta indefinidamente. No evadir protecciones del visitante.

Rutas candidatas: nuevos componentes/lib de analytics y CSS aislado; integración en src/app/layout.tsx; revisión de src/app/privacidad/page.tsx y enlace de preferencias. Relevo de rutas compartidas solicitado al Hub, no inferido de silencio. Leer guía Next local correspondiente antes de editar.

## Incremento B: lectura para el Dashboard existente

No depende de incluir secretos en la web. G-SD9S08GHWS es ID público de medición, no ID numérico de propiedad ni token de lectura.

Primera puerta externa: confirmar propiedad numérica, zona horaria, API habilitada en proyecto autorizado e identidad con acceso de lectura a esa propiedad. OAuth o cuenta de servicio se decide con la infraestructura destino; no crear claves persistentes ni copiar tokens en chat. El piloto owner no autoriza cuentas de otros clientes.

Primero validar una consulta read-only desde servidor; sólo después añadir sincronización. No instalar SDK en bundle público. Sin BigQuery, cron nuevo o facturación para esta fase. La renovación, permisos y errores deben probarse antes de conectar UI.

Reutilizar owner-platform/src/analytics. El contrato v1 actual no contiene identidad de propiedad, zona horaria ni flags de calidad: no importar GA4 como si fueran equivalentes. Antes de persistir, definir ampliación versionada compatible con snapshots históricos y pruebas de datos anteriores; no modificar hashes históricos.

| Dato propuesto | Fuente GA4 | Regla de presentación |
| --- | --- | --- |
| Vistas web | screenPageViews con filtro del flujo/host web | Totales consultados sin dimensión de ruta; no sumar sólo top rutas |
| Usuarios | totalUsers | Etiqueta «Usuarios totales · GA4», no mezclar con activeUsers ni identidad personal |
| Rutas | pagePath y métricas por ruta | Filtrar rutas públicas permitidas; top N visible y truncación indicada |
| Rebote | bounceRate | Convertir fracción a porcentaje; declarar definición GA4, no equivalencia Umami |
| Duración | averageSessionDuration, si se incorpora | Etiqueta duración media de sesión, no tiempo activo; no poblar campo genérico sin aclararlo |
| Core Web Vitals | No inferir de GA4 base | Ausente hasta tener fuente e instrumentación verificadas; nunca cero ficticio |

Las métricas y compatibilidad del filtro se verifican con checkCompatibility/consulta real. Fechas de API son días inclusivos de la propiedad: conservar zona horaria y ventana original, sin disfrazarlas de medianoche UTC. El resumen actual compara ventanas UTC adyacentes de igual duración; cambios de hora requieren criterio documentado antes de habilitar deltas. Usuarios por ruta no son sumables.

Preservar metadatos de calidad: sampling, umbrales, dataLossFromOtherRow, filas totales y truncación. Si un resultado excede lo que el contrato representa fielmente, rechazar importación o mostrar limitación explícita, no descartar metadatos silenciosamente. Consultas vacías válidas se distinguen de 401/403, cuota, timeout, parseo o proveedor no conectado.

Backend owner con auth existente y respuestas private/no-store. Si se añade caché, sólo servidor y aislada por propiedad/filtro/periodo/versión; UI muestra fecha de obtención. Un cambio de captura no debe crear duplicados del mismo lote por rutina: definir clave idempotente aparte del hash actual, que incluye capturedAt. Límite y retry acotados, sin cuerpos/tokens del proveedor en errores o auditoría.

## Verificación y puertas de cierre

1. Unitarias TDD: elección inválida/caducada, privacidad, allowlist, parámetros limpiados, carga única, rechazo y revocación.
2. Navegador: 320/390/768/1440, claro/oscuro, teclado, zoom, Contacto y rutas SPA; contador real de solicitudes interceptadas antes de aceptar = 0. Aceptar/recargar/rechazar/retirar/cambiar pestaña y bloquear script no rompen la web.
3. SDK de Google en ensayo controlado: inspeccionar tráfico y cookies para detectar campos automáticos no previstos. Interceptar colección en pruebas; no contaminar producción sin ensayo explícito.
4. Integración de lectura con respuestas oficiales sintéticas: cabeceras reordenadas, datos ausentes, error de cuota, umbrales, fechas y valores inválidos, propiedad incorrecta y privacidad. Prueba HTTP owner rechaza visitante sin sesión. Datos sintéticos siempre identificados.
5. Acceso real mínimo: verificar propiedad, consulta y números del mismo periodo en panel. Sin acceso no afirmar conector real terminado.
6. Build, aislamiento público/owner y comparación de bundle; revisión de contenido de privacidad. No certificación legal ni de seguridad.
7. Publicación pública separada con autoridad aplicable y reversión; CMS no se despliega por esta especificación. Confirmación de datos en app de Manuel es otra puerta.

## Medición comercial del piloto

Registrar horas, coste externo, peso incremental, tiempo de alta, errores/API, consultas y mantenimiento en analytics-provider-strategy-2026-09-16.md. No abrir segundo motor de forma permanente ni presupuestar funciones no verificadas. Antes de multi-cliente: aislamiento, titularidad, revocación, exportación y condiciones comerciales.

## Próxima intervención de Manuel

Actualización 16/09: interfaz aprobada e integrada localmente por instrucción posterior. La retirada implementada no fuerza recarga: deshabilita GA mediante su indicador oficial, borra sólo cookies propias y detiene el adaptador manual de Umami. Ensayo con SDK reales y colección interceptada verifica ausencia de envíos posteriores y conservación del formulario. Las referencias anteriores a recarga son el diseño inicial, sustituido por este comportamiento. No cancela envíos ya en tránsito ni elimina histórico remoto.

- Revisar este alcance, especialmente aviso y retirada con recarga, antes de programar la nueva interfaz de consentimiento.
- Cuando sea posible: facilitar sólo el ID numérico de propiedad y su zona horaria (no secreto) para preparar lectura. No necesita enviar contraseñas ni claves.
- El acceso autenticado a API se coordina después; no es necesario para redactar tests/diseño y no se pide repetidamente desde el móvil.

## Referencias

- Código inspeccionado: src/app/layout.tsx, src/lib/umami-tracker.ts, src/app/privacidad/page.tsx, owner-platform/src/analytics/{snapshot,summary,service}.ts y OwnerOverview.tsx.
- https://developers.google.com/tag-platform/security/concepts/consent-mode
- https://developers.google.com/tag-platform/security/guides/consent
- https://developers.google.com/analytics/devguides/collection/ga4/views
- https://developers.google.com/analytics/devguides/reporting/data/v1/quickstart
- https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema

Revisión propia: no importación automática, no PII explícita, no falsa equivalencia de métricas, permisos separados, alcance por incrementos y decisiones pendientes identificadas. Sin código nuevo o pruebas ejecutadas en esta entrega.
