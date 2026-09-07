# Ecosistema de productos y laboratorio

Fecha: 2026-09-07. Autor: Codex. Estado: visión solicitada por Manuel; organización propuesta en revisión multi-IA. Coordinación PILOT.

## Propósito y límites

Construir productos útiles y conectables a partir de proyectos reales. El portfolio tiene valor profesional y académico por sí mismo: no se convierte en un catálogo de promesas ni pierde su calidad para demostrar el CMS. La visión comercial no acredita que todos los productos existan, estén integrados o sean vendibles.

| Línea | Función | Estado que podemos afirmar aquí | Próxima puerta |
| --- | --- | --- | --- |
| Portfolio + CMS | Presencia profesional/académica y edición de webs | Web existente y CMS owner local en desarrollo, con verificaciones documentadas | Respaldo recuperable, calidad pública, operación editorial y staging |
| Linocube + CRM | Gestión de relaciones y seguimiento de clientes | Proyecto y objetivo indicados por Manuel; madurez no auditada en este turno | Informe del responsable y contrato de integración propuesto |
| LALIGA + Hub de Clubes + CRM | Flujos operativos y documentales del contexto de clubes | Proyecto específico; no se presupone licencia para venderlo | Separar necesidades genéricas de datos, marcas y trabajo reservado |
| Buy&Sell / TFM + e-commerce | Catálogo, compra y venta; posible base para otros comercios | Proyecto académico en equipo; producto comercial aún por evaluar | Inventario de autoría, permisos, dependencias y operación de venta |
| SomethingHuman | Laboratorio doctoral de diseño, componentes y automatización con IA | Visión experimental; nombre, dominio y protocolo por definir | Pregunta de investigación, hipótesis, método y límites éticos |

El MGL Coordination Hub es infraestructura de coordinación de agentes. **No es el Hub de Clubes** ni un CRM de clientes.

## Prioridades y secuencia

1. **P0 — proteger y estabilizar lo existente.** Portfolio, checkpoints, copia remota comprobada, dominio principal `.com` y redirección del `.es`, SEO, accesibilidad, responsive y rendimiento medidos. No cambiar DNS ni publicar desde una tarea documental.
2. **P1 — cerrar un CMS usable.** Probar el recorrido completo: entrar, editar, ordenar, previsualizar, revisar, publicar mediante un puente controlado y restaurar. Staging con base de datos y medios respaldados antes de considerarlo listo para producción. Mantener el editor separado de la carga pública.
3. **P2 — demostrar reutilización.** Una segunda web autorizada debe poder usar bloques y contenido sin copiar secretos ni romper su identidad. Medir tiempo de configuración, errores, autonomía del owner y coste de operación. No extraer un gran framework antes de conocer esa segunda necesidad real.
4. **P3 — conectar productos.** Validar un flujo útil, por ejemplo una consulta de una web hacia un CRM, mediante contrato versionado, permisos y consentimiento aplicables. No integrar por compartir nombre de cliente o una base de datos.
5. **Investigación en paralelo, aislada.** SomethingHuman puede estudiar hipótesis derivadas de estas experiencias. Un experimento no pasa a producto sin revisión, pruebas y posibilidad de revertir. No iniciar experimentos con personas o datos reales por esta autorización general.

Esto ordena dependencias, no cancela los trabajos activos de LALIGA o Linocube ni asigna su capacidad sin consultar a sus responsables.

## Arquitectura de cooperación propuesta

Cada producto conserva su repositorio, ciclo de publicación, datos, permisos y responsabilidad. Compartir, cuando se justifique, contratos y componentes; no dar acceso automático a usuarios entre productos. Una futura identidad común o modalidad multi-tenant requiere una decisión separada y pruebas de aislamiento.

Posibles capacidades reutilizables: tokens de diseño, registro de bloques, biblioteca de medios, versiones, auditoría, conectores y controles de permisos para IA. Son candidatos, no paquetes compartidos ya implementados. Documentar dueño, versión, compatibilidad, migraciones y consumidores antes de extraerlos.

Una IA propone cambios acotados sobre esquemas conocidos; el motor valida permisos, entradas y diferencias. Separar proponer, aplicar y publicar; conservar revisión y reversión. No ofrecer ejecución arbitraria de código o publicación autónoma como consecuencia de añadir un chat.

## Integraciones: ficha mínima antes de programar

- Problema del usuario, emisor/receptor y responsable de cada extremo.
- Datos imprescindibles, procedencia, permisos, separación de clientes y retención.
- Contrato/versionado, autenticación, idempotencia, reintentos y errores visibles.
- Entorno de prueba sin datos reales, métricas de éxito y coste previsto.
- Activación explícita, registro de operaciones y desconexión/reversión verificadas.

LALIGA y el TFM requieren verificar derechos de reutilización y autorías antes de trasladar código, diseño o datos a una oferta comercial. Presentar únicamente la contribución propia demostrable. Un e-commerce necesita además validar pedidos, inventario, devoluciones y pagos en modo de prueba antes de cualquier operación real.

## Qué vender y qué demostrar

Hipótesis inicial: web diseñada + edición autónoma; CRM como módulo separado; hub operativo y comercio como soluciones según necesidad, no un paquete obligatorio. Validar demanda y coste de soporte con clientes piloto antes de prometer un ecosistema completo. No hay garantía de coste cero: alojamiento, almacenamiento, correo, pagos y uso de IA pueden generar costes aunque una librería sea gratuita.

La evaluación debe combinar tareas reales (éxito, tiempo, errores, facilidad para recuperar cambios) con rendimiento y accesibilidad medidos. Una puntuación automática no equivale a usabilidad validada ni a conformidad certificada. Guardar entorno, fecha y método junto a cada resultado.

En SomethingHuman separar evidencia académica, resultados negativos y limitaciones de los mensajes comerciales. Los aprendizajes pueden volver al CMS u otros productos mediante una propuesta revisable, no mediante sincronización automática entre entornos.

## Evidencia disponible y alcance

- [Auditoría de cierre del CMS](../../docs/owner-platform/completion-audit-2026-09-05.md) — consultar pendientes, no interpretar el título como producto terminado.
- [Verificación de paneles owner](../../docs/owner-platform/workflow-panels-verification-2026-09-07.md).
- [Auditoría pública de Claude](../../docs/portfolio-auditoria-completa-2026-09-07.md) — contiene hallazgos y rectificaciones; contrastar con HEAD.

Esta organización no sustituye una auditoría de Linocube, del Hub de Clubes o del TFM, ni una investigación de mercado actualizada. Sus estados se incorporarán cuando los responsables aporten evidencia.
