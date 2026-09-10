# Recuperación owner: caracterización HTTP

2026-09-10 · Codex · basefe55690 · reserva c785266f.

`tests/auth-recovery.integration.test.ts` usa Users real, SQLite aislado, endpoints HTTP Payload y hashing real. Solo sustituye entrega por inbox en memoria y fija serverURL a loopback de la fixture. No modifica configuración productiva ni envía correo.

Dos pruebas pasan con `node scripts/test-integration.mjs tests/auth-recovery.integration.test.ts` (salida0): enlace al origen configurado, mensaje dirigido al owner, respuesta JSON/status idénticos para cuenta existente/inexistente y ningún mensaje adicional para inexistente; token válido cambia contraseña, antigua rechazada/nueva aceptada; inválido, reuso, solicitud anterior y token expirado rechazados403. La expiración se provoca en la fila de QA, sin esperar una hora ni falsear reloj. Esto no demuestra resistencia a enumeración temporal.

Primera ampliación falló porque inbox conservaba los mensajes de la otra prueba. Corregido con beforeEach; no cambio runtime para hacer pasar la prueba. La caracterización inicial pasó directamente: evidencia de comportamiento existente, no ciclo RED/GREEN de una nueva implementación. Tipos y ESLint salida0. Los errores403 registrados son respuestas adversariales esperadas; el aviso de adaptador ausente ocurre antes de instalar el sumidero sintético.

Pendientes: transporte/configuración real, origen canónico validado, fallo de entrega, sesiones previas y bloqueo de cuenta, navegador completo y staging. No declarar recuperación productiva por estas pruebas. Sin dependencias, build nuevo, push ni despliegue. Próximo Codex: configuración y transporte owner siguiendo estos contratos, sin duplicar autenticación.
