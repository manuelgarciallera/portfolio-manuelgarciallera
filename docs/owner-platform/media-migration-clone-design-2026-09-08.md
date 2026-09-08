# Ensayo de migración de medios sobre un clon

Base: `52ece5c`. Continuación autorizada del CMS, sin publicación ni biblioteca real.

## Decisión

Ensayar el recorrido completo `legacy → preparado → versionado` antes de crear un
escritor general. Se descartan una activación directa (documentos sin URL) y una
reescritura de snapshots (rompe identidad/hash). La prueba conserva el original
congelado y usa una resolución separada **solo experimental**.

El ensayo es código de QA conservado, no una migración disponible para el owner.
Reutiliza Payload, adaptadores, binding, revision-store, copias verificadas y
workers existentes. No añade dependencias, rutas públicas ni configuración activa.

## Recorrido y evidencia exigida

1. Crear owner sintético y Media legacy sin storageRevision. Subir A roja 1920×1200,
   capturar snapshot real, guardar físicamente original y tres derivados auténticos
   antes de sustituir por B azul con el mismo filename. B mide 1920×1440.
2. Cerrar completamente los escritores. Copiar BD y todos los archivos mediante
   las herramientas verificadas de recovery. Conservar hashes de origen y backup.
3. Reabrir únicamente clon con esquema preparado (campo storageRevision opcional,
   sin binding). Demostrar IDs, número de versiones, timestamps, metadatos y snapshot
   idénticos excepto el campo añadido nulo/ausente. No usar push destructivo en origen.
4. Preescribir revisiones A/B desde las copias auténticas, verificando todos los
   nombres y SHA-256. No regenerar derivados para inventar historia.
5. Transacción dedicada: patch de revisión de fila vigente y cada versión mediante
   adaptador, manteniendo su sobre completo. Resolución de snapshot separada ligada
   a ID/hash/media/archivo; snapshot original y su hash permanecen intactos.
6. Inyectar error tras escritura parcial: comprobar rollback de filas, versiones y
   resolución. Los archivos preescritos sobreviven e inventarían; no borrar huérfanos.
   Un request con sesión cerrada debe rechazarse antes de una escritura fuera de SQL.
7. Activar binding solo en clon preparado. Comprobar B actual, restauración A y
   todos sus bytes/RGB/dimensiones, permisos de descarga owner/anónimo y nueva edición C.
8. Restaurar otra copia anterior: volver a legacy y verificar evidencia original.
   Al finalizar, origen y backup no han cambiado. Un fallo conserva evidencia y
   no limpia mientras existan procesos vivos.

## Alcance de verificación

SQLite y PostgreSQL aislados, sin credenciales ambientales. Para PostgreSQL se
reutiliza cluster recovery con owner_source/owner_restored y pg_dump/pg_restore.
Si la preparación de esquema o la API no mantiene invariantes, registrar el fallo
real y corregir el ensayo o el contrato antes de avanzar; no retirar aserciones
para obtener verde. No declarar migración comercial ni portabilidad por un motor.

## Riesgos y límites

Las APIs internas del adaptador están ligadas a la versión instalada. La resolución
experimental no es un nuevo contrato público. El corte real necesita inventario
completo, evidencia histórica disponible, backup externo, persistencia, permisos y
autorización independiente. Este ensayo no cambia datos personales ni el CV.
