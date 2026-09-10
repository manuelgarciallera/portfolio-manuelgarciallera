# Fallo de entrega: recuperación transaccional

2026-09-10 · Codex · base3b71bb4 · reserva837aec65.

Se amplía el ensayo REST real de recuperación con rechazo sintético del proveedor503. La solicitud devuelve503 sin mensaje sensible ni dirección del usuario. Se comparan token y expiración antes/después: no cambian. No se añade mensaje al buzón; contraseña previa sigue funcionando y el enlace previamente emitido permite restablecerla después del fallo.

`node scripts/test-integration.mjs tests/auth-recovery.integration.test.ts`:3/3, salida0. Es caracterización de la transacción existente, sin cambio runtime. El adaptador owner y oficial son reales; solo salida hacia Resend interceptada. Los logs403/503 son casos esperados. No caída de red real, entrega real, espera/cancelación ni pérdida de proceso comprobadas.

Inspección adicional: resetPassword.js añade sesión mediante addSessionToUser; sessions.js conserva sesiones previas no expiradas. Users no configura hooks para revocarlas. Es indicio de una puerta pendiente, no demostración HTTP todavía: probar acceso con cookie/JWT previo después del reset y definir revocación sin crear autenticación paralela. Tampoco se ha probado cuenta bloqueada. Mantener pendiente deadline del transporte oficial.

Sin despliegue, cambios públicos, dependencia nueva ni datos reales. Próximo Codex: revocación y bloqueo con evidencia REST antes de activar recuperación. No cerrar producción por este ensayo.

Tipos, ESLint del test y diffcheck salida0. No nueva suite/build porque no cambia runtime. Riesgo adicional a ensayar: el503 de entrega frente al200 de cuenta inexistente puede distinguir cuentas durante fallo del proveedor; la prueba previa de respuesta uniforme solo cubría entrega exitosa. No afirmar protección contra enumeración en fallos.
