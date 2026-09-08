# Candidato conectado al ensayo físico del clon

Base `0022b42`. Cambio exclusivamente QA en
`tests/migration/media-migration-worker.mjs` y `scripts/test-media-migration.mjs`.
No se añade ejecutor operativo ni se activa `src/payload.config.ts`.

## Incremento, no repetición del ensayo cerrado

El ensayo anterior verificaba retención, migración sintética y recuperación sin
usar los tres módulos nuevos de candidato/cobertura/bytes. Ahora los ejerce juntos
antes del primer `patchAllRows` sobre el clon preparado:

1. Consulta el inventario con `inspectPayloadLegacyMedia` y una sesión owner real
   del fixture, sin transacción activa. Incluye documento, versiones y captura.
2. Construye un candidato usando los archivos A/B auténticos conservados antes
   de sobrescribir el nombre legacy. Cada archivo se identifica dentro de su
   revisión; la versión histórica A y la captura resuelven A, la vigente B resuelve B.
3. Liga cobertura al inventario y contrasta físicamente el conjunto de revisiones.
4. Rechaza tres candidatos: sin captura, con pin discordante y con SHA histórico
   falso. El tercero pasa cobertura de metadatos y falla al leer los bytes.
5. Comprueba filas y archivos de revisiones intactos tras esos rechazos; vuelve a
   consultar el inventario y exige el mismo hash antes de la transacción QA.
6. Continúa el recorrido existente de fallo parcial/rollback, sesión obsoleta,
   commit del clon, ACL HTTP, restore A, edición C y vuelta a legacy desde backup.

El controlador exige **4 referencias, 13 variantes y 8 archivos físicos**,
derivando cardinalidades del seed y no del recibo que comprueba. Publica digest
del candidato y comprobaciones en la salida del ensayo. `canApply` permanece false.

La asignación de evidencias es deliberadamente específica del fixture A/B y
rechaza identidades desconocidas. No es un resolutor genérico de evidencia
histórica. `patchAllRows` sigue siendo una mutación QA explícita, no un intérprete
productivo del candidato. No se genera un permiso a partir del recibo.

## Alcance de la confianza

La raíz, credenciales y datos se generan para este ensayo. Sus workers son los
únicos escritores de esas copias; se comprueba cierre antes del backup y de cada
reapertura, y sesiones Payload cerradas en PostgreSQL. La huella se obtiene dentro
del clon preparado, se conserva en memoria y se vuelve a contrastar. No hay aquí
un pin autenticado persistente, backup ligado criptográficamente al candidato,
freeze distribuido ni corte de la biblioteca real.

Los digests difieren entre motores/ejecuciones porque los IDs de revisión del
fixture son nuevos. Se comparan cobertura, bytes y comportamiento, no se exige
igualdad artificial de hashes entre bases independientes.

## Evidencia

TDD de integración: se añadió primero la puerta del controlador. SQLite 80230
salió 1 al recibir `candidateProof: undefined` del worker anterior, tras la fase
preparada. Este RED demuestra la falta de integración, no una nueva reproducción
del defecto legacy. Su raíz diagnóstica queda conservada en
`owner-platform/node_modules/.cache/owner-media-migration-igdC4Y`; no se borra para
ocultar el fallo. Workers cerrados antes de la decisión de retención.

SQLite actualizado, sesión66035, salida0:

- 4 referencias, 13 variantes, 8 archivos físicos; tres rechazos ejercidos.
- Digest `96f8eed8c8943a542170e9bf1d9f2cebbaab1c11002aa6d7de9ebcb609af73da`.
- 3 filas legacy comprobadas, 12 descargas verificadas y 13 archivos en backup.
- Origen y respaldo intactos; rollback y rechazo de sesión obsoleta correctos.
- Workers cerrados; solo la raíz nueva de esta ejecución exitosa eliminada.

La salida identifica el HEAD base `0022b42`: los dos cambios QA eran todavía
delta local. No se atribuye el nuevo resultado al contenido antiguo sin ese delta.

Lint focal y helpers de migración, sesión71812: salida0, **11/11** en dos archivos.
Typecheck33414 salida0. Frontera pública: **21 entradas**, salida0.
Revisión independiente estática de ambos diffs: sin hallazgos; no ejecutó pruebas
ni modificó archivos. PostgreSQL 17.11, sesión2846, salida0:

- 4 referencias, 13 variantes y 8 archivos; los tres rechazos ejercidos.
- Digest `453a554db86c17664a50ce16aebf8b0dc7229e6d2d255c780e798f8d4e23c71f`.
- 3 filas legacy y 3 filas de origen comprobadas, 12 descargas y 13 archivos en backup.
- Origen y respaldo intactos; rollback y sesión obsoleta comprobados.
- Workers cerrados, cluster exacto detenido y solo la raíz de esta ejecución exitosa eliminada.
- El HEAD emitido sigue siendo la base `0022b42` más el delta QA descrito.

Sin repetición de UI/build o
suite unitaria global, porque el delta modifica solamente el arnés QA.

## Coordinación y siguiente responsable

Reserva Hub `46efebde-479d-4d60-90e5-57d598017a73`, enviada a Claude; no inferir
recepción o aceptación. Despertar09:54UTC, ventana original sin ampliación.

Próximo Codex: diseño operativo del pin, respaldo y escritores detenidos; antes
de un ejecutor, decidir cómo se autentican y conservan esas pruebas fuera de la
memoria de un fixture. No trasladar este mapeo QA a producción mediante un flag.
Checkpoint y trabajo ajeno preservados; sin push/despliegue, costes, correo/DNS,
cambios visuales o medios reales.
