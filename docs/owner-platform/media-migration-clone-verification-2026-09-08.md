# Verificación del ensayo de migración de medios sobre clon

Fecha: 2026-09-08

Incremento QA: `5873b3f`

Alcance: ensayo sintético aislado; no activa la biblioteca real ni modifica `src/payload.config.ts`.

## Resultado

El recorrido `legacy → preparado → versionado` pasó sobre clones físicos SQLite y PostgreSQL. El ensayo crea A roja de 1920×1200 y sus tres derivados auténticos, sobrescribe el mismo filename con B azul de 1920×1440, copia origen y backup con escritores cerrados, reabre el mismo clon con esquema preparado, persiste revisiones A/B, migra documento y versiones dentro de una transacción dedicada y activa el binding solo en el clon.

La prueba negativa real ejecuta `restoreVersion` antes de la migración. Payload restaura los metadatos históricos de A, pero la lectura de bytes falla con `ENOENT` porque el filename vigente contiene B y los bytes originales de A ya no son reconstruibles. Ese fallo se observó antes de implementar la resolución; no depende de un import roto ni de comprobar únicamente un campo ausente.

Tras migrar, el ensayo verifica:

- `B.filename === A.filename`, el SHA-256 del original B difiere del de A y el píxel de B es `[0, 0, 255]`.
- SHA-256 y nombre del original y de los tres derivados auténticos de A y B.
- igualdad del sobre completo del documento vigente y de todas las versiones después del commit, retirando únicamente `storageRevision`, más una resolución QA separada ligada a `snapshotId`, `manifestHash`, `mediaId`, `filename` y revisión.
- rollback exacto de filas/versiones/resolución después de un fallo inyectado; las revisiones físicas preescritas se conservan.
- rechazo de una sesión obsoleta antes del callback de escritura y sin cambio de filas.
- descargas HTTP reales de B, restauración HTTP de A, bytes independientes de Sharp, RGB rojo y dimensiones 1920×1200.
- ACL por estado para original y tres derivados: B publicada vigente da 200 al owner y al anónimo mientras A histórica da 200/404; después del restore A pasa a publicada vigente con 200/200 y B histórica queda 200/404; C draft da 200/404.
- snapshot sin reescritura (`capturedAfter` igual a `capturedBefore`) y retorno a legacy desde otra copia física del backup.
- origen y backup físicamente intactos. PostgreSQL además relee al final las filas del `owner_source` vivo mediante el adaptador, sin login mutante.
- cierre de workers antes de cualquier decisión de limpieza; un éxito elimina únicamente la raíz temporal exacta, mientras un fallo conserva la raíz validada después de detener y comprobar el cluster PostgreSQL exacto.

## Corrección posterior a revisión

La ronda 1 corrigió la pérdida de evidencia I1 y los dos hallazgos menores M1/M2. La política PostgreSQL añade `retainRoot: true` sin cambiar el comportamiento por defecto: siempre comprueba el apagado y el cierre real de workers, pero omite la eliminación cuando el ensayo falló. SQLite aplica la misma decisión después de validar que la raíz es un directorio físico hijo exacto del cache.

Dos fallos inyectados después del backup físico demostraron la retención real:

- SQLite, chunk `0ca7ba`, exit 1: raíz `owner-media-migration-AEY0rw`, 28 archivos y 1.375.752 bytes; 0 workers del fixture vivos.
- PostgreSQL 17.11, sesión `59216`, chunk final `737c8c`, exit 1: raíz `owner-postgres-recovery-woqqRi`, 1.451 archivos y 52.077.728 bytes; `pg_ctl status` exit 3, sin `postmaster.pid`, 0 procesos del cluster y 0 workers vivos.

Ambas raíces diagnósticas permanecen deliberadamente en `owner-platform/node_modules/.cache/`. Las pasadas exitosas posteriores eliminaron solo sus propias raíces nuevas.

## Evidencia ejecutada

### Historial del oráculo legacy y límite de procedencia

El handle `72320`, salida 1, llegó después de seed legacy, copia y reapertura preparada, pero su salida visible solo registra la excepción deliberada que detenía una implementación todavía incompleta:

```text
node scripts/test-media-migration.mjs
Migration implementation intentionally absent after proving legacy A cannot be restored.
```

Ese handle no prueba por sí solo la restauración nativa. La reproducción directa se observó al fortalecer el oráculo durante la implementación (handle `41349`, repetido en `21728`): `restoreVersion` restauró la fila histórica, pero la lectura del original A produjo `ENOENT ... synthetic-migration.png`. La transacción de esa prueba se revirtió y luego se añadió la compensación exacta, solo de fixture, que repone B desde el archivo auténtico antes de continuar.

Los intentos anteriores que fallaron por configuración de Vitest o por ausencia del helper solo identificaron el arnés incompleto. La cronología conservada no demuestra una ejecución RED end-to-end del restore nativo anterior a todo código de migración; esta limitación se mantiene explícita y no se reconstruye retrospectivamente.

### GREEN final SQLite

Handle `96912`, salida 0:

```text
migration passed
engine sqlite
rowsVerified 3
originalAndDerivedFiles 8
downloadsVerified 12
backupFiles 13
preparedCloneReopened true
sourceFilesUnchanged true
backupFilesUnchanged true
rollbackVerified true
staleSessionRejectedBeforeWrite true
workersClosed true
```

### GREEN final PostgreSQL

PostgreSQL portable 17.11. Handle `25875`, salida 0:

```text
$env:OWNER_POSTGRES_BIN = (Resolve-Path 'node_modules\.cache\postgres-tools-17.11\unpacked\pgsql\bin').Path
node scripts/test-media-migration.mjs --postgres
migration passed
engine postgres
rowsVerified 3
sourceRowsVerified 3
originalAndDerivedFiles 8
downloadsVerified 12
backupFiles 13
preparedCloneReopened true
sourceFilesUnchanged true
backupFilesUnchanged true
rollbackVerified true
staleSessionRejectedBeforeWrite true
workersClosed true
```

### Helper, lint y tipos

Handle conjunto `73632`, salida 0:

```text
node node_modules/vitest/vitest.mjs run --config tests/migration/vitest.config.ts
1 file passed; 3 tests passed

node node_modules/eslint/bin/eslint.js scripts/test-media-migration.mjs tests/migration/media-migration-worker.mjs tests/migration/fixture-collections.ts tests/migration/transaction.ts tests/migration/transaction.test.ts tests/migration/vitest.config.ts

npm run typecheck
```

## Límites

- Es código QA conservado, no una API general de migración, un cutover ni una afirmación de portabilidad comercial.
- La tabla de resolución y el `push` de esquema existen solo dentro del clon descartable del fixture.
- La compensación posterior a la comprobación legacy es deliberadamente de prueba: restaura B desde su archivo auténtico después de demostrar que el restore legacy destruye el único filename vigente.
- En SQLite el origen vivo se demuestra intacto por snapshot físico exacto; las filas legacy completas se validan en el clon restaurado. Se evita reabrir el origen con login porque esa autenticación crea una sesión y mutaría el propio objeto observado. PostgreSQL sí añade lectura final no mutante de las filas del origen vivo.
- El corte real continúa requiriendo inventario, backup externo, autorización, persistencia y permisos independientes.
