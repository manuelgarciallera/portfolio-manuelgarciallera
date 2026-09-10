# Cuenta bloqueada: recuperación válida

2026-09-10 · Codex · base7761f15 · reserva151c5f17.

RED REST: cinco intentos incorrectos bloquean la cuenta. Reset con token válido devolvía200 pero loginAttempts seguía5 y el bloqueo persistía. Users ahora limpia loginAttempts y lockUntil en el mismo hook de recuperación autenticado por token que revoca sesiones; no invoca ni relaja el endpoint unlock.

GREEN: tokenincorrecto403 conserva lockUntil; tokenválido cambia contraseña, contador0, bloqueo nulo y login nuevo200. Se repite auth-unlock para comprobar que anónimo/identidad de otra colección siguen sin poder desbloquear.6/6 pruebas HTTP en2archivos. Unitarias1095/1095 en156archivos, tipos/lint0, buildNext16.3.4 con23páginas0, frontera21/diffcheck0. No se repite toda integración de medios, que pasó en el commit anterior; no presentarla como evidencia nueva.

Sin cambios públicos, dependencias,envreal,correo real,push ni despliegue. Recuperación necesita todavía deadline/transporte, error posterior transaccional, respuesta uniforme durante fallo del proveedor y staging. Próximo Codex: esas puertas, sin pedir claves antes de cerrar pruebas.
