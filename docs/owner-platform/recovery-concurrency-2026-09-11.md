# Recuperación de contraseña: consumo concurrente en PostgreSQL

Base189854f. En entorno aislado, dos solicitudes HTTP simultáneas con el mismo
token recibieron200/200 (9515, d8a05c). Las pruebas anteriores solo verificaban
reutilización secuencial. Código instalado de Payload3.88: transacción, hook,
lectura por token/caducidad, hash asíncrono, actualización por ID. Esta secuencia
permite que ambas solicitudes lean el token antes de consumirlo.

## Corrección implementada localmente

Users.beforeOperation obtiene un bloqueo asesor transaccional PostgreSQL sobre
hash SHA256 truncado a64 bits con namespace del token. Usa pg_try_advisory_xact_lock
en sessions[req.transactionID].db, la misma transacción del reset nativo. No usa
un Map local ni otra conexión del pool. Competidor rechazado403; transacción
ausente503. Commit/rollback liberan el bloqueo. El token no se incorpora como
texto a SQL: se parametriza su hash. La colisión improbable solo rechazaría un
intento concurrente; no concedería acceso. No nuevas tablas/dependencias.

SQLite sigue la ruta nativa local; no se extiende a él esta garantía. La prueba
concurrente se ejecuta expresamente en PostgreSQL, obligatorio en producción.
No es un mecanismo de limitación de correo, ni protege contra token ya robado.
Throttling compartido y entrega real en staging siguen pendientes.

## Evidencia disponible

- RED9515:200/200 frente a200/403.
- GREEN67983:8 pruebas HTTP PostgreSQL pasan, incluyendo rollback posterior a
  escritura, sesiones previas revocadas y contraseña vencedora conservada.
- Unitarias existentes26850:1254/166 pasan. Seis focales adicionales de admisión,
  ausencia de transacción, contención y errores pasan79845; tipos y lint0.
- Revisión independiente verifica sesión del adaptador y orden transaccional,
  sin bloqueadores; recomienda las pruebas focales añadidas. No prueba otro
  proceso por sí misma; la exclusión reside en PostgreSQL, no en memoria Node.
- Suite PostgreSQL completa61968:72 pruebas/10 archivos,869f98 exit0 y sesiones
  de BD cerradas. SQLite40094:7 pasan,1 concurrente PostgreSQL omitida
  explícitamente;40a100 exit0. No atribuir a SQLite protección nueva.
- Guardas públicas77dbc8:14/14 pasan. Build/browser61394 termina21a7c3 exit0:
  login, creación, edición, reordenación, preview390/1280, cuatro páginas/dos
  marcas tras reinicio y medios privados correctos; limpieza verificada.

No se modifica SQL nativo instalado ni se toma un bloqueo fuera de transacción.
Se debe mantener esta regresión al actualizar Payload: depende del contrato
auditado del adaptador y el orden del hook. Falta staging autorizado y revisión
de límites de abuso; este arreglo no convierte el CMS en producto publicado.

Hubea3f3cac es propuesta L2 enviada a Claude, no aceptación inferida. Solo Codex
integra. Cuentas y entrega de correo sintéticas; sin pruebas contra producción.
