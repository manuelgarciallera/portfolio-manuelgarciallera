# CMS: entrega para auditoría de Claude y continuación temporal

Base al recibir la petición de Manuel: `66898fc`. Primer incremento nuevo:
`18d8b89`, candidato de migración de solo lectura. Producción pública permanece
en `b1512cc`; no se ha publicado el CMS ni modificado navbar/orbe desde este turno.

## Ruta de auditoría, sin reiniciar trabajo cerrado

1. `completion-audit-2026-09-05.md`: mapa funcional global. Contiene estados
   históricos; contrastar sus pendientes de medios con los informes posteriores.
2. `cms-responsive-editorial-2026-09-07.md`,
   `cms-keyboard-readiness-2026-09-07.md` y
   `workflow-panels-verification-2026-09-07.md`: editor, navegación y controles.
3. `media-increment-handoff-2026-09-08.md`: retención inmutable, acceso HTTP,
   recorte/duplicación y restauración física, todavía opt-in.
4. `legacy-media-inventory-handoff-2026-09-08.md`: inventario autorizado de
   documentos/borradores/versiones/capturas; observar no equivale a migrar.
5. `media-migration-clone-verification-2026-09-08.md`: ensayo sintético ya
   terminado en SQLite/PostgreSQL, incluyendo rollback y retención de evidencia.
6. `media-migration-artifact-design-2026-09-08.md`: siguiente arquitectura propuesta.

Priorizar recorrido del propietario, claridad de estados, permisos, integridad de
históricos y autonomía editorial. Para cada hallazgo: archivo/línea, reproducción,
severidad, estado local/publicado, cambio mínimo, prueba que lo cerraría y responsable.
No sustituir pruebas reales por una puntuación global ni recomendar funciones por
su novedad sin demostrar utilidad. Las observaciones discrepantes se conservan.

## Incremento de este turno

`owner-platform/src/media/migration-plan.ts` proporciona:

- `createMigrationPlan(input: unknown)`: valida y ordena referencias y evidencias,
  detecta correspondencias ausentes, duplicadas o ajenas, nombres inseguros y
  contradicciones entre los archivos de una revisión inmutable.
- `readMigrationPlan(serialized: string)`: limita JSON a 8 MiB, reconstruye el
  candidato y comprueba digest y campos derivados. No confía en `canApply`,
  `status` ni listas de ausencias aportados por el consumidor.

La entrada contiene `sourceInventoryHash`, `references` y `evidence`. Cada
referencia identifica clase/documento/versión y variantes; cada evidencia añade
filename, bytes, sha256, UUID de revisión y digest de evidencia. El mismo nombre
en dos revisiones puede representar bytes diferentes; dentro de una revisión no.

El resultado mantiene `canApply:false`. `blocked` significa faltan correspondencias
o no hay referencias; `awaiting-physical-verification` significa solo metadatos
coherentes. No significa `ready-for-clone-verification`, migración autorizada ni
prueba de autenticidad histórica. El hash no es una firma ni prueba de identidad.

Este es deliberadamente un subconjunto del diseño: no hay endpoint ni integración
con Payload, lector físico, prueba de cobertura del inventario congelado, backup,
versiones del adaptador o ejecutor. El consumidor futuro debe comprobar esas
condiciones desde fuentes autorizadas, nunca desde declaraciones del cliente.
IDs opacos acotados a ASCII alfanumérico, guion y guion bajo, 128 caracteres;
si un adaptador produce otro formato, requiere una adaptación explícita probada.

Prueba inicial sin módulo: error de importación, no se contó como prueba funcional.
Con scaffold explícito: 11 fallos funcionales por capacidad ausente. Implementación:
32/32 focales, lint y tipos correctos. Frontera pública 21 entradas correcta.
Suite completa inicial: 912/912 pruebas, 147 archivos, salida 0. La revisión
independiente detectó un problema importante: arrays con métodos sobrescritos o
accesores podían alterar la validación. También detectó dependencia del orden de
claves JSON en `missing` y caracteres de nombre no portables a Windows.

Los tres puntos se corrigieron con 10 regresiones que primero fallaron y después
pasaron: 42/42 focales, tipos y lint correctos. Los arrays se validan por
descriptores y se copian antes de operar; no se ejecutan sus getters/métodos.
La segunda revisión independiente verificó 27 casos adicionales, sin cambios de
archivos, y cerró los hallazgos sin nuevos críticos/importantes. Su alcance sigue
siendo solo metadatos, no ejecución ni comprobación física.

Cierre verificado: correcciones en `d4ceef7`, sobre `18d8b89`. Suite completa
repetida sobre ese contenido: **922/922**, **147 archivos**, salida 0, 78,34 s
(2026-09-08 09:59:44 hora local de inicio). `git diff --check` correcto para los
dos archivos. No se ha repetido build ni ensayo PostgreSQL en este incremento;
los resultados de clonación anteriores son históricos, no una ejecución nueva.

## Auditoría pública acotada

Chromium móvil 390×844, táctil y movimiento normal, en producción:
enlace de salto oculto en reposo (borde inferior -11,5 px) y visible con Tab
(y=16 px, foco efectivo). No reproducida aparición espontánea en ese perfil.
No quitar una capacidad de teclado para resolver un síntoma todavía no reproducido.

Captura privada `.tmp-screens/nude-gallery/mobile-hero-audit.png`: canvas listo,
orbe interfiere visualmente con parte de Manuel García y deja Llera en otra línea.
Enviado a Claude para corregir su carril y repetir 320/360/390/430, temas y fallback.
No se ha corregido desde Codex ni se extrapola una captura a todos los dispositivos.
Primer intento agotó networkidle; el segundo inspeccionó DOM/estado disponible.

## Coordinación y ventana temporal

- Paquete/reserva: Hub `4ed64dd8-8a6a-4254-9a9c-329c70eefb8d`.
- Evidencia móvil: Hub `bdfbf188-5c5d-45a2-9a27-831a10076164`.
- Revisión del diseño: Hub `98ae53cf-1858-42a6-af13-2bcc4e2cd4c7`.
- Avance y hallazgos de revisión: Hub `ce12d870-712b-49b8-8239-8c1ec529ee89`.
- Continuación `cms-avance-temporal-y-revisi-n-cruzada`, en esta tarea, cada
  30 minutos hasta 2026-09-08 15:45 UTC. Creación confirmada y fichero releído.
  Primer intento de creación rechazado por destino ausente; corregido mediante
  herramienta, no escribiendo configuración a mano. Todavía no hay una ejecución
  posterior observada; depende de host/aplicación/disponibilidad.

La bandeja habitual cada 15 minutos no se duplica. No se presupone acuse de Claude
ni comunicación permanente. Se preservan los tres documentos compartidos previamente
modificados, temporales y carpetas privadas. Sin push, despliegue, cambios de correo,
DNS, costes, datos reales ni nuevos paquetes en este incremento.

Próximo Codex: pruebas del verificador físico y vinculación al inventario congelado.
Revisar por separado la misma restricción de nombres Windows en `revision-store`:
no se ha ampliado este parche a ese módulo sin sus pruebas propias.
Próximo Claude: auditoría y corrección pública
con SHA y relevo explícitos. Puertas operativas aún abiertas: almacenamiento
persistente, recuperación de cuenta, avisos owner, puente público y pruebas reales
de conectores. El CMS no se declara todavía producto comercial terminado.
