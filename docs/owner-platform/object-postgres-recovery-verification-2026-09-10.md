# Recuperación PostgreSQL y objetos en procesos separados

Codex · 2026-09-10 · base `d116c8d` · reserva Hub `dd5a39a6`.

## Implementación del ensayo

`owner-platform/scripts/test-recovery-postgres.mjs --object-media` amplía el controlador existente. Requiere `OWNER_POSTGRES_BIN` apuntando a herramientas PostgreSQL locales; no utiliza bases ni credenciales ambientales. No admite combinar `--versioned-media` y `--object-media`.

Reutiliza el clúster SCRAM aislado en loopback, `pg_dump` custom, manifiesto físico y `pg_restore --single-transaction` hacia una DB nueva. Los workers de Payload y su proveedor HTTP S3 sintético terminan antes de copiar; se consulta `pg_stat_activity` para exigir cero sesiones de Payload. Cada worker nuevo empieza con proveedor vacío e importa paquetes verificados mediante el SDK real.

La recuperación conserva login owner, UUID, ocho archivos de dos revisiones, autorización pública/histórica, restauración nativa REST y edición nueva. Un tercer worker comprueba la fuente: vuelve a importar los paquetes en otro proveedor vacío, compara campos seleccionados de Media/versiones y verifica hashes HTTP, sin restaurar versiones ni editar. Se comprueba también que los archivos de origen y backup no cambian.

Antes de crear DB o directorio destino se rechazan ocho daños: dump, original, derivado y manifiesto de revisión, cada uno ausente o corrupto. El cierre verifica que se detiene exclusivamente el clúster de este ensayo antes de retirar sus datos sintéticos.

## Evidencia y correcciones

- RED inicial: worker solo SQLite rechazó `databaseDirectory` ausente bajo entrada PostgreSQL. Se añadió el adaptador correspondiente y cierre del pool mediante finalización del hijo, comprobada además por el padre.
- Revisión independiente detectó campos `undefined` que IPC JSON elimina. Ambos ensayos confirmaron la diferencia en `version.id`; se normalizaron campos opcionales a `null`, sin cambiar las comparaciones exigidas.
- Revisión posterior: hallazgo cerrado, sin nuevos pendientes.
- SQLite repetido después del cambio: correcto, dos revisiones/ocho archivos, seis daños rechazados, login/historial/edición.
- Lint y TypeScript finales: salida 0. Auxiliares ejecutadas por el controlador: 45/45.
- PostgreSQL 17.11 final: salida 0, 11 archivos en backup, ocho medios verificados, dos revisiones, ocho daños rechazados antes de asignación, login/historial/edición correctos. Cero sesiones antes del dump y tras los workers; shutdown verificado y retirado solo el directorio sintético del ensayo.

## Alcance

QA de Users/Media con proveedor S3 sintético y SDK real. No certifica Neon/R2, IAM, red externa, recuperación de región, esquema completo de la aplicación, backups operativos ni aislamiento multi-tenant. La comparación lógica cubre los campos seleccionados y versiones de la fixture, no toda la DB. El inventario de revisiones aún procede del seed, no de un recolector completo de referencias.

Sin cambios runtime, dependencias, visuales, push ni despliegue. No se repite el build de aplicación: solo cambian herramientas de ensayo. Siguiente Codex: inventario de revisiones referenciadas (actuales, versiones y capturas) para convertir esta recuperación probada en un flujo operativo gobernado.
