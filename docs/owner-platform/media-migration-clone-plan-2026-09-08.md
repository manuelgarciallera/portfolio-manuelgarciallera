# Media migration clone implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Ejecutar y verificar una migración legacy/preparado/versionado completa en clones sintéticos, sin activar la biblioteca real.

**Architecture:** Harness QA aislado con workers y copias físicas existentes. Configuración legacy, preparada y versionada sobre el mismo clon; transacción y resolución separada experimentales. Comparación de filas y bytes antes/después.

**Tech Stack:** Payload y adaptadores SQLite/PostgreSQL instalados, Node, esbuild, sharp, herramientas recovery existentes.

**Spec:** `docs/owner-platform/media-migration-clone-design-2026-09-08.md`

## Global Constraints

- Sin dependencias nuevas, rutas públicas, push, despliegue, biblioteca real, CV, correo, DNS o configuración activa.
- Credenciales sintéticas y loopback; no leer `.env` ni activos privados.
- Captura/hash originales inmutables; no reconstruir A desde B ni regenerar derivados históricos.
- Preservar IDs, timestamps, versiones y bytes; fallos SQL no borran revisiones físicas.
- Cerrar writers antes de copiar; limpiar solo raíz temporal validada y tras cierre observado.
- Reservar archivos propios; conservar cambios ajenos e índice compartido.

### Task 1: Ensayo físico completo y reproducible

**Files:**
- Create: `owner-platform/scripts/test-media-migration.mjs`
- Create: `owner-platform/tests/migration/media-migration-worker.mjs`
- Create if needed: `owner-platform/tests/migration/fixture-collections.ts`
- Create if needed: `owner-platform/tests/migration/transaction.ts` and its focused test.
- Create: `docs/owner-platform/media-migration-clone-verification-2026-09-08.md`
- No edición del binding activo ni de `src/payload.config.ts`.

**Interfaces:**
- Consume `runWorker(workerPath,input,cwd)`, `workersClosed()`, `safeEnvironment`, `createPhysicalBackup`, `restoreVerifiedBackup`, `snapshotFiles`, `createPostgresCluster`, `preflightTools`, `readMediaRevision`, `writeMediaRevision`, `createPagePreviewSnapshot`, binding real.
- Produce CLI `node scripts/test-media-migration.mjs` y `node scripts/test-media-migration.mjs --postgres`; salida 0 solo tras verificar todas las fases, recibo sin secretos con motor, commit, filas/archivos comprobados, cierre y resultado.

- [ ] Leer implementaciones recovery completas antes de reutilizarlas; registrar divergencias del spec antes de cambiarlas.
- [ ] Escribir el oráculo del recorrido antes del código de migración. Aserciones literales:
  ```js
  assert.deepEqual(await snapshotFiles(source), sourceBefore)
  assert.deepEqual(await snapshotFiles(backup), backupBefore)
  assert.deepEqual(capturedAfter, capturedBefore)
  assert.equal(current.alt, 'Synthetic B')
  assert.deepEqual(rgb(restoredA), [255, 0, 0])
  assert.deepEqual(dimensions(restoredA), [1920, 1200])
  assert.deepEqual(rowsAfterInjectedFailure, rowsBefore)
  ```
  `rgb` y `dimensions` son lecturas independientes de sharp; comprobar también todos los hashes de archivos originales/derivados guardados al crear A. Sin migración, exigir que falle la restauración de A por falta de revisión/bytes, no por import roto.
- [ ] Implementar mínimo sobre clon: preparar campo opcional sin binding, preescribir A/B, transacción dedicada y patches completos de documento/versiones. Resolución ligada a snapshotId/manifestHash/mediaId/filename en tabla QA separada; original intacto. Antes de cada escritura validar sesión viva; request obsoleto se rechaza y no toca filas.
- [ ] Ejecutar fallo después de patch parcial y confirmar rollback de filas/resolución y revisiones físicas conservadas. Implementar commit; activar binding en clon; probar descargas reales, restore A, nueva C y vuelta física al backup legacy.
- [ ] Ejecutar SQLite y PostgreSQL con log persistente saneado, no cambiar los timeouts sin justificar una causa. Reutilizar runner de workers para observación de cierre; no lanzar suites competidoras.
- [ ] Ejecutar lint de archivos nuevos y typecheck owner; pruebas focales de cualquier helper añadido. Escribir recibo y límites. Commit explícito de archivos propios, sin stage general.
- [ ] Revisión independiente spec/calidad del incremento; resolver hallazgos antes de marcar la tarea completa.
