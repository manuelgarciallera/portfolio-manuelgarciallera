# Preflight y auditoría atómicos

Base: dfd78f5. Reserva Hub: d6bf37d5-5a38-4f14-be3a-069699e7f39d.

## Defecto reproducido

La ruta owner creaba un req local sin transacción exterior. El servicio guardaba el informe y después su evento de auditoría: al fallar el segundo, quedaba el primero aunque la petición devolviese error. Reproducción con Payload/SQLite reales y fallo inyectado en beforeChange del evento: RED 349c3c, un informe persistido donde se esperaban cero.

## Corrección y límites

El servicio adquiere una transacción exclusiva para crear informe y auditoría con el mismo req. Devuelve el informe solo después del commit. Ante fallo, solicita rollback y conserva el error original. Si ya hay una transacción ajena o no puede abrir una, rechaza con 503 sin escribir ni cerrar la transacción ajena. Reutilizar un informe vigente sigue siendo solo lectura.

No cambia esquemas, permisos, interfaz, dependencias ni web pública. No repara posibles huérfanos históricos; deben inventariarse antes de una migración real. No garantiza deduplicación bajo solicitudes concurrentes, ni atomicidad de otros servicios de publicación.

## Evidencia

- SQLite: 29/29; prueba de rollback y reintento con exactamente un informe y un evento.
- Publicación: 71/71, 18 archivos; prueba de rechazo sin transacción propia y rollback ante auditoría fallida.
- Tipos y lint: salida 0 (cierre 78f9bd).
- Revisión independiente solo lectura: sin bloqueadores; confirma los límites anteriores.

- PostgreSQL 17.11: 29/29, 18,94s (`736e38`); proceso, sesiones y clúster cerrados; raíz sintética retirada.
- Frontera pública: 21 entradas, salida 0 (`1267e2`).

Regresión completa: 1243/1243 en 163 archivos, 144,35s, salida 0 (`036097`). No se repitió build en este incremento de servicio; no atribuirle builds anteriores. Sin push ni despliegue.
