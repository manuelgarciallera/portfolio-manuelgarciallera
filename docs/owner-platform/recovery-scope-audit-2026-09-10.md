# Recuperación del CMS: alcance y siguiente puerta

Fecha: 2026-09-10. Codex. Base: `a3edc822808558d63f52bf5ed41a8259f714d9be`.

## Hallazgo y mejora

`tests/recovery/object-media-worker.mjs` usa `startMediaHTTPFixture` con
`previewRecoveryCollections`, no `fullOwnerConfig`. Incluye Media y los servicios
reales de capturas/auditoría, pero páginas y perfiles de marca son modelos mínimos.
La prueba no acredita recuperación del esquema completo del CMS.

Se amplía el ensayo existente: crea dos ediciones adicionales del borrador y
conserva un recibo JSON previo a la copia con el documento, todas sus versiones
y la marca. Después de `pg_restore`, otro proceso compara los datos leídos de la
base restaurada contra ese recibo. También compara el origen al terminar. Esto
detecta pérdida de historia o cambios de layout/marca que una imagen correcta o
una captura congelada no detectarían. No se modifica código de producción.

## Evidencia

- Ensayo previo: `node scripts/test-recovery-postgres.mjs --object-media`,
  PostgreSQL 17.11, salida 0 (5228c0). Recupera 3 revisiones/12 archivos, rechaza
  8 casos de copia dañada o incompleta antes de asignar destino, comprueba login,
  permisos, edición independiente y captura congelada; cierra procesos/sesiones
  y elimina solamente la carpeta sintética propia.
- Ensayo ampliado: 45 pruebas previas en 5 archivos y recuperación física
  satisfactoria (47bf3b): 3 versiones de página, estado editorial idéntico,
  3 revisiones/12 archivos y 8 rechazos de integridad. Origen y backup intactos;
  procesos, sesiones y carpeta sintética cerrados. La versión de aplicación del
  recibo identifica la base Git; estos cambios de pruebas aún no tenían commit
  al ejecutar el ensayo. No se ha inyectado pérdida de historial en esta ejecución.
- ESLint sobre los dos scripts: salida 0 (4dee6b).
- Frontera pública: 21 entradas, salida 0 (bdd6c9). Checkpoint original intacto.
- Revisión independiente de solo lectura: sin bloqueadores para el commit
  candidato; no ejecutó pruebas. Fin del ensayo ampliado: salida 0 (e689e3).

## Qué NO cierra esta prueba

- Recuperación con todas las colecciones, hooks y reglas del owner.
- Reconstrucción auténtica de archivos históricos legacy que ya no existen.
- Migración real, activación de proveedor o permisos del almacenamiento remoto.
- Copia externa cifrada, política de retención, RPO/RTO ni recuperación operativa
  del servicio en producción.
- No hay cambios visuales, despliegue ni nuevas dependencias públicas.

## Siguiente entregable de Codex

Un ensayo separado con `createOwnerConfig` completo, usando la infraestructura
de `tests/full-config-media.integration.test.ts` y el controlador PostgreSQL ya
existente. No reemplazar silenciosamente los fixtures reducidos compartidos.

Debe sembrar página/borradores, marca, medios, capturas, release y plan de
restauración; cerrar escritores; copiar base y archivos conjuntamente; abrir
otro proceso/base/proveedor; comparar documentos e historial completos; ejecutar
edición, previsualización y restauración editorial por las APIs autorizadas.
El catálogo de migraciones nativas debe validarse sin `push` de esquema sobre
datos existentes. Ningún ensayo sintético habilita por sí solo el cutover real.

## Coordinación y necesidad de Manuel

Reservas por Hub: `7efc04b3-6282-4104-b0f2-a1bb6a72df70` y
`38c77a0f-b072-4e5a-b28d-c0e2ffa27254`. Codex integra; Claude revisa por Hub.
Enviado no equivale a procesado o aceptado. Registro compartido fuera del commit
por contener cambios ajenos.

No hace falta intervención de Manuel para estas pruebas aisladas. Antes de
activar infraestructura real hacen falta acceso autorizado a los servicios y
aprobación de cualquier coste; no se solicitan contraseñas en el chat. La prueba
final de uso personal y revisión visual en su móvil sigue siendo independiente.
