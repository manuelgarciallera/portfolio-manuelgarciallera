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
- documento vigente, todos los sobres completos de las versiones y una resolución QA separada ligada a `snapshotId`, `manifestHash`, `mediaId`, `filename` y revisión.
- rollback exacto de filas/versiones/resolución después de un fallo inyectado; las revisiones físicas preescritas se conservan.
- rechazo de una sesión obsoleta antes del callback de escritura y sin cambio de filas.
- descargas HTTP reales de B, restauración HTTP de A, bytes independientes de Sharp, RGB rojo y dimensiones 1920×1200.
- ACL owner/anónimo para A, B y una nueva edición C; el owner recibe original y tres derivados y el anónimo recibe 404.
- snapshot sin reescritura (`capturedAfter` igual a `capturedBefore`) y retorno a legacy desde otra copia física del backup.
- origen y backup físicamente intactos. PostgreSQL además relee al final las filas del `owner_source` vivo mediante el adaptador, sin login mutante.
- cierre de workers antes de limpiar únicamente la raíz temporal exacta; PostgreSQL también confirma el apagado del cluster exacto.

## Evidencia ejecutada

### RED del recorrido

Comando focal del controlador SQLite, handle `72320`, salida 1:

```text
node scripts/test-media-migration.mjs
Migration implementation intentionally absent after proving legacy A cannot be restored.
```

La primera reproducción directa del efecto nativo se obtuvo durante la transición a GREEN (handle `41349`, repetido en `21728`): `restoreVersion` restauró la fila histórica, pero la lectura del original A produjo `ENOENT ... synthetic-migration.png`. La transacción de esa prueba se revirtió y luego se añadió la compensación exacta, solo de fixture, que repone B desde el archivo auténtico antes de continuar.

Los intentos anteriores que fallaron por configuración de Vitest o por ausencia del helper solo identificaron el arnés incompleto y no se contabilizan como la puerta RED funcional.

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
- La compensación posterior al RED es deliberadamente de prueba: restaura B desde su archivo auténtico después de demostrar que el restore legacy destruye el único filename vigente.
- En SQLite el origen vivo se demuestra intacto por snapshot físico exacto; las filas legacy completas se validan en el clon restaurado. Se evita reabrir el origen con login porque esa autenticación crea una sesión y mutaría el propio objeto observado. PostgreSQL sí añade lectura final no mutante de las filas del origen vivo.
- El corte real continúa requiriendo inventario, backup externo, autorización, persistencia y permisos independientes.
