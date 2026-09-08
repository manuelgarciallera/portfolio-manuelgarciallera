# Inventario previo a migración de medios legacy

Base: `caec55c`. Continúa el procedimiento `media-storage-rollout-2026-09-08.md`.
No activa almacenamiento ni modifica la biblioteca. Manuel autorizó continuar
sin preguntas repetidas; las decisiones de servicio externo, coste, migración
real y publicación siguen separadas.

## Problema y elección

El almacenamiento anterior conserva versiones de filas, no necesariamente sus
bytes. Nombre, dimensiones y tamaño coincidentes no prueban la identidad de un
archivo histórico. Un inventario basado solo en la fila actual perdería además
borradores, papelera y capturas congeladas.

Se elige un inventario observacional de solo lectura antes de construir el
ejecutor de migración. Inferir historia por nombre sería incorrecto; migrar solo
la fila actual ocultaría las referencias pendientes. El inventario no resuelve
esas pérdidas, las hace explícitas para reconciliarlas con copias auténticas.

## Contrato

- Sin escrituras, borrado, descarga por URL, modificación de filas/versiones/
  snapshots, transporte nuevo, configuración activa, dependencia o dato real.
- Raíz local explícita, absoluta, existente y no raíz de volumen. Rechazar raíz
  enlazada o cuya resolución real no corresponde a la solicitada. Raíz y padres
  bajo control del operador; no prometer protección frente a mutación hostil
  simultánea ni ACL efectivas por comprobar solo paths.
- Lectura plana: no recorrer subdirectorios ni enlaces. Archivos especiales,
  enlaces simbólicos y duros se registran como inseguros, sin leer sus bytes.
- Límites: 10000 referencias, 16 variantes por referencia, 10000 entradas físicas,
  64 MiB por archivo, 1 GiB total de archivos regulares observados. Exceso aborta
  el informe, nunca devuelve éxito parcial. Hash secuencial por stream, sin cargar
  la biblioteca en buffers. Lectura compara identidad/tamaño/mtime antes y después;
  cambio observado aborta. Errores inesperados de IO se propagan.
- Identidad de referencia: kind document/draft/version/snapshot, documentId y
  referenceId estables; estado published/draft/trashed/unknown, revisión opcional,
  variantes con nombre y tamaño esperado cuando fueron capturados.
- Cada archivo actual válido informa tamaño y SHA-256 observados; una referencia
  histórica sin revisión permanece `historical-unverified` aunque exista un
  archivo del mismo nombre y tamaño. Ausencia, metadatos incompletos, tamaño
  distinto y nombre inseguro son incidencias explícitas. Nunca rellenar datos
  históricos desde la fila vigente.
- Referencias que ya tienen storageRevision válido son `versioned-not-inspected`:
  este lector legacy no acredita su raíz privada. Un valor malformado es una
  incidencia, no una referencia legacy silenciosa.
- Nombres compartidos entre documentos o colisiones de normalización/caso son
  incidencias. Variantes del mismo documento pueden apuntar al mismo archivo;
  no duplicar contabilidad física. Archivos sin referencia quedan inventariados,
  nunca etiquetados como autorizados para borrar.
- Informe versionado, orden determinista y hash de contenido; sin rutas absolutas,
  URLs, tokens, emails, alt/caption ni contenido editorial. `migrationReady:false`
  siempre: no constituye autorización ni prueba de snapshot consistente.

## Colección de referencias

Un servicio interno recibe Payload, request owner y raíz configurada por código,
no un endpoint público. Verifica owner antes de consultar BD o disco. Todas las
lecturas usan `overrideAccess:false`, request, depth 0 y orden/paginación explícitos.
Recorre filas Media incluyendo papelera, última vista draft, todas las versiones
retenidas y todas las capturas de preview. Valida hashes de snapshots antes de
consumir referencias; no muta las capturas. Identifica resultados truncados,
duplicados o paginación incoherente como fallo, no completa con datos actuales.

La colección no crea una transacción snapshot ni detiene escritores. Los ensayos
se ejecutan con fixtures quiescentes. En uso posterior, el operador deberá
quiescer el clon; ni una doble lectura ni un informe verde garantizan consistencia
de una biblioteca que está cambiando. No añadir todavía CLI, UI o rutas de acceso.

## Comprobación

TDD con archivos reales: hashes literales, ausencia, historia no verificable pese
a bytes coincidentes, colisiones, enlaces, tamaños, límites y cero modificaciones.
Después, integración con Payload real y datos sintéticos en SQLite/PostgreSQL:
reemplazo A por B, versión A, publicación/borrador/papelera y snapshot antiguo.
Comparar documentos/versiones/snapshots/archivos antes y después del inventario;
rechazar anónimo, usuario no owner y ACL de versiones denegada. No ajustar los
ensayos anteriores para aprobar esta nueva capacidad.

## Puertas posteriores

Este incremento produce el diagnóstico consumible por una futura migración en
clon; no asigna nuevas revisiones ni modifica referencias. Siguen pendientes
reconciliación histórica auténtica, migraciones versionadas, ensayo completo de
corte y rollback, persistencia/backup externo/permisos/coste, procedencia pública
y activación deliberada. CV/PDF y fuentes no entran en este alcance.
