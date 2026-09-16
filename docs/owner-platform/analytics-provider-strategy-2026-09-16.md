# Analítica reutilizable: comparación y propuesta

16/09/2026. Solicitud de Manuel: usar el portfolio como piloto para un gestor de analítica en futuros productos. Investigación y propuesta, no aprobación de gasto, infraestructura, multi-tenant ni despliegue.

## Estado contrastado

- Umami instalado: medición pública con filtros de privacidad; cuenta Cloud gratuita, API bloqueada por Pro según la interfaz observada por Manuel.
- GA4: flujo G-SD9S08GHWS creado por Manuel; no instalado en el layout actual.
- CMS: enlace externo Umami, no sincronización automática de su API.
- Tras cambiar DNS privado AdGuard a Automático, Manuel confirma acceso y muestra alta GA4. No justificar migración por supuesto fallo de Umami.

## Comparación para el producto

Ambos permiten páginas, origen, dispositivos y eventos. Umami también documenta embudos, retención, recorridos, objetivos, atribución e ingresos: no presentarlo como simple contador. La disponibilidad concreta Cloud depende del plan.

GA4 destaca para ecosistema Google Ads/Search Console, web y apps, comercio electrónico con eventos definidos y exportación granular a BigQuery. La Data API admite propiedades estándar con cuotas; no exige Analytics 360 para empezar. BigQuery, alojamiento del conector y mantenimiento pueden costar aunque Analytics estándar sea gratuito.

Umami destaca por código abierto MIT y opción de alojamiento propio con API, control de infraestructura y datos. Esa opción evita suscripción Cloud Pro, no el coste de operación, copias, seguridad, actualizaciones ni soporte. No asumir igualdad entre todas las funciones Cloud y self-hosted.

No hay igualdad automática entre usuarios, sesiones, rebote, duración o atribución de ambos proveedores. Conservar fuente, definición, periodo, zona horaria, fecha de actualización y limitaciones. No sumar visitantes entre fuentes ni presentar datos sintéticos como reales. Eventos requieren instrumentación; un clic de contacto no acredita recepción de mensaje.

## Recomendación propuesta

1. No pagar Pro todavía ni instalar dos trackers de forma permanente por rutina.
2. Validar un recorrido de extremo a extremo: elección del visitante, medición revisada, datos en proveedor, consulta autenticada servidor y resumen privado del CMS.
3. GA4 es candidato al primer conector sin suscripción de analítica; falta habilitar acceso real a Data API. G-SD9S08GHWS no es credencial de lectura ni ID numérico de propiedad.
4. Diseñar un contrato pequeño de métricas, no un framework universal: datos comunes y capacidades opcionales por proveedor. Umami será segundo adaptador solo con caso real y presupuesto justificado.
5. Medir coste por web/mes, tiempo de alta, mantenimiento, errores, latencia/caché, integridad y facilidad de exportación/desconexión. Separar cuentas/permisos de clientes antes de ofrecer un servicio multi-tenant.
6. El portfolio sirve como referencia técnica, no base de datos compartida ni autorización para reutilizar información de otros productos.

## Coste y decisión pendiente

No se confirma importe actual de Pro: la página oficial de precios no devolvió texto utilizable en esta consulta; fuentes secundarias discrepan en cuotas. Antes de pagar, comprobar en checkout importe, impuestos, periodicidad, webs/eventos incluidos, cómputo de propiedades de eventos, retención, API y condiciones de uso comercial/reventa. No equiparar API disponible con permiso de revender el servicio o su marca.

Pagar Cloud es interesante si alojamiento y soporte ahorrados superan la cuota y cubre casos de clientes. Autoalojar interesa por control o volumen probado, no solo por evitar una mensualidad. GA4 interesa para marketing/comercio y clientes con cuentas Google existentes. Recomendaciones, no decisiones ejecutadas.

## Registro comercial reutilizable · instrucción de Manuel

Se conservarán las investigaciones para presupuestar y explicar dos alternativas de servicio. Ofrecer dos alternativas no implica instalar ambos proveedores en cada cliente. Las siguientes fichas son candidatas; ninguna acredita todavía una integración comercial completa.

| Alternativa | Encaje propuesto | Valor que presupuestamos | Límites que explicaremos |
| --- | --- | --- | --- |
| GA4 conectado al CMS | Clientes con campañas, comercio o ecosistema Google | Plan de medición, configuración, consentimiento, eventos probados y panel privado comprensible | Dependencia y cuotas Google; discrepancias de métricas, bloqueadores y consentimiento; funciones avanzadas no se activan por defecto |
| Umami conectado al CMS | Clientes que priorizan analítica web y control operativo | Mismo trabajo de integración y panel, con elección Cloud o autoalojada según caso | API Cloud según plan; coste y responsabilidad de operar self-hosted; sin prometer todas las funciones Cloud en self-hosted |

### Ficha que debe completar cada investigación futura

- Fecha, proveedor, versión/plan/modalidad y enlace primario; revisión antes de cada presupuesto, sin asumir que la tarifa sigue vigente.
- Problema concreto del cliente y decisión que permite tomar; datos/eventos necesarios y exclusiones explícitas.
- Precio de proveedor: moneda, impuestos, mensual/anual, mínimos, permanencia y renovación. Conservar precio original; conversión de moneda fechada si procede.
- Límites: webs, usuarios/equipos, eventos y propiedades de eventos, API, retención, exportación, sobreconsumo y escalado. Indicar si cuota es por cliente, cuenta o instancia.
- Requisitos de cuentas, permisos y consentimiento; titularidad del cliente, revocación, salida y condiciones de integración/reventa verificadas. No guardar secretos.
- Coste nuestro: horas reales de alta, instrumentación, pruebas, soporte y mantenimiento; alojamiento, copias y recuperación. Estimaciones separadas de tiempos medidos.
- Resultado del ensayo: entorno, fecha, commit y recibo; alcance que pasó y fallos. Estado separado: documentado por proveedor / comprobado localmente / verificado en destino / ofertable.
- Decisión: recomendado, descartado o pendiente, con motivo y próxima prueba/responsable.

### Construcción del precio al cliente

Separar tres partidas: **implantación inicial**, **operación recurrente** y **ampliaciones**. Suscripción del proveedor y honorarios nuestros se identifican por separado, incluso si se ofrece un paquete.

Coste inicial = horas estimadas o medidas × coste interno por hora + gastos únicos atribuibles.

Coste recurrente = proveedor atribuible + infraestructura atribuible + horas de operación/soporte × coste interno + provisión de incidencias explícita. Si hay coste compartido, declarar método de reparto y número de clientes supuesto; no repartir cada coste directo dos veces.

Para un margen bruto objetivo m sobre venta: precio sin impuestos = coste / (1 - m), con 0 <= m < 1. No confundir margen con recargo sobre coste. Coste/hora, margen, impuestos aplicables y tarifa final requieren decisión comercial de Manuel: aún no se fijan valores.

Antes de ofertar, calcular escenarios de piloto, varios clientes y crecimiento usando cuotas verificadas y medir el coste marginal de añadir una web. El punto de equilibrio de autoalojar se compara con Cloud incluyendo administración, copias y recuperación, no solo servidor.

### Qué recoger del portfolio piloto

Registrar horas de implementación, pruebas y mantenimiento; peso añadido comparable; latencia y errores de consultas API; uso de cuotas; éxito de aceptación/rechazo/revocación; exactitud de eventos sintéticos; facilidad de consultar, exportar y desconectar. Incluir fuente y definición de cada métrica; no esperar igualdad de visitantes entre motores. No recolectar más datos personales por tratarse de investigación comercial.

Destino: adaptadores de analítica del Dashboard CMS y futuras fichas de presupuesto. Índice en HALLAZGOS, documento canónico aquí. Siguiente responsable Codex: completar evidencias técnicas y precios oficiales cuando sean accesibles; Manuel: autorizar gasto, precios de venta y alcance comercial.

## Fuentes primarias consultadas (comparación)

- https://docs.umami.is/docs/insights
- https://docs.umami.is/docs/api
- https://docs.umami.is/docs/cloud/api-key
- https://docs.umami.is/docs/cloud/faq
- https://umami.is/pricing
- https://github.com/umami-software/umami
- https://marketingplatform.google.com/about/analytics/
- https://marketingplatform.google.com/intl/en_uk/about/analytics/features/
- https://developers.google.com/analytics/devguides/reporting/data/v1/quotas
- https://developers.google.com/analytics/devguides/collection/ga4/ecommerce
- https://support.google.com/analytics/answer/9358801
- https://support.google.com/analytics/answer/13644080
- https://developers.google.com/tag-platform/security/concepts/consent-mode

Sin pruebas runtime nuevas en esa comparación: inspección y documentación. Manuel aprueba gastos y ampliaciones de acceso por separado.

## Actualización verificada en cuenta · 16/09/2026

Settings > Billing de Umami Cloud, sesión del portfolio región EU: Hobby $0/mes, 100.000 eventos/mes, 1 web y 6 meses de conservación. Oferta Pro visible: $20/mes, 1 millón de eventos, 20 webs, 10 miembros, 2 años de conservación y acceso API; eventos adicionales $0,00003 por evento. Son precios mostrados en USD, no presupuesto final con impuestos ni precio de venta a clientes. No se contrató nada. La recogida con script no necesita API de informes; un Dashboard propio sí requiere resolver ese acceso. Recibo técnico: analytics-consent-release-2026-09-16.md.
