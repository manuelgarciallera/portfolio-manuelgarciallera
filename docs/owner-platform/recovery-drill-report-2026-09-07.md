# Prueba local de recuperación física del CMS

Fecha: 2026-09-07. Implementador: Codex. Estado: **implementado y verificado localmente**. Commit de aplicación probado: `b7d22a65c242225d53541c6df3647051e5dc1aed`.

## Alcance y resultado

Se añadió `npm run test:recovery`, un harness acotado al `owner-platform`. Crea credenciales de owner y secreto Payload aleatorios en memoria, levanta un proceso Payload contra SQLite y medios sintéticos dentro de un directorio temporal nuevo, siembra y edita un borrador, cierra ese proceso, copia base y medios, verifica un manifiesto y arranca otro proceso Payload sobre una restauración distinta.

El recorrido final terminó con código 0. El backup contenía cinco ficheros: una base SQLite y cuatro PNG (original y tres derivados reales generados por Payload/sharp). Restauró dos versiones de la página. Tras el cierre del proceso de siembra se observaron cero ficheros `owner.db-wal`, `owner.db-shm` o `owner.db-journal`; el copiador incluye todo el directorio `database/`, por lo que cualquier sidecar presente tras un cierre futuro también formaría parte del conjunto emparejado y del manifiesto.

El manifiesto contiene únicamente `schemaVersion`, el SHA completo de la aplicación y, por fichero, ruta relativa, tamaño y SHA-256. No contiene credenciales ni configuración secreta. La restauración verifica esquema, rutas, duplicados, tamaños, hashes y coincidencia exacta del inventario antes de crear el directorio destino. Tanto un fichero ausente como uno alterado se rechazan en los tests de helper; el recorrido completo corrompe una copia del medio y comprueba que el destino inválido no llega a crearse.

## Recorrido ejercitado

Las `workflowChecks: 12` que imprime el runner son doce agrupaciones del harness, no doce casos Vitest independientes:

1. Filtrado del entorno heredado y reemplazo de variables sensibles por valores vacíos en los procesos.
2. Creación y login del owner sintético, con sesión autenticada.
3. Creación del borrador y posterior edición de título, texto y orden de bloques.
4. PNG sintético en disco y tres derivados reales.
5. Relación de página a medio y a colocación.
6. Colocación base de escritorio y overrides distintos para móvil y tablet.
7. Rechazo de lectura anónima del borrador de origen, acreditado únicamente por `Payload.NotFound` con estado 404; cualquier fallo distinto se relanza.
8. Historial real de dos versiones antes de la copia.
9. Salida real del proceso de siembra antes del inventario y la copia de base/medios.
10. Manifiesto emparejado con SHA-256, tamaño y commit, y rechazo previo de la copia corrupta.
11. Nuevo proceso contra el restore: login, campos/orden, relaciones, placement, versiones, hashes de original/derivados y nuevo `NotFound` 404 anónimo.
12. Edición del borrador restaurado, comprobación del título exacto devuelto y ausencia de cambios en los hashes de la fuente y del backup.

Los siete casos Vitest incluyen cuatro pruebas del helper con disco real —copia/restauración independiente, rechazo de fichero ausente, rechazo de fichero corrupto y negativa a sobrescribir un destino existente— y tres del control anónimo: aceptar `Payload.NotFound` 404, relanzar intacto un fallo inesperado de persistencia y fallar si la lectura devuelve un documento.

## Evidencia exacta

TDD del helper:

- Rojo: `node node_modules/vitest/vitest.mjs run --config vitest.recovery.config.ts tests/recovery/backup-manifest.test.mjs` → salida 1; el módulo `./backup-manifest.mjs` todavía no existía.
- Verde: el mismo comando → salida 0; 1 fichero y 4/4 tests.
- Rojo de regresión de revisión: `node node_modules/vitest/vitest.mjs run --config vitest.recovery.config.ts tests/recovery/anonymous-draft.test.mjs` → salida 1; el helper acotado `./anonymous-draft.mjs` todavía no existía.
- Verde de regresión: el mismo comando → salida 0; 1 fichero y 3/3 tests. Un `Error('database unavailable')` se relanza por identidad y no cuenta como denegación de acceso.

Ejecución final sobre el commit de aplicación, desde `owner-platform`, con valores señuelo no secretos definidos en `DATABASE_URL`, `PAYLOAD_SECRET`, `OWNER_BOOTSTRAP_SECRET`, `FIGMA_PERSONAL_ACCESS_TOKEN` y `SMTP_PASS`:

```powershell
$env:DATABASE_URL='postgresql://ambient.invalid/never-used'
$env:PAYLOAD_SECRET='ambient-secret-must-not-be-used-000000000000'
$env:OWNER_BOOTSTRAP_SECRET='ambient-bootstrap-never-used'
$env:FIGMA_PERSONAL_ACCESS_TOKEN='ambient-connector-never-used'
$env:SMTP_PASS='ambient-mail-never-used'
npm run test:recovery
```

Resultado: salida 0. Vitest: 2 ficheros, 7/7 tests. Resumen del runner:

```json
{
  "recovery": "passed",
  "helperTests": 7,
  "workflowChecks": 12,
  "applicationCommit": "b7d22a65c242225d53541c6df3647051e5dc1aed",
  "backupFiles": 5,
  "databaseSidecarsIncluded": 0,
  "mediaFilesVerified": 4,
  "pageVersionsRestored": 2,
  "ambientCredentialsIgnored": true
}
```

Verificaciones adicionales:

- `npm run lint` → salida 0.
- `npm run typecheck` → salida 0.
- `git diff --check -- owner-platform/package.json owner-platform/scripts/test-recovery.mjs owner-platform/tests/recovery owner-platform/vitest.recovery.config.ts` → salida 0.

Payload mostró su aviso esperado de que no hay adaptador de email. El harness no invoca ninguna operación de correo, conector ni proveedor, y no realizó llamadas de red. No leyó `.data/`, `media/`, credenciales ni datos habituales del owner: las únicas credenciales, la base, la imagen y las rutas de medios fueron sintéticas y nacieron dentro del proceso/prueba.

## Arranque, cierre y temporales

El worker registra primero un handshake IPC `ready`; el padre solo entonces envía credenciales y rutas. El padre resuelve una fase únicamente tras recibir el resultado y el evento real `close`. Por tanto, el inventario y la copia se ejecutan después de `payload.destroy()`, cierre del cliente libSQL y salida del proceso de siembra. La restauración arranca en un segundo proceso.

Durante el desarrollo se diagnosticó que `node --import tsx` tardaba aproximadamente 85 s solo en `import('payload')`, frente a 5,6 s con Node sin ese loader, y provocaba el timeout inicial. La solución final compila únicamente el código local del worker a un bundle temporal con paquetes externos y lo ejecuta con Node normal; no añade dependencias. También se corrigió el ciclo de timeout para esperar `close` y conservar el error original antes de limpiar.

El directorio temporal vive bajo `owner-platform/node_modules/.cache/owner-physical-recovery-*`, ruta ya excluida de Git, ESLint y Vitest. Se elimina únicamente esa raíz creada por `mkdtemp` y solo cuando no queda ningún worker activo. Tres raíces de los intentos fallidos iniciales se identificaron y borraron por sus rutas exactas después de confirmar el cierre de los procesos; la comprobación posterior encontró cero raíces retenidas y cero procesos Node del harness.

## Límites y puertas pendientes

Esta evidencia prueba recuperación física local de un fixture SQLite y medios de disco con la versión actual de Payload. **No** certifica PostgreSQL, object storage, backup remoto, retención, cifrado, control de acceso, rotación, restauración puntual, migraciones entre versiones, rollback del sitio completo, staging, publicación ni preparación de producción.

La siguiente puerta operativa requiere PostgreSQL disponible y debe usar la herramienta de backup consistente del motor, restaurar base y almacenamiento duradero emparejados en staging aislado, verificar permisos/cifrado/retención y repetir el recorrido editorial. También siguen pendientes el puente público controlado y su rollback completo.

El soporte de CV continúa pendiente: la colección `Media` acepta imágenes (`image/*`) y este hito solo prueba PNG. No se añadió carga de PDF ni enlace público a un CV.

## Archivos del hito

- `owner-platform/package.json`
- `owner-platform/scripts/test-recovery.mjs`
- `owner-platform/vitest.recovery.config.ts`
- `owner-platform/tests/recovery/anonymous-draft.mjs`
- `owner-platform/tests/recovery/anonymous-draft.test.mjs`
- `owner-platform/tests/recovery/backup-manifest.mjs`
- `owner-platform/tests/recovery/backup-manifest.test.mjs`
- `owner-platform/tests/recovery/payload-worker.mjs`
- `docs/owner-platform/recovery-drill-report-2026-09-07.md`

No se modificaron dependencias, lockfile, runtime público, diseño público, dominio, correo, datos reales ni servicios externos. No hubo push ni despliegue. El controller conserva la actualización separada de `completion-audit-2026-09-05.md` y de la documentación compartida.
