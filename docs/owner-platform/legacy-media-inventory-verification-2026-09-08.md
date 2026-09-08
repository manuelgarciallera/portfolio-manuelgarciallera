# Verificación del colector Payload de medios legacy

Fecha: 8 de septiembre de 2026. Base de la tarea: `bb2e5fa`. El documento de
decisiones del controller se añadió después en el commit concurrente `180eef5`;
no forma parte de la implementación de este incremento.
La regla conservadora de evidencia retenida se registró además en el commit de
decisiones del controller `d45140d`; tampoco forma parte de la implementación.

## Resultado

Se añadió un servicio interno que exige una petición autenticada del owner,
rechaza cualquier `transactionID` antes de consultar Payload o el disco y recoge,
con `overrideAccess:false`, las vistas publicada y draft de Media, todas sus
versiones retenidas y todos los snapshots de preview. Cada origen usa páginas de
100 elementos, `depth:0`, orden por `id` y validación estricta de totales,
continuidad y duplicados. Una fuente no puede declarar más de 10.000 filas y el
límite final de 10.000 referencias se comparte entre todos los orígenes.

El colector consume y normaliza cada fila dentro de su página de 100 antes de
pedir la siguiente, sin retener documentos Payload completos de páginas
anteriores. Además del límite de referencias, un presupuesto conservador común
de 8 MiB cuenta los identificadores retenidos para validar la paginación y la
serialización UTF-8 de las referencias normalizadas. Se aplica antes de pedir la
página siguiente. Los valores conservados de nombre, tamaño y revisión deben ser
escalares, y se rechaza una fila con objetos anidados en esas posiciones; también
se aplica de forma temprana el límite ya existente de 16 variantes por
referencia. Son rechazos conservadores de metadatos legacy malformados, no una
afirmación de que esos datos puedan migrarse.

Las filas se proyectan de forma independiente: ningún nombre, tamaño, variante o
revisión se rellena desde la fila vigente. Los snapshots se consumen solo después
de verificar el hash canónico, el hash persistido y su procedencia. Una revisión
solo se considera versionada si el snapshot declara explícitamente
`storage:versioned` y contiene un UUID v4 válido; combinaciones contradictorias o
sin discriminador conservan una incidencia de revisión inválida. El resultado se
entrega al inspector físico ya verificado, que aplica los límites, hashing,
privacidad y diagnóstico de archivos de la primera tarea.

El fixture real y aislado crea PNG sintéticos: A rojo, captura de snapshot,
reemplazo con B azul bajo el mismo nombre, un draft y un registro en papelera. El
inventario encuentra los bytes B actuales. La versión A y el snapshot antiguo
siguen siendo `historical-unverified` aunque el nombre y tamaño coincidan; no se
presenta ese archivo actual como prueba de identidad histórica. La comparación
independiente antes/después conserva filas, versiones, snapshots, hash del
snapshot y SHA-256 de todos los archivos.

El oráculo de versiones captura directamente de la base sembrada las cinco parejas
`{documentId, referenceId}` y las compara exactamente con el resultado. También
comprueba el recuento literal de cinco y la asociación de padres esperada: dos
versiones para A/B, una para el draft y dos para el registro después enviado a
papelera. Así, una identidad omitida o sustituida no puede esconderse detrás del
recuento global de nueve referencias.

## Evidencia ejecutada

- TDD unitario enfocado anterior: `19/19`, salida `0`. Cubre rechazo owner/transacción
  antes de IO, opciones exactas, páginas múltiples y malformadas, duplicados,
  página detenida, límites por fuente y globales, relaciones pobladas, snapshot
  corrupto, almacenamiento contradictorio y ausencia de backfill.
- Fixture SQLite enfocado final: `3/3`, salida `0`. Cubre inventario real,
  rechazo anónimo/no-owner, `transactionID` intacto y denegación real de
  `readVersions`. El fixture acepta primero la forma de paginación vacía que
  devuelve Payload.
- Unitarias owner completas antes de la corrección final de consumo por página:
  `146` archivos, `877/877`, salida `0`. El controller ejecuta una nueva pasada
  completa sobre `c6746f6`; este documento no atribuye esa pasada hasta recibir
  su resultado.
- Integración SQLite completa: `4` archivos, `41/41`, salida `0`; el proceso hijo
  cerró y el runner padre retiró únicamente su raíz sintética después del cierre.
- Integración PostgreSQL 17.11 completa: `4` archivos, `41/41`, salida `0`.
  El runner confirmó SCRAM/loopback, cierre del proceso, cero sesiones restantes,
  parada del cluster exacto y retirada exclusiva de su raíz sintética.
- Lint owner completo y TypeScript `--noEmit`: salida `0`, sin diagnósticos.
- Frontera pública: `21` entradas, salida `0`. Presupuesto público: `10` rutas,
  salida `0`, sin ampliar el baseline. Esta comprobación usa los artefactos de
  build ya existentes y no constituye por sí sola una prueba completa de
  procedencia de un build nuevo; no se ejecutó un build público dedicado.

La corrección final de revisión está en `c6746f6`:

- RED del límite global antes de página 2: chunk `f424b7`, salida `1`; la página
  2 se solicitaba antes de descubrir 10.100 referencias normalizadas en la
  primera página. GREEN inicial: chunk `ad37d7`, `20/20`, salida `0`.
- RED de retención malformada: chunk `3551a8`, salida `1`, `2/22` fallos; un
  nombre anidado seguía llegando al inspector y 100 nombres grandes superaban
  el presupuesto solo después de pedir página 2. GREEN enfocado: chunk
  `81e1d3`, `22/22`, salida `0`.
- Unitarias exactas de las dos capas después de congelar el código: chunk
  `e99bed`, `2` archivos y `97/97`, salida `0`.
- SQLite real exacto: chunk `e22e96`, `1` archivo y `3/3`, salida `0`.
- PostgreSQL 17.11 exacto: sesión `26836`, chunk final `57f457`, `4` archivos y
  `41/41`, salida `0`; el runner confirmó cierre de proceso y sesiones, parada
  del cluster exacto y retirada exclusiva de su raíz sintética. La sesión
  anterior `92106`, chunk `aaed8a`, también terminó `41/41`, salida `0`, antes
  de incluir los ID de paginación en el mismo presupuesto; no sustituye la
  evidencia final.
- ESLint de los dos ficheros cambiados: chunk `d323fa`, salida `0`. TypeScript
  `--noEmit`: chunk `945ce4`, salida `0`.

Por alcance explícito no se repitieron recursos, recuperación, frontera pública
ni build público para esta corrección final. Las comprobaciones públicas citadas
arriba corresponden al incremento anterior y la corrección no toca código
público.

Payload emite el aviso esperado de que los fixtures no configuran adaptador de
correo. Las pruebas negativas ya existentes también registran errores operativos
esperados de rechazo de escritura. No se observaron advertencias nuevas
atribuibles al colector.

## Uso interno permitido

La raíz debe ser la copia sintética y explícita de un clon, y `req` debe ser la
petición de servidor autenticada ya existente. No se debe reutilizar una petición
de edición ni quitarle su transacción para hacerla pasar por una lectura.

```ts
import type { Payload, PayloadRequest } from 'payload'
import { inspectPayloadLegacyMedia } from './media/legacy-media-inventory-service'

export const inspectSyntheticClone = (
  payload: Payload,
  authenticatedReadRequest: PayloadRequest,
) => inspectPayloadLegacyMedia({
  payload,
  req: authenticatedReadRequest,
  root: 'C:\\isolated-fixtures\\synthetic-legacy-clone\\media',
})
```

Antes de invocarlo, el operador debe detener escritores sobre el clon y crear una
petición de lectura separada. El servicio no crea una transacción snapshot ni
demuestra consistencia frente a mutaciones concurrentes.

## Límites y puertas pendientes

Este resultado es un prerrequisito de diagnóstico de una futura migración en un
clon. No migra, renombra, elimina, descarga ni asigna revisiones; no activa un
proveedor, almacenamiento nuevo, endpoint, CLI o interfaz. Tampoco demuestra
permisos efectivos del alojamiento, backup externo, coste, retención, restauración
de un corte completo ni procedencia pública de activos.

En particular, un inventario verde no equivale a migración ejecutada, activación
del almacenamiento ni preparación del CMS para producción. Siguen pendientes la
reconciliación con copias históricas auténticas, migraciones versionadas, ensayo de
corte y rollback, persistencia externa y autorización deliberada de activación.
CV/PDF y fuentes quedan fuera de este alcance.

## Cierre del controlador

Sobre `c6746f6`, `npm test` owner terminó con **880/880** pruebas, 146 archivos,
99.88 s, salida 0 (sesión 13367, chunk final 2b5f2a). La revisión focal final
`fd4fb3c..c6746f6` confirma corregida la acumulación completa de snapshots, sin
nuevos Critical/Important. El aviso de correo del fixture sigue como mejora menor
diferida. [Entrega y puertas pendientes](legacy-media-inventory-handoff-2026-09-08.md).

La publicación pública autorizada posteriormente tiene su propio
[recibo](../deployment-2026-09-08.md), SHA y pruebas; no activa este almacenamiento.
