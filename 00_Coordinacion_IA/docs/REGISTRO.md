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

## 2026-09-07 · Codex · L2 · Verificación Windows y dominio público

- **Base y alcance:** rama `codex/checkpoint-pre-editor-2026-09-04`, HEAD `4c65314`; los commits públicos `878d9ea`, `1b3ddb0`, `7207962`, `a8e8ec7`, `28c960b`, `eabcfd8`, `331418e` y `262eaa5` existen localmente. No se modificó código público ni `owner-platform`; los cambios visibles del árbol siguen siendo archivos sin seguimiento preexistentes.
- **Verificación Windows:** `npm run check:all` ejecutado en Windows. Pasaron guardas públicas (11/11), frontera pública, encoding, hero, responsive, lint, typecheck, `next build` (27/27 páginas estáticas) y presupuesto de bundle. El comando terminó con código 1 únicamente en `npm audit --omit=dev`: una vulnerabilidad moderada de `fflate` (`GHSA-px8p-9vwx-vf98`) en dependencias transitivas, versiones instaladas `0.6.10` y `0.8.2`; existe corrección, pero no se aplicó automáticamente ni se cambió el lockfile.
- **Dominio contrastado:** DNS público de apex y `www` devuelve `216.198.79.1`; MX permanece en `mx00.ionos.es` y `mx01.ionos.es`. Forzando la IP pública nueva, el apex responde 200 desde Vercel con HSTS y canonical del apex; `www` responde 308 al apex. El resolver/conexión local conservó temporalmente la IP anterior `217.160.0.244`, por lo que el acceso sin `--resolve` falló durante la propagación. Producción todavía no expone etiquetas JSON-LD normales en el `<head>` ni la CSP nueva; no se desplegó desde este turno.
- **Checkpoint y siguiente paso:** checkpoint local conservado; no push, despliegue ni cambio de dependencias. Claude debe revisar la evidencia y proponer el cambio mínimo de dependencia o justificar la aceptación temporal del hallazgo. Cualquier push, despliegue o publicación requiere la autoridad L3 aplicable y verificación posterior.

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

## 2026-09-07 · Codex · L2 · Contraste de investigación y dominio `.es`

- **Base:** HEAD `1205b56` en `codex/checkpoint-pre-editor-2026-09-04`, con `687f849` (ORCID/SEO) y la nueva ruta `/investigacion`. El ORCID `0009-0009-5893-0343` se contrastó con el registro público oficial y corresponde a Manuel García-Llera Añón.
- **Dominio:** los DNS públicos de `manuelgarciallera.es` apuntan a `216.198.79.1`; los MX siguen en IONOS. Apex y `www` responden 308 hacia `.com` al forzar la IP nueva.
- **Verificación Windows:** guardas, frontera, encoding, hero, responsive, navegación móvil, lint, typecheck y build pasaron; el build generó 28/28 páginas, incluida `/investigacion`. `check:all` se detuvo después en `check:public-bundle` porque `scripts/public-bundle-baseline.json` no incluye `/investigacion`. Medición actual: 150489 bytes raw, 48373 gzip, 7 archivos. La auditoría de dependencias no llegó a ejecutarse y el hallazgo conocido de `fflate` sigue sin resolver.
- **Revisión editorial:** se pide a Claude matizar como hipótesis y trabajo futuro las afirmaciones causales/concluyentes, la referencia a participantes y métricas, y la formulación de Research through Design. Son cambios de su carril público; Codex no modifica esos archivos.
- **Puerta:** Claude debe actualizar/revisar el baseline y el texto; después Codex repetirá `check:all`. No push ni despliegue.

## 2026-09-07 · Claude · L2 · Correo propio, presupuesto regenerable, fflate y matización de /investigacion

- **Base:** rama `codex/checkpoint-pre-editor-2026-09-04` sobre `49b4977`. Cinco commits en carril público: `6077b2f`, `f27a547`, `4838a81`, `b95b525`, `06d530b`. Sin tocar `owner-platform`, con trabajo de Codex en curso allí. Sin push ni despliegue. Mensaje del Hub `b2a51e7f-818e-43da-ade7-68063fb9a6b2`, pendiente de respuesta.
- **Correo:** el formulario devolvía 503 en producción por falta de transporte. Transporte primario SMTP contra el buzón propio, en `src/lib/mailer.ts`; Resend queda como conmutador por variable de entorno. Motivo medido: los MX del dominio ya son `mx00`/`mx01.ionos.es` y el SPF publicado es `v=spf1 include:_spf-eu.ionos.com ~all`, de modo que enviar desde ese buzón pasa SPF y DKIM sin tocar el DNS. Remitente siempre el buzón propio y visitante en `Reply-To`. Saneo de CRLF en cabeceras, tiempos de espera de 12 s, `runtime = "nodejs"`. `nodemailer` 10.0.1 sin dependencias transitivas. Pendiente: `npm install` en Windows y variables de entorno en Vercel, que son decisión y credenciales de Manuel.
- **Presupuesto de bundle:** la puerta no era `/investigacion` sino que el baseline solo podía escribirse a mano. `scripts/update-public-bundle-baseline.mjs` lo regenera desde los mismos manifiestos que la comprobación (`npm run bundle:baseline`, escribe solo con `-- --write`). `/investigacion` entra con la medición Windows de Codex (150489 B raw, 48373 B gzip); la lista de ficheros se deja vacía a propósito hasta la primera regeneración.
- **fflate:** hallazgo corregido, no aceptado. Alcance real comprobado antes de decidir: ningún módulo de `src` importa loaders de `three-stdlib` ni activos comprimidos, luego ningún ZIP no confiable alcanza `unzipSync` desde el público. `overrides` fija `fflate ^0.8.3` y `^0.6.11` dentro de `three-stdlib`; ninguna otra versión del árbol se mueve y la auditoría pasa a 0.
- **Revisión editorial aceptada:** cinco pasajes de `/investigacion` afirmaban como resultado establecido lo que sostiene un corpus acotado, o daban por existente trabajo empírico inexistente. La pregunta de investigación ya no presupone su respuesta; la continuidad objeto-interfaz es hipótesis; la línea 02 declara pendiente su diseño experimental.
- **Propuesta abierta:** `00_Coordinacion_IA/docs/HALLAZGOS.md`, banco de hallazgos pedido por Manuel para que la investigación recurrente tenga destino. Falta acordar con Codex el enganche en el ciclo del `PROTOCOLO`.
- **Verificación real:** `tsc --noEmit` limpio, `check:encoding` correcto, `npm audit --omit=dev --package-lock-only` sin vulnerabilidades. No verificado aquí: `lint` y `build`, porque este árbol tiene binarios de Windows y el montaje agota el tiempo del shell. `check:all` completo sigue correspondiendo a Codex en Windows.
