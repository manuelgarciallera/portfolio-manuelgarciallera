# Registro de decisiones y entregas

Estado general: PILOT. Las propuestas no aceptadas se indican expresamente. Este registro resume hitos; Git y los informes enlazados contienen el detalle.

## 2026-09-07 · Base recibida antes de organizar el ecosistema

- **Claude, público:** cambios hasta `262eaa5`, auditoría con rectificaciones y solicitud de `npm run check:all` en Windows antes de desplegar. Su mensaje `52489c78-7790-4cf7-b6c0-5c3032dd8505` se contrastó con Git. No considerar sus capturas del contenedor con CSS incompleto evidencia de layout Windows.
- **Codex, owner:** commit `0132f49`, paneles de workflow fuera de la barra sticky. Pruebas del turno anterior: 689 unitarias, 20 integración, 22 controles navegador, 8 dashboard responsive/temas, lint, build y fronteras de aislamiento. No repetidas durante este turno documental. Evidencia: [informe](../../docs/owner-platform/workflow-panels-verification-2026-09-07.md).
- **Protección:** checkpoint local `0f0adf6` intacto. El respaldo remoto completo sigue pendiente de comprobación. No push ni despliegue en esta entrega.

## 2026-09-07 · Codex · L2 · Organización solicitada por Manuel

Objetivo: ordenar las líneas portfolio/CMS, Linocube/CRM, LALIGA/Hub, TFM/comercio y SomethingHuman, y mantener comunicación entre IAs sin cambios visuales.

Implementado:

- Inicializada adopción local del Hub con `projectKey=portfolio-profesional`, sin cambiar la raíz global del proyecto.
- Creados mapa de ecosistema, protocolo, registro e instrucciones de entrada para Codex/Claude. No se tocan instrucciones privadas ni archivos de owner preexistentes.
- Ampliada la automatización existente `coordination-hub-bandeja-codex`, ACTIVE, cada 15 minutos, misma tarea destino `019fa289-7558-7891-bba4-54212f049563`. Confirmación del servicio: actualización realizada. No se ha observado aún una ejecución posterior al cambio.
- Respondido a Claude por Hub: `f7381a19-458b-4b31-bd09-3a505045ba67`, correlacionado con su auditoría. Acuse local registrado: `8839f207-833b-43d0-9572-e8266c200016`.

Decisiones propuestas: reparto Claude público / Codex CMS; contratos entre productos antes de compartir infraestructura; laboratorio experimental separado de producto estable. **Pendiente:** confirmación/revisión de Claude, su cadencia real de lectura y los responsables de otros proyectos. Un acuse local no acredita su aceptación.

Hipótesis del cambio: un registro común y el sondeo existente reducen mensajes transportados por Manuel y entregables duplicados sin aumentar acciones inseguras ni ruido. Responsable de seguimiento: Codex. Primera revisión objetivo: 2026-09-14; ventana de evaluación: cuatro semanas desde la adopción. Métricas: G1–G8 del protocolo, sin baseline cuantificado todavía. Esta fecha es un punto de revisión documental, no una nueva automatización semanal.

Alcance excluido: código de ejecución, diseño público, dominios/DNS, publicación, costes, conexión de datos y desarrollo de productos ajenos a este repositorio. No se ha realizado nueva auditoría de mercado en este turno.

Reversión: los nuevos documentos son aditivos y versionados; la automatización se revierte mediante su herramienta de actualización, no con Git. Para retirar esta ampliación de seguimiento, conservar el sondeo de Perfil profesional y eliminar solo las referencias nuevas al repositorio y al protocolo.

Verificación de esta entrega: JSON de coordinación parseado con clave/prefijo/estado correctos; seis archivos de instrucciones/documentación legibles y cuatro enlaces relativos de evidencia comprobados; `git diff --check` sin errores. Configuración guardada del heartbeat confirma ACTIVE, intervalo y tarea conservados. Mensaje recuperable en bandeja de Claude, todavía pendiente de respuesta. El tag anotado se resolvió a commit mediante `^{commit}` y conserva `0f0adf686b2752e23c25d224f8c60815b10fd451`. No se ejecutaron pruebas de aplicación al no cambiar código de ejecución.

## Tablero de próximos pasos

| Prioridad | Acción / puerta de cierre | Responsable / estado |
| --- | --- | --- |
| P0 | Confirmar reparto, reservas y mecanismo de lectura | Claude + Codex; propuesta enviada |
| P0 | Respaldo remoto verificable; registrar SHA y restauración de código | Responsable de Git por acordar; no confundir tag con copia externa |
| P0 | `check:all` Windows y contraste público antes de despliegue | Claude propuesto; pendiente de evidencia nueva |
| P0 | Verificar TLS/canonical `.com` y redirección `.es` | Claude propuesto; no cambios de dominio en este turno |
| P1 | Resolver desbordamiento de navegación owner 390→402 px | Codex; hallazgo pendiente, no corregido por estas instrucciones |
| P1 | Staging PostgreSQL/medios/correo, seguridad y restauración real | Codex; requiere entorno y puertas operativas |
| P1 | Completar publicación controlada y probar de punta a punta | Codex; preparación de publicaciones no equivale a publicar |
| P2 | Inventario de madurez y límites en Linocube/LALIGA/TFM | Responsables por confirmar; no migrar nada aún |
| P2 | Segundo caso autorizado para validar reutilización/comercialización | Manuel + equipo; alcance y métricas por concretar |
| Investigación | Definir identidad y protocolo experimental SomethingHuman | Manuel + responsables del doctorado; nombre/dominio no decididos |

Las pruebas funcionales existentes no convierten automáticamente el CMS en producto comercial listo. Analítica importada, planes Figma y propuestas IA no deben presentarse como conectores reales ya operativos.

## 2026-09-07 · Codex · L1 · CMS responsive y recorrido editorial

- Implementación local: cabecera y menú owner corregidos solo hasta 768 px; sin cambios públicos, dependencias, DNS, push o despliegue. Se preserva el commit SEO de Claude `687f849` y la entrada de verificación Windows anterior.
- Verificación: 689 unitarias, 20 de integración, 12 combinaciones responsive/tema y 2 recorridos de edición/reordenación/guardado/preview/restauración; medios y bloques de artículos/proyectos; lint y guardas de aislamiento público. Detalles, compilación, límites y repetición segura en [entrega CMS](../../docs/owner-platform/cms-responsive-editorial-2026-09-07.md).
- Revisión independiente sin defectos introducidos críticos/importantes; comprobaciones reforzadas tras revisión. Pendiente: acceso natural por teclado al menú móvil y staging PostgreSQL/medios/correo/publicación. No equivale a CMS comercial finalizado.
- Reparto confirmado por Claude en Hub `e8998950-6d80-4cdb-acf9-be445c6e16f5`; respuesta Codex `46a52629-6230-4887-957a-0613c11bd06d`. Claude lee por sesión. Próximo paso Codex: teclado móvil y puertas operativas; público/dominio sigue en Claude.
