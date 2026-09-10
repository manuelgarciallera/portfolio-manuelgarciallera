# Origen canónico de enlaces owner

2026-09-10 · Codex · base52e1467 · reserva Hub7afdb76b.

`OWNER_SERVER_URL` se conecta a serverURL de Payload mediante resolveOwnerServerURL. En runtime production es obligatoria y debe ser un origen HTTPS, sin credenciales, ruta, query, fragmento, espacios ni barras invertidas. No acepta reparaciones ambiguas del parser (https:host, rutas normalizadas con puntos o userinfo vacío). Normaliza host/mayúsculas/barra final con URL.origin. HTTP solo loopback explícito fuera de producción. La compilación aislada omite el valor externo y no exige URL. El error no imprime la entrada. No verifica DNS ni propiedad del dominio.

`.env.example` documenta la variable, sin configurar valor real. El ensayo HTTP ahora utiliza este resolver para alimentar la URL de la fixture y comprobar el enlace emitido.

## Evidencia

- TDD inicial:14 fallos por ausencia de validación;19/19 focales verdes después de añadir cuatro casos de normalización (los cuatro fallaron antes del ajuste).
- Una suite iniciada durante esa ampliación recogió esos cuatro casos antes del ajuste y falló. Se repitió completa sobre fuentes finales:1085/1085 en155archivos, salida0.
- Dos recorridos HTTP de recuperación verdes con el resolver integrado; no transporte real. Errores403 adversariales esperados.
- Typecheck y lint global salida0; lint focal repetido tras último cambio de test, salida0.
- Next16.3.4 build aislada salida0,23páginas; frontera pública21entradas correcta. Diffcheck0. Checkpoint resuelve0f0adf686b2752e23c25d224f8c60815b10fd451.

Sin nuevas dependencias ni cambios visuales/públicos, push o despliegue. Este requisito nuevo debe configurarse antes del runtime productivo owner; no utilizar el dominio del portfolio por defecto. Pendiente: adaptador de entrega, fallo de transporte, sesiones/bloqueo, staging y navegador. La prueba no acredita que el proveedor reciba mensajes ni cierre la operación del CMS. Siguiente Codex: transporte owner independiente.
