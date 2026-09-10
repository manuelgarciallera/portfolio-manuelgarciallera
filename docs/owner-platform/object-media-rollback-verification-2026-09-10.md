# Objetos: fallo posterior a la escritura y rollback de Payload

Base `058fa3d`. Codex, 10 septiembre 2026. Reserva Hub `e377963b-e631-4dcf-8296-ceebf07320ad`. Continúa la limitación detectada en la revisión independiente del binding.

## Qué se prueba

Dos casos reales de Payload REST con SDK S3 y proveedor HTTP sintético: creación de imagen y sustitución de una imagen publicada. Un hook `afterChange` exclusivo del test lee la revisión completa ya almacenada y lanza un error después de que Payload haya escrito el documento dentro de su transacción. El hook se retira en `finally`; no se añade código de fallos a producción.

Las aserciones verifican:

- Respuesta500 y ejecución efectiva del hook posterior a la escritura.
- Original igual a los bytes de entrada y presencia de derivados; no solo un objeto ficticio.
- Ningún documento adicional y lista de IDs de versiones sin cambios.
- En update, metadatos/revisión anterior conservados y publicación anterior descargable; en create, documento fallido404.
- Claves nuevas exactas de una revisión completa, manifiesto incluido; bytes recuperables sin borrado compensatorio.
- Cada URL huérfana denegada404 tanto al owner como al visitante, aunque se conozca su identificador.
- Una subida posterior obtiene otra revisión y no adopta ni destruye el huérfano.

Estas pruebas caracterizan comportamiento ya implementado: pasaron sin cambiar código productivo. No se afirma haber observado un RED de un defecto inexistente. Una regresión que suprima la transacción, borre los objetos al fallar o permita descargar una revisión no asociada rompe las aserciones.

## Verificación

- Focal SQLite: 4/4 casos del archivo, salida0. Typecheck/lint: salida0.
- Integración completa SQLite48/48 y PostgreSQL17.11 48/48, seis archivos cada una, salida0. Ejecutor PostgreSQL confirma cierre de proceso, cero sesiones y parada/limpieza exacta del clúster sintético. No hay cambios en código productivo ni dependencias; no se repitió build o suite unitaria ni se atribuyen sus resultados previos a este turno.
- Revisión independiente read-only: cierra el Minor anterior, sin hallazgos accionables nuevos; revisor no ejecutó comandos de pruebas ni modificó archivos.

## Límites y próximo paso

No hay reinicio del proveedor, backup externo ni restauración de bucket. Retener una revisión y demostrar que sigue legible no equivale a un procedimiento operativo para recuperar un desastre. Pendiente: mecanismo de copia/restauración que preserve los identificadores referenciados por la DB, verificación tras reinicio y configuración/staging autorizado. No activar Media ni migrar datos reales por esta prueba. Sin cambio público, dependencias, push o despliegue.

Responsable siguiente: Codex. Evidencia transportada a Claude por Hub; mensaje enviado no implica revisión aceptada por Claude.
