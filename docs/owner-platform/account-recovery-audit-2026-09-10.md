# Recuperación de acceso owner: puerta operativa abierta

2026-09-10 · Codex · base1014326 · reserva Hub8b79f9b5.

## Evidencia local

`src/payload.config.ts` no configura `email` ni `serverURL`. `Users.ts` utiliza autenticación local con cinco intentos y bloqueo de diez minutos; no personaliza forgotPassword. Esto es distinto del formulario público, cuyo transporte no se ha inspeccionado ni modificado aquí.

En Payload3.88.0 instalado, `dist/email/consoleEmailAdapter.js` devuelve éxito después de escribir destinatario/asunto en el logger; no envía el mensaje. `dist/auth/endpoints/forgotPassword.js` responde200 cuando termina la operación, sin acreditar entrega. No afirmar que200 significa correo recibido.

`dist/auth/operations/forgotPassword.js` construye el enlace con getRequestOrigin; `dist/utilities/getRequestOrigin.js` devuelve origen vacío sin serverURL ni origen expresamente permitido. Riesgo operativo: enlace relativo en un futuro correo si se conecta solo el transporte.

Caracterización ejecutada con Node y módulos instalados, entrada example.invalid y logger en memoria: salida0. Adaptador console resuelve undefined sin entrega; origen sin configurar vacío; serverURL explícita conserva https://cms.example.invalid. No petición de recuperación real, no contraseña real, no logs con tokens ni envío externo. Es evidencia de primitivas del paquete y configuración, no recorrido HTTP completo.

## Siguiente implementación propuesta

1. Configuración owner explícita e independiente: URL canónica validada, remitente y transporte privado. Nunca derivar enlaces de Host arbitrario ni reutilizar secretos del formulario por inferencia.
2. Fallar de forma visible en preparación/arranque productivo si falta transporte; no ofrecer autonomía de recuperación basada en console. Conservar build aislada y QA sin correo real.
3. Prueba REST con buzón sintético: solicitud conocida/desconocida con respuesta no enumeradora, enlace al origen esperado, token válido, expirado, reutilizado y sustituido por otra solicitud. Comprobar contraseña anterior rechazada y nueva aceptada.
4. Comprobar sesiones previas, cuenta bloqueada y error del transporte. Documentar los resultados antes de afirmar revocación de sesiones o desbloqueo.
5. Solo después, entrega en staging autorizado y recorrido de navegador móvil/desktop. Activar proveedor exige configuración y autoridad aplicables; este recibo no autoriza gasto ni traslado de datos.

No cambiar todavía el algoritmo de tokens de Payload ni añadir endpoint alternativo de recuperación. El objetivo es cerrar el circuito existente con controles y entrega comprobados, no duplicar autenticación. Codex continúa; Claude recibe evidencia. Portfolio/checkpoint intactos, sin push/despliegue.
