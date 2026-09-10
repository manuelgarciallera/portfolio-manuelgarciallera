# Restablecimiento revoca sesiones anteriores

2026-09-10 · Codex · base93d8e36 · reserva df45b3ee.

RED HTTP real: después de reset-password, JWT anteriores aún devolvían el owner en /api/users/me. No era solo una inferencia de código. GREEN: se conservan dos sesiones ordinarias antes del reset; ambas devuelven user:null después y el JWT nuevo sigue autenticando.

Users explicita useSessions:true (ya predeterminado en Payload instalado). beforeOperation registra resetPassword en WeakSet de PayloadRequest; no usa un flag de body/context. beforeValidate consume la marca y vacía sessions en el objeto user que Payload guarda dentro de la misma transacción, después de validar token y antes de crear la sesión nueva. No se revocan sesiones por login normal ni se añade endpoint alternativo.

Revisión independiente del código instalado confirma orden de hooks/transacción, sin bloqueantes. Límites: no prueba un login simultáneo con reset, rollback de un error posterior del propio reset, ni cambio de contraseña mediante edición ordinaria. La prueba cubre coexistencia de sesiones, no carrera concurrente. No modifica JWT global ni cierra sesiones de otros owners.

Verificación:4/4 focales HTTP,1095/1095 unitarias en156archivos,52/52 integración en7archivos,tipos/lint0,Next16.3.4 build23páginas0,frontera pública21entradas0,diffcheck0. Los errores adversariales de integración son esperados. Checkpoint0f0adf686b2752e23c25d224f8c60815b10fd451 intacto. Sin dependencia nueva, envío real, cambio público,push o despliegue.

Próximo Codex: cuenta bloqueada, fallo posterior y deadline del correo; mantener pendiente protección de respuesta ante fallo del proveedor y staging. Este avance no cierra recuperación productiva completa.
