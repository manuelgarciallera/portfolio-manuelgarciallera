# Fronteras reales para migrar medios del CMS

Base: `00e23c2`. Investigación y caracterización posteriores al inventario cerrado.
No hay escritor general, migración de datos reales ni activación del binding.

## Evidencia que cambia el siguiente paso

1. `src/collections/Media.ts` sigue sin campo `storageRevision`. El binding opt-in
   lo añade y desactiva el almacenamiento estático. En `revision-storage-binding.ts`
   las URLs de documentos sin revisión pasan a null. Activarlo antes de preparar
   todas las referencias dejaría imágenes existentes sin URL.
2. Ese binding rechaza la asignación de `storageRevision` por un caller. No se
   modificará el hook para que una edición ordinaria se convierta en una migración.
3. `PreviewSnapshots` rechaza update/delete tanto por ACL como por hooks. El hash
   del manifiesto incluye sus referencias. Añadirle una revisión cambia la captura
   y sus identificadores derivados; no es una conversión transparente.
4. La API instalada `payload.db.updateVersion` acepta identidad exacta y sobre
   `versionData`, incluido `version`. Drizzle usa el `req` transaccional igual que
   `updateOne`. Estas operaciones de adaptador no ofrecen la protección editorial
   de la API Local; no se expondrán como un endpoint owner genérico.
5. `@payloadcms/drizzle/dist/utilities/getTransaction.js` vuelve a la conexión
   principal cuando falta una sesión, aunque el request conserve transactionID.
   Por tanto, llevar ese identificador no prueba atomicidad. Un futuro ejecutor
   debe poseer la transacción, comprobar su vigencia y no reutilizarla después
   de commit/rollback; probar explícitamente la pérdida de sesión.
6. El runner oficial registra la migración dentro del mismo request/transacción,
   pero detecta esquemas generados mediante push y avisa de posible pérdida de
   datos. No se ejecutó `payload migrate` sobre la base local del usuario.
7. Los archivos quedan fuera de la transacción SQL. Las revisiones preescritas
   deben verificarse antes del commit y conservarse/inventariarse si este falla,
   nunca borrarse por deducir que están huérfanas.

Fuentes instaladas consultadas: `payload/dist/database/types.d.ts` (UpdateVersion),
`@payloadcms/drizzle/dist/updateVersion.js`, `updateOne.js`,
`utilities/getTransaction.js`, `migrate.js`; configuración y binding propios.
Investigación independiente `inspect_migration_boundaries`, de solo lectura.
Codex contrastó directamente getTransaction, updateVersion, migrate y los hooks.
No se presupone que estas APIs internas sean estables ante una actualización.

## Prueba añadida al contrato propio

Archivo: `owner-platform/tests/legacy-media-inventory.integration.test.ts`.
Reutiliza la captura real de A rojo seguida por sustitución B azul con mismo
nombre, owner autenticado, versiones y archivos físicos sintéticos existentes.

Para overrideAccess false y true, intenta actualizar la identidad de procedencia
y borrar la captura. Exige 403 en ambos casos y comparación exacta de la captura,
todas las filas/versiones/snapshots y hashes de archivos antes/después. El caso
true detecta una retirada accidental de nuestros hooks aunque las ACL continúen
denegando las mutaciones ordinarias.

Es caracterización del contrato existente, no una nueva capacidad de migración ni
una corrección de producción mediante TDD. Ningún código de producción cambió.
No se han duplicado las pruebas de funcionamiento interno del framework.

Verificación actual:

- SQLite focal: **5/5**, salida 0, 17.09 s; sesión 89589, chunk final 23fadf.
- ESLint del archivo: salida 0, sesión 21201, chunk final 0f23f1.
- TypeScript owner completo: salida 0, sesión 57820, chunk final 0da4b4.
- PostgreSQL: ejecución 73852 finalizada con resultado **no recuperable**: la salida
  terminal se truncó durante el cambio de contexto y el sondeo posterior devolvió
  `Unknown process id 73852`. No se conserva evidencia de exit code ni del total
  de pruebas; no se atribuye éxito ni un fallo de código. El control posterior no
  encontró los procesos registrados del runner/cluster ni carpetas de esa familia
  de ensayos, pero eso no demuestra que las pruebas pasaran. Confirmación cruzada
  pendiente; no se repitió automáticamente la suite para sustituir esta evidencia.
- Aviso conocido del fixture sin adaptador de correo conservado, sin supresión.
- Las 880 unitarias y la publicación anterior no se presentan como nuevas pruebas.
- Revisión independiente del delta por `inspect_migration_boundaries`: aprobada,
  sin hallazgos Critical/Important/Minor. Revisó código y documentación; no ejecutó
  las suites ni certificó PostgreSQL. No equivale a aceptación de Claude.

### Confirmación posterior, 8 de septiembre 04:59 UTC

Nueva ejecución explícita para cerrar la evidencia perdida, sin cambios de código
ni tolerancias: `npm run test:integration:postgres`, binarios existentes 17.11.
Sesión **38612**, chunk terminal **06e8a2**, salida **0**: **43/43** en cuatro archivos,
77.96 s de Vitest (incluye los cinco casos del inventario). Conexiones cerradas,
cluster exacto detenido y raíz sintética eliminada según recibo del runner.
La salida completa saneada se conserva en el workspace local de este ensayo.
Continúan los avisos conocidos de correo sin adaptador y los diagnósticos de
denegaciones intencionadas del fixture; no se ocultaron. El resultado de 73852
continúa desconocido: esta ejecución independiente no reescribe aquel histórico.

## Experimento siguiente antes de un escritor general

La propuesta resultante es un ensayo aislado con **dos estados reales del mismo
clon**, no solo con una colección que ya tenga el esquema final:

1. Crear legacy A, guardar originales y derivados auténticos de A, capturar preview,
   sustituir por B y cerrar escritores. Copiar juntos base y archivos verificados.
2. Reabrir solo el clon con esquema preparado, todavía sin activar almacenamiento;
   verificar que IDs, versiones, timestamps, hashes y capturas no cambiaron.
3. Preescribir revisiones verificadas A/B. Crear un mapeo exacto que distinga
   documento vigente, cada versión y captura por identidad y hash de origen.
4. En una transacción dedicada, escribir fila vigente y versiones mediante una
   migración revisada. Conservar la captura original y probar una resolución
   separada, append-only, ligada a snapshotId, manifestHash, mediaId y archivo.
   Esa resolución no demuestra autenticidad por sí sola: necesita bytes y evidencia
   de la copia histórica concreta. No reconstruir A desde B por tener igual nombre.
5. Inyectar fallo después de las escrituras parciales: comprobar rollback de filas
   y mapeo, archivos preescritos inventariados y ausencia de cambios en origen/backup.
   Probar también request con sesión cerrada: ninguna escritura fuera de transacción.
6. Activar binding solo en el clon preparado; demostrar B vigente, restauración A,
   bytes rojos reales, captura/hash originales intactos, permisos de descarga y
   una nueva edición. Ensayar vuelta conjunta al código/datos/medios anteriores.

Esto concreta la secuencia `legacy → preparado → versionado`. Una tabla de
resolución de capturas es una propuesta arquitectónica, no código incorporado ni
un nuevo permiso para modificar el histórico. El procedimiento anterior que
contemplaba transformar snapshots necesita revisión explícita contra esta evidencia.

La preparación comercial completa mantiene sus puertas: almacenamiento persistente,
ACL efectivas, backup externo, costes, puente público y autorización de corte.
Correo, DNS, CV, configuración activa y diseño público permanecen intactos.
