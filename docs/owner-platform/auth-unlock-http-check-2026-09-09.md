# Desbloqueo owner: comprobación HTTP aislada

Base `b8c937c`. No modifica código de producción, permisos, cuentas reales ni despliegues.

`owner-platform/tests/auth-unlock.integration.test.ts` reutiliza el servidor HTTP loopback de pruebas y la colección Users real. Base SQLite temporal independiente, secretos aleatorios, cuentas `example.invalid`; colección autenticable `outsiders` exclusivamente en el fixture. La limpieza pertenece al runner de integración tras terminar el proceso.

## Contrato comprobado

1. Cinco contraseñas incorrectas bloquean la cuenta sintética. Se lee `loginAttempts` y `lockUntil` persistidos; la contraseña correcta tampoco permite entrar mientras está bloqueada.
2. Petición anónima a `/api/users/unlock` devuelve 403, incluso con `overrideAccess` y `role` en el cuerpo. El contador y fecha de bloqueo no cambian.
3. Una identidad externa, autenticada por login real y comprobada mediante `/api/outsiders/me`, tampoco desbloquea: 403, estado persistido intacto, login del objetivo aún rechazado.
4. La sesión owner sí desbloquea: 200, contador cero, fecha vacía y login del objetivo satisfactorio.

Esta prueba detectaría la eliminación de `Users.access.unlock` (la política por defecto admite identidades autenticadas) o su ampliación indiscriminada. No se alteraron controles productivos para realizarla.

## Resultados y límites

- Primera ejecución falló por una expectativa incorrecta del test: Payload utiliza 401 para `LockedAuth`, no 423. Inspeccionado el código instalado y corregida la expectativa; no era un fallo del CMS ni un ciclo rojo-verde de corrección productiva.
- Ejecución posterior 1/1 correcta; repetición con comprobación explícita de identidad externa, sesión 29830, también 1/1 correcta. Los errores de autenticación registrados son solicitudes negativas deliberadas. El fixture avisa de ausencia de adaptador de correo, no se envían emails.
- La primera puerta de tipos detectó dos errores del test (colección sintética ajena a los tipos generados y unión de cabeceras). Corregidos sin modificar esquema productivo: alta externa por REST y cabeceras tipadas. Puerta final sesión 36205: prueba 1/1, lint y typecheck, salida conjunta 0. No se repite build ni suite completa: solo se añade este test y documentación, sin cambios runtime.
- La evidencia cubre REST Payload + Users y SQLite en laboratorio. No certifica rutas GraphQL, middleware Next, producción, PostgreSQL ni toda la superficie del aviso GHSA-jg8r-5jh2-v2xj. La auditoría de dependencias permanece abierta; esta prueba no elimina el aviso ni autoriza publicación.
