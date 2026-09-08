# Revisiones de medios: procedimiento previo a activación

Estado: procedimiento revisable, sin migración ejecutada, proveedor elegido,
datos reales trasladados ni autorización de despliegue. El binding permanece
opt-in. La medición local y la recuperación sintética no hacen persistente el
alojamiento actual. Responsable de preparar y verificar: Codex/owner; Manuel
autoriza proveedor, coste, datos y corte real. Público/dominio/correo conservan
su carril separado.

## Raíz privada y permisos efectivos

Provisionar una raíz persistente de revisiones independiente de `public/`, de
`Media.upload.staticDir` y de todos los montajes estáticos/CDN. No basta que el
nombre del directorio diga «privado». El proceso de aplicación necesita leer y
crear revisiones; el servidor estático y otros usuarios del sistema no deben
leerlas. Verificar propietarios y ACL efectivos en el OS de destino, incluidos
padres, enlaces y copias. Los modos 0700/0600 solicitados por el núcleo no prueban
por sí solos los permisos efectivos de Windows. Las descargas deben atravesar
el endpoint que comprueba documento, revisión, archivo y publicación/permisos.

Probar con identidades distintas la lectura permitida y rechazada, rutas directas,
borradores, versiones históricas y retirada de publicación. Documentar volumen,
montajes, cuenta de servicio, permisos efectivos y persistencia tras reinicio y
despliegue. Evitar que un CDN conserve acceso cuando se retira una publicación.
Nada de esto se considera acreditado por el servidor loopback del benchmark.

## Copia y crecimiento

La unidad recuperable incluye la base de datos completa, **todos** los directorios
de revisiones (vigentes, históricos, huérfanos e intentos incompletos/vacíos),
sus manifiestos y el commit/configuración compatible. No filtrar por documento
vigente. Usar la recuperación revisada de `73a52f6` como evidencia sintética:
[resultados y límites](media-recovery-verification-2026-09-08.md).

Antes de copiar, detener escritores o usar un mecanismo de snapshot consistente
demostrado para la base de datos y los archivos juntos. SQLite abierto con WAL no
equivale a copiar únicamente `owner.db`; PostgreSQL necesita su backup consistente
y coordinación con las escrituras de medios. Inventariar rutas, tipo, tamaño y
SHA-256 de cada archivo y también directorios vacíos. Restaurar en una raíz y BD
vacías independientes, verificar manifiestos y referencias lógicas antes de abrir
la aplicación, y después probar lectura, permisos, histórico, preview congelada,
restauración y una edición nueva. Conservar origen y backup sin modificaciones.

Planificar copia externa cifrada, separación de credenciales, verificación periódica
de restauración, retención de backups y RPO/RTO acordados. Un commit o una copia
local no sustituyen backup externo. La frecuencia, proveedor y presupuesto siguen
sin decidir.

Contabilizar por revisión el original + cada derivado + manifiesto; sumar BD,
índices/versiones, huérfanos/incompletos y réplicas/backups. Registrar crecimiento
neto diario y número de revisiones nuevas por edición, bytes de descarga y picos
de solicitudes simultáneas. El máximo de 64 MiB es por revisión, no por biblioteca
ni por proceso. Estimar coste a partir de esas series y las cuotas reales elegidas;
no extrapolar un único conjunto sintético a una tarifa o capacidad comercial.

## Inventario y retención sin borrado por inferencia

Primero producir un inventario de solo lectura. Cruzar cada revisión física con:
documentos vigentes y borradores, papelera, todas las versiones guardadas y las
referencias exactas de snapshots congelados. Registrar referencias entrantes y
los directorios completos/incompletos sin referencia. Clasificar una revisión
como huérfana no autoriza a borrarla: puede proceder de una escritura fallida o
de una referencia que el inventario aún no entiende.

El límite documental actual de versiones no constituye una política física de
retención. Antes de eliminar cualquier revisión, acordar ventana de conservación,
tratamiento de snapshots, backup recuperable y bloqueo/revalidación de referencias
durante la operación. Los casos incompletos o desconocidos requieren investigación.
Esta tarea no implementa recolección de basura ni borra biblioteca real.

## Migración primero en clon desechable

1. Capturar una copia conjunta verificada y abrir un clon aislado con raíces
   explícitas, credenciales sintéticas y sin transporte público. Inventariar todos
   los documentos, versiones y snapshots antes de cambiar metadatos.
2. Generar un archivo de mapeo por referencia exacta, sin ambigüedad ni reutilización
   de un nombre como identidad. Cada fila debe contener `collection`, `documentId`,
   `versionId` o `snapshotId` cuando exista, estado, variante, ruta antigua, nombre,
   tamaño, SHA-256, nueva revisión, ruta privada nueva y URL autorizada nueva.
   No ejecutar si falta un origen o hay nombres ambiguos.

| Elemento | Origen que debe registrarse exactamente | Destino que debe registrarse exactamente |
| --- | --- | --- |
| Original legacy | `<legacyStaticDir>/<filename>` + ID y hash | `<privateRevisionRoot>/<revisionUUID>/<filename>` con los mismos bytes/hash |
| Derivado legacy | `<legacyStaticDir>/<sizes.variant.filename>` + variante y hash | La misma revisión UUID, nombre y bytes exactos del derivado |
| Referencia documental/versionada | ID de fila/version y metadatos antiguos completos | `storageRevision` + metadatos verificados y enlace `/api/media/revision/<documentId>/<revisionUUID>/<encodedFilename>` |
| Snapshot congelado | ID, manifiesto y hash previos, más evidencia auténtica de los bytes capturados | Original inmutable conservado; resolución de medios separada y versionada, ligada a esa identidad/hash y revisada antes de incorporarla |

   Los marcadores de esta tabla son campos obligatorios del plan, **no un mapeo
   real ya resuelto**. Guardar los valores concretos del clon antes de aprobar el
   corte. La investigación del 8 de septiembre confirma que los snapshots rechazan
   mutaciones incluso desde la API Local privilegiada y que su hash cubre las
   referencias. Se retira la alternativa de transformarlos en el sitio: conservar
   el original y diseñar/revisar una resolución separada antes de implementar el
   corte. Esa resolución todavía no existe; véanse las
   [fronteras verificadas y el experimento siguiente](media-migration-boundaries-2026-09-08.md).
3. Crear revisiones usando bytes existentes completos, verificar SHA-256 y longitudes
   antes de actualizar referencias. Una versión antigua que apunta a bytes ya
   perdidos no puede reconstruirse desde los metadatos. No asignarle los bytes
   actuales ni regenerar derivados y llamarlos históricos. Marcar la pérdida y
   recuperar una copia histórica auténtica si existe; si no, la laguna permanece.
   Preparar el esquema y los mapeos antes de activar el binding: los documentos sin
   revisión quedarían sin URL con la configuración nueva. Las escrituras del adaptador
   deben usar una transacción dedicada realmente viva, no solo un transactionID;
   la implementación instalada puede volver a la conexión principal si la sesión
   terminó. Probar rechazo antes de escribir en ese caso. Los bytes preescritos
   quedan fuera del rollback SQL y se retienen/inventarían si este falla.
4. Verificar cada fila del mapeo, todas las referencias y la igualdad de bytes;
   ejecutar permisos HTTP, reemplazo, edición nativa, restauración histórica,
   snapshot congelado y backup/restauración completa del clon migrado. Revisar
   crecimiento, memoria, latencia y espacio de rollback en el alojamiento previsto.
5. Presentar resultados, mapeo concreto, fallos/lagunas, ventana sin escrituras y
   plan de rollback a Manuel. Solo con autoridad de corte aplicable preparar una
   copia fresca, congelar escrituras, repetir validación y activar el código
   compatible junto con la BD y las revisiones correspondientes. Verificar antes
   de reabrir escrituras. No se ha realizado este paso.

## Rollback y puertas abiertas

Definir como disparadores del rollback: referencias ausentes, hashes distintos,
fallo de permisos, recuperación fallida o consumo que incumple el presupuesto
acordado del destino. Volver **juntos** al commit/configuración, BD y medios de la
misma copia verificada. No hacer rollback solo del código dejando metadatos nuevos,
ni solo de la BD dejando archivos distintos. Si hubo escrituras tras el corte,
conservar una copia de ese estado y reconciliarlas mediante un procedimiento
aprobado antes de volver; no descartarlas por automatismo. Ensayar ambas direcciones
en el clon y registrar los tiempos reales.

Quedan abiertos alojamiento persistente, permisos efectivos, backup externo,
costes/cuotas, migración real, procedencia completa del aislamiento, activación del
binding y puente de contenido público. PDF/CV y fuentes tienen validación posterior
propia. Un [benchmark local aprobado](media-resource-verification-2026-09-08.md)
no equivale a CMS terminado, reparación de la biblioteca activa ni aprobación de
publicación.
