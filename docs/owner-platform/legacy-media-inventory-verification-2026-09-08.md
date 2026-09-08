# Verificación del colector Payload de medios legacy

Fecha: 8 de septiembre de 2026. Base de la tarea: `bb2e5fa`. El documento de
decisiones del controller se añadió después en el commit concurrente `180eef5`;
no forma parte de la implementación de este incremento.

## Resultado

Se añadió un servicio interno que exige una petición autenticada del owner,
rechaza cualquier `transactionID` antes de consultar Payload o el disco y recoge,
con `overrideAccess:false`, las vistas publicada y draft de Media, todas sus
versiones retenidas y todos los snapshots de preview. Cada origen usa páginas de
100 elementos, `depth:0`, orden por `id` y validación estricta de totales,
continuidad y duplicados. Una fuente no puede declarar más de 10.000 filas y el
límite final de 10.000 referencias se comparte entre todos los orígenes.

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

## Evidencia ejecutada

- TDD unitario enfocado final: `19/19`, salida `0`. Cubre rechazo owner/transacción
  antes de IO, opciones exactas, páginas múltiples y malformadas, duplicados,
  página detenida, límites por fuente y globales, relaciones pobladas, snapshot
  corrupto, almacenamiento contradictorio y ausencia de backfill.
- Fixture SQLite enfocado final: `3/3`, salida `0`. Cubre inventario real,
  rechazo anónimo/no-owner, `transactionID` intacto y denegación real de
  `readVersions`. El fixture acepta primero la forma de paginación vacía que
  devuelve Payload.
- Unitarias owner completas: `146` archivos, `877/877`, salida `0`.
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
