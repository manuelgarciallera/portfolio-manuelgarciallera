# Ensayo de actualización del esquema de medios restaurados

Fecha: 2026-09-10. Base: `0cd8af0`. Solo base sintética local; no despliegue.

## Carencia confirmada

El adaptador activo PostgreSQL no tiene `prodMigrations` configuradas ni un catálogo de migraciones versionadas. Su implementación instalada solo hace schema push fuera de producción. Por tanto, un build verde o una prueba sobre una base nueva no demuestran que una instalación anterior pueda actualizarse. Las herramientas existentes de recuperación/media no sustituyen un historial de DDL.

## Candidato acotado

`owner-platform/database/migrations/20260910-restored-page-media.sql` añade la relación de Pages a PreviewSnapshots y su correspondiente columna de versiones, con índices y claves externas. Es un delta revisable fuera del directorio de autodescubrimiento de Payload: **no se ejecuta al iniciar, construir ni desplegar**.

No sirve para una base vacía. Presupone el esquema completo previo excepto estos campos, IDs integer, nombres de tablas actuales y ausencia de las nuevas columnas. Falla ante duplicación o divergencia; no oculta diferencias con IF NOT EXISTS. Usa una transacción, espera de bloqueo limitada a 5 s y sentencias limitadas a 30 s. El ejecutor debe tratar cualquier error como fallo y hacer ROLLBACK antes de reutilizar la conexión.

## Evidencia que aporta el ensayo

La fixture utiliza las colecciones reales, retirando únicamente el campo nuevo, el comando virtual y el hook de vinculación para construir un esquema anterior sintético. Guarda una página con bloque e imagen y sus versiones. El escenario PostgreSQL:

1. Confirma ausencia del campo en la tabla anterior.
2. Hace fallar el segundo ALTER de forma controlada; tras ROLLBACK, el primero tampoco permanece.
3. Ejecuta el SQL completo y verifica las claves externas contra referencias inexistentes.
4. Cierra y reabre con la configuración actual y `push:false`: no puede arreglar el esquema a escondidas.
5. Comprueba título, estructura, fecha de modificación, IDs/contenido de versiones y bytes de imagen conservados; vínculo histórico inicial null.

Revisión independiente Rawls: sin bloqueadores. No ejecución ni edición por el revisor.

TDD: RED `c40906` por ausencia de columna tras no aplicar migración; primer GREEN `4b0b98`. Ensayo ampliado junto al de restauración HTTP: 2/2, 35,30 s, PostgreSQL 17.11, conexiones cerradas y clúster eliminado por su controlador. Tipos y lint correctos; frontera pública 21 entradas. La prueba se omite expresamente en SQLite: no es una migración portable entre motores.

Repetición final con el conjunto completo: 57/57 integraciones, 9 archivos, 118,35 s. El controlador usa PostgreSQL 17.11, pero no se atribuyen todas las pruebas a ese motor: auth-unlock conserva su fixture SQLite explícita. Las respuestas de rechazo y errores registrados durante escenarios negativos son esperadas. No se repitieron build/browser: no se ha cambiado código de aplicación ni presentación en este delta.

## Antes de cualquier uso real

- Identificar la versión exacta de código, historial de migraciones y esquema de origen; comparar también restricciones e índices con el baseline definitivo.
- Obtener copia de BD y archivos y comprobar su restauración en un destino separado. Este ensayo no ejecuta pg_dump/pg_restore.
- Seleccionar explícitamente un único esquema aprobado en `search_path`; nunca ejecutar sobre un contexto de conexión desconocido.
- Ensayar el delta en esa copia real autorizada, con escritor único y publicación detenida; revisar preservación completa y capacidad de restaurar.
- Incorporarlo a un catálogo de migraciones completo y a una puerta de despliegue controlada. No activar prodMigrations con este delta aislado.
- No proporcionar un down destructivo que borre referencias históricas: decidir roll-forward o restauración coherente de código/BD/medios según el fallo.

El CMS sigue pendiente de baseline completo, proveedor de medios persistentes y staging. No se han migrado datos reales ni ampliado permisos o costes. Este trabajo no acredita el CMS listo para producción.
