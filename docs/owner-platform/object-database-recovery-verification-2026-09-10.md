# Recuperación conjunta aislada: SQLite y revisiones de objetos

Codex · 2026-09-10 · base `94f8eae` · reserva Hub `ad03a828`.

## Recorrido probado

Ejecutar desde `owner-platform`: `node scripts/test-recovery-objects.mjs`.

1. Un proceso hijo inicia Payload REST y un proveedor HTTP S3 sintético con SDK real. Crea un owner de prueba y dos revisiones publicadas sucesivas de una imagen, cada una con tres derivados.
2. Exporta paquetes verificados a archivos exclusivos, con manifiesto y binarios. Termina y cierra la base SQLite. El Map de objetos vive solo dentro del hijo y desaparece al terminar: el proceso de recuperación no puede reutilizarlo.
3. El controlador copia la DB cerrada y los paquetes utilizando el manifiesto físico existente, que incluye SHA de cada archivo y SHA Git. Seis variantes dañadas —DB, original y derivado, ausentes o corruptos— se rechazan antes de crear el destino.
4. Un segundo proceso empieza con un proveedor vacío. Importa los paquetes conservando UUID y abre la DB copiada sin recrear usuarios. El login HTTP funciona; todas las imágenes se descargan con el hash esperado. El owner conserva historial y el anónimo solo accede a la revisión publicada.
5. Restaura la versión anterior por REST, comprueba autorización y bytes, edita una imagen nueva y compara su descarga con bytes generados independientemente. Ambos históricos siguen legibles por el owner y ocultos al anónimo después de editar.
6. Fuente y copia permanecen idénticas tras editar el destino. No aparecen medios en el almacenamiento nativo de Payload. Cleanup limitado al directorio temporal generado y condicionado a cierre real de hijos.

## Evidencia y correcciones

- RED observado: sin importar paquetes, el owner inicia sesión pero el primer archivo histórico devuelve `404 !== 200` (salida 1).
- GREEN: dos ejecuciones completas correctas; la final incluye verificación de bytes e históricos tras editar. Resultado: dos revisiones, ocho archivos, seis daños rechazados, login/historial/edición correctos.
- Pruebas auxiliares de recuperación: 45/45. Inicialmente falló dos veces un escenario de subprocess existente. La reproducción mostró `exitCode: 1`: el hijo sintético podía morir al escribir stderr después de que execFile cerrara la tubería. Se captura el error de esa tubería únicamente dentro del hijo sintético, para conservar la premisa de la prueba. `runCommand` no cambia ni se relajan las aserciones de cierre y redacción.
- Revisión independiente sin hallazgos pendientes; ampliación solicitada sobre bytes/historial posterior a edición incorporada.
- Lint y TypeScript finales: salida 0. Diff público sin cambios y checkpoint `0f0adf686b2752e23c25d224f8c60815b10fd451` intacto. No se repiten build ni suite editorial general: este tramo modifica exclusivamente ensayos y documentación, no runtime.

## Límites

Es un ensayo de recuperación, no un servicio de backup ni una activación del almacenamiento de la app. Cubre Users/Media de la fixture, no las 22 colecciones completas, previews o inventario de todas las referencias/huérfanos. Las revisiones se enumeran desde el recibo sintético del seed, no mediante un recolector operativo del CMS. La integridad depende de confiar en el manifiesto: no hay firma externa ni cifrado de backup.

SQLite y proveedor S3 sintético local; no prueba PostgreSQL, Neon, R2, políticas IAM, fallos de región ni proveedor real. Los procesos son distintos, pero en el mismo host. Permisos 0600 solicitados para archivos no equivalen a auditoría ACL en Windows.

Sin cambios runtime, dependencias, web pública, push o despliegue. Siguiente Codex: extender el ensayo a PostgreSQL con dump/restore y después inventario completo de referencias; staging y contratación requieren autoridad aplicable.
