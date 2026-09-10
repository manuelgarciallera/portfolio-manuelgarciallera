# Revisión concurrente de un paquete

Base9e98603. ReservaHub2867445d-591a-4e7a-828d-ddaeaf4ef1be.

## Evidencia y defecto concreto

La colección ya tiene un índice único por paquete. Una prueba PostgreSQL real fuerza a dos peticiones autenticadas distintas a leer que no existe decisión antes de permitirles continuar. Compiten aprobación y rechazo. Se conserva exactamente una decisión y un evento correspondiente: la exclusión ya funcionaba. El defecto observado es la respuesta del perdedor: ValidationError400 en vez de conflicto409 (`71aff5`). No se presenta como pérdida de datos ni doble aprobación.

La barrera de prueba afecta solo a la secuencia de lectura; no simula escrituras, índices, transacciones ni hooks. Es una prueba exclusiva de PostgreSQL, omitida explícitamente en SQLite; no acredita solicitudes distribuidas contra un proveedor alojado.

## Corrección

Después del rollback, el servicio reconoce el fallo de validación de bundle/reviewHash y comprueba si ya existe una decisión persistida para ese paquete. Solo entonces devuelve409. Si no existe, falla la consulta o el fallo original es de auditoría, no se disfraza el error como conflicto. No sustituye la decisión ganadora.

El cliente muestra una indicación para recargar y revisar el paquete, sin exponer detalles SQL. El mensaje es genérico para409: este código también puede indicar discrepancia de integridad, por lo que no afirma que todo conflicto sea una decisión duplicada. RED cliente `b4f5ab` devolvía mensaje genérico sin instrucción de recuperación.

## Verificación

- Publicación79/19, tipos/lint0 (`53d930`, cierre `51f79d`). Incluye ausencia de ganador y preservación del fallo de auditoría.
- PostgreSQL17.11: 34/34,19,89s (`790de4`), incluida carrera aprobación/rechazo. Proceso/sesiones/clúster cerrados y raíz sintética limpiada (`3a2a90`).
- Regresión completa1251/164,120,82s,salida0 (`2090c0`).
- Revisión independiente solo lectura: sin bloqueadores; mantiene alcance y límites de la prueba. Frontera pública21, salida0 (`e26131`).

Sin esquema, dependencias, rediseño ni publicación. No extender esta prueba a artefactos/preflight concurrentes. La estructura de transacciones de9e98603 y su ensayo de build siguen siendo evidencia de aquella base, no un build repetido en este incremento.
