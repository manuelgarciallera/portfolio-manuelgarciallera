# Atomicidad de los pasos de preparación de publicación

Base: 7edd842. Reserva Hub: c9ae3d69-bf5a-479a-89f0-17b807687568.

## Problema reproducido

Tras cerrar el preflight, la revisión de los servicios restantes identifica el mismo defecto: el registro principal se crea antes de su evento de auditoría, sin transacción exterior. La prueba real con Payload/SQLite falla en cuatro casos: paquete, aprobación, rechazo y artefacto (`f5b4e8`). Queda un registro aunque la auditoría rechace la operación. Una revisión o artefacto huérfano podría además impedir reintentar por las restricciones de unicidad.

## Cambio

`src/publication/transaction.ts` comparte la protección transaccional del preflight. Cada operación guarda su registro y evento con el mismo req, confirma ambos antes de devolver éxito e intenta rollback si falla. Si no puede adquirir una transacción exclusiva, devuelve 503 sin ejecutar ni cerrar una transacción ajena. Las comprobaciones de identidad, confirmación e integridad se conservan.

El servicio captura el owner autenticado antes del callback; TypeScript detectó la pérdida de estrechamiento de req.user al introducirlo y se corrigió antes de continuar (`678eea` → `cc1a4f`).

## Verificación

- SQLite: 33/33, incluyendo rollback y reintento de los cuatro nuevos casos y preflight. Primer GREEN `678eea`; posterior cambio de captura del owner se contrasta con tipos y PostgreSQL.
- Publicación: 75/75 en 19 archivos; tipos y lint salida 0 (`cc1a4f`). Helper probado ante fallo de commit, rollback fallido, orden de commit y transacción ajena. Pruebas de servicios con transacciones simuladas; integración usa los adaptadores reales.
- Frontera pública: 21 entradas, salida 0 (`997b0b`).
- Revisión independiente solo lectura: sin bloqueadores; conserva los límites siguientes.

## Límites

Atomicidad por operación, no una transacción que abarque todas las decisiones humanas del flujo. No incluye efectos externos, no habilita publicación pública, no cambia UI, esquema, permisos o dependencias. No garantiza deduplicación concurrente ni repara automáticamente huérfanos históricos. No equivale a validar almacenamiento de objetos o recuperación de proveedor real.

PostgreSQL 17.11: 33/33, 16,94s (`a23b1f`); proceso/sesiones/clúster cerrados y raíz sintética retirada. Regresión completa: 1247/1247 en164 archivos,138,02s (`38ee54`).

Build y ensayo HTTP productivo aislado: salida0 (`9cf204`). Login por teclado y sesión cookie a390/1280, anónimo denegado, borrador conservado tras reinicio del proceso (`03dc52`). App/clúster cerrados y raíz sintética limpiada. Prueba modo legacy/local; no acredita proveedor de objetos, recepción de correo real, TLS productivo ni móvil físico. No despliegue ni push.
