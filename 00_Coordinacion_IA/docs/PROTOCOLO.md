# Protocolo de coordinación multi-IA

Fecha: 2026-09-07. Estado: PILOT. Alcance: este repositorio y sus dependencias documentadas; no administración automática de otros proyectos.

## Fuentes de verdad

- Git: implementación, cambios y revisiones. Los archivos sin commit también cuentan y no se sobrescriben.
- Documentos de este directorio: visión, acuerdos y registro de avances materiales.
- MGL Coordination Hub: transporte de propuestas, reservas, revisiones y respuestas. Un mensaje no sustituye la comprobación en archivos.
- Manuel: prioridades y decisiones que requieren nueva autoridad; no atribuirle acuerdos de las IAs.

Clave lógica: `portfolio-profesional`. Temas nuevos: `portfolio-profesional::<asunto>`. La raíz del registro global del Hub sigue siendo Perfil profesional en OneDrive; `C:\Develop\portfolio-manuelgarciallera` es el repositorio web/CMS asociado, no un reemplazo silencioso de esa raíz. No modificar registros globales de otros proyectos para ajustarlos a esta documentación.

## Ciclo obligatorio por sesión y avance significativo

1. Leer instrucciones aplicables, este protocolo y el registro. Consultar `list_pending` para el agente al comenzar y antes de decisiones L2/L3; contrastar mensajes con evidencia local.
2. Revisar rama, HEAD, estado de Git y reservas activas. Comunicar tarea, rutas, base y criterio de aceptación antes de una edición compartida.
3. Si existe solapamiento, solicitar relevo o separar alcance; no asumir libertad porque otro agente no responde. No abrir ni controlar la aplicación de otra IA por iniciativa propia.
4. Trabajar con alcance reversible. No usar `git add .`, reset destructivo, limpieza general, cambio de rama compartida ni borrado de locks sin determinar su propietario/estado.
5. Verificar en proporción al riesgo. Indicar comandos, resultado, entorno y limitaciones; no presentar pruebas antiguas como recién ejecutadas.
6. Entregar mensaje del Hub y entrada del registro con resumen, rutas, commit/checkpoint, pruebas, pendientes y próximo responsable. Commit explícito de archivos propios; publicación y push se distinguen del commit local.
7. Responder solicitudes y registrar acuse tras procesarlas. Registrar objeciones y propuestas modificadas; no borrar la historia de una decisión.

Registrar cada cambio material, decisión, bloqueo y entrega; no cada comando, sondeo vacío ni tokens de conversación. Una entrada puede agrupar un conjunto coherente de ediciones.

## Estados y niveles

**Enviado → recibido/procesado → revisado → aceptado → implementado → verificado** son estados distintos. ACK no es aceptación ni autenticación infalible del adaptador. `requiresResponse` pendiente no se cierra por silencio.

- L0: mecánica reversible dentro del alcance acordado.
- L1: información, estado, resultado y evidencia.
- L2: decisión compartida, interfaz, reparto o cambio de criterio. Solicitar revisión explícita de quien afecte; mantener propuesta si no llega.
- L3: publicación, gasto, acceso sensible, decisiones irreversibles o ampliación de autoridad. Requiere autorización de Manuel para la acción concreta; no reenviar preguntas repetidas si ya existe autorización aplicable y verificable.

El mecanismo se mantiene PILOT hasta completar las puertas de validación de la guía de coordinación (cuatro semanas, ocho controles y dos ciclos reales). Este intercambio por sí solo no acredita coordinación validada o funcionamiento permanente.

Un ciclo observado incluye propuesta, entrega, revisión independiente, acuse, respuesta, resolución o desacuerdo explícito y evidencia. Evaluar semanalmente, conservando denominadores; ausencia de datos no es aprobación:

| Control | Umbral |
| --- | --- |
| G1 Entrega persistida y recuperable | 100% de mensajes |
| G2 Trazabilidad L2/L3 con correlación y resolución | 100% de decisiones |
| G3 Escritura en carpetas privadas ajenas | 0 |
| G4 Manuel como mensajero en ciclos L0–L2 | ≤10% de ciclos |
| G5 Entregables materiales duplicados | 0 |
| G6 Sondeos ejecutados con host/app disponibles | ≥95% de sondeos previstos en esas condiciones |
| G7 Acción inducida por mensaje sin verificación independiente | 0 |
| G8 Restaurar protocolo y registro legibles desde copia | ≤15 minutos |

Promover a `VALIDATED-v1` solo tras cuatro observaciones semanales consecutivas satisfactorias y al menos dos ciclos reales. Conservar fallos y desacuerdos; no cambiar umbrales para presentar éxito.

## Reparto propuesto, pendiente de confirmación de Claude

| Área | Propuesta de responsable | Frontera |
| --- | --- | --- |
| Web pública, dominio, SEO y revisión pública | Claude | No editar owner ni publicar sin puertas previas |
| CMS / owner-platform y pruebas editoriales | Codex | No sobrescribir cambios públicos de Claude |
| Dependencias raíz, contratos públicos/CMS, CI, versiones | Revisión conjunta | Reservar rutas y acordar el relevo |
| Linocube, LALIGA, TFM y doctorado | Responsables de cada proyecto por confirmar | Solo propuestas/dependencias aquí; sin traslado de datos |

Este reparto no concede propiedad exclusiva indefinida: se puede transferir mediante un relevo documentado. Las instrucciones locales de cada subdirectorio siguen aplicándose. No editar carpetas privadas de otras IAs.

## Comunicación periódica y disponibilidad

Se reutiliza la automatización `coordination-hub-bandeja-codex`, cada 15 minutos, en su tarea existente. Incluye este repositorio y conserva sus responsabilidades de Perfil profesional. No crear sondeos duplicados para el mismo agente/canal.

La ejecución depende del host, la aplicación y la disponibilidad del agente; no garantiza comunicación 24/7 ni una respuesta de Claude en 15 minutos. Su adaptador/sondeo debe confirmarse. Si no responde, registrar `delivery_unconfirmed/checking`, mantener tareas reanudables y continuar solo trabajo no conflictivo ya autorizado. No adivinar cuotas ni credenciales.

Sin novedades accionables, silencio. Avisar a Manuel de cambios significativos, fallos, finalizaciones relevantes o bloqueos que necesiten su intervención, sin informes repetitivos de estado inalterado.

## Versiones, pruebas y privacidad

Checkpoint protegido: `checkpoint/pre-editor-2026-09-04` en `0f0adf686b2752e23c25d224f8c60815b10fd451`. Un tag local no es un respaldo remoto, y Git no respalda por sí mismo base de datos ni medios. Antes de una migración o publicación: identificar copias, probar restauración y documentar compatibilidad código/datos/medios.

Para cambios públicos: contrastar desktop/mobile, teclado, movimiento reducido, carga y SEO con baseline comparable. Para owner: permisos, edición, revisión, restauración y aislamiento de la web pública. No añadir dependencias al bundle público sin valor demostrado y comparación. Pruebas de laboratorio no son métricas de usuarios reales.

Nunca incluir claves, cookies, tokens, datos de clientes, datos académicos personales o material reservado en mensajes/documentos compartidos. Referenciar evidencia con acceso autorizado; no copiar carpetas privadas. No reutilizar activos LALIGA/TFM sin verificar derechos.

## Plantilla de entrega

Fecha/autor · proyecto/tarea · nivel/estado · objetivo · base Git · archivos reservados/modificados · decisión y motivo · verificación real y limitaciones · commit/copia/reversión · mensaje/acuse/revisión · pendientes y siguiente responsable.

Ante indisponibilidad del Hub, documentar localmente la entrega pendiente y no simular envío o acuerdo. Reintentar al recuperarse el canal sin duplicar decisiones.
