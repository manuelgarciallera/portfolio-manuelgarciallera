# Reapertura de una instancia CMS migrada · 2026-09-10

Base `df4c781`. Reserva Hub `62db07a6`. Codex único escritor. El turno previo fue progreso: corrección informativa de almacenamiento y pruebas.

Se amplía exclusivamente el ensayo PostgreSQL de baseline: tras instalar con migraciones nativas y `push:false`, guardar contenido y repetir migraciones, se destruye Payload y se crea otra instancia con clave, configuración y adaptador nuevos. Contra la misma base sintética, se comparan borrador, versiones, Media y registro de migraciones antes de repetirlas de nuevo. Los controles existentes de bytes y actualización legacy a columnas de objetos se conservan.

## Evidencia

- Antes de ampliar: dos casos legacy/objects correctos, `c7766a`, 19,21 s; cierre/limpieza `877a3e`, salida 0.
- Con reapertura: PostgreSQL 17.11 `8562c6`, dos casos correctos, 20,12 s, salida 0. Proceso de pruebas y sesiones cerrados, clúster detenido y solo su raíz sintética eliminada.
- Tipos y lint `ad807a`, salida 0. Revisión independiente de solo lectura sin bloqueadores. Detalle menor conocido: si destroy rechaza, el finally vuelve a intentar el cierre de esa instancia; se conserva el intento de limpieza y el fallo no cuenta como éxito.

No hay cambio de producción que requiera un ciclo RED/GREEN: es una ampliación de aceptación de comportamiento existente, no la corrección de un defecto observado. No se han ejecutado otra suite unitaria completa ni un build en este incremento exclusivamente de pruebas.

## Límites

Es una reapertura de instancias dentro del mismo proceso. El proveedor S3 de prueba sigue en memoria: no prueba reinicio del proceso, caída del proveedor, persistencia remota ni recuperación de desastre. Tampoco registra migraciones en el arranque público ni habilita objetos para datos legacy.

Siguiente Codex: ensayo de proceso independiente y revisión de las puertas de staging. Checkpoint y web pública preservados; sin datos reales, proveedor activado, costes, push o despliegue. Claude recibe evidencia por Hub, sin atribuir aceptación por silencio.
