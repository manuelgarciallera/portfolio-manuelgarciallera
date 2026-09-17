# Exportación privada: caché de errores · 17/09/2026

Objetivo CMS reanudado sobre a78b5c2. El turno anterior avanzó una petición pública explícita; no se cuenta como cierre del CMS. Checkpoint y web pública se preservan, sin despliegue. Reserva Hub6b5787ba.

Plan vigente: operación fiable antes de ampliar editor, staging o plataforma multiusuario. El hito de herencia responsive358683b ya está verificado; no se reabre. Correo recibido, restauración externa, medios durables, puente público y revisión de despliegue siguen sin prueba operativa suficiente. La nueva vía de recuperación sin correo y el motor de colocación libre necesitan aprobación de diseño; no se implementan por inferencia.

Hallazgo en `src/publication/export-request.ts`: el éxito devuelve `private, no-store`, pero denegaciones y errores no tienen esa cabecera. El endpoint entrega artefactos editoriales privados; una respuesta negativa obsoleta tampoco debe conservarse entre cambios de sesión o disponibilidad. El patrón de readiness ya aplica no-store a todos sus resultados.

TDD: siete casos nuevos fallan por cabecera ausente (e9775d), cubriendo anónimo, ID inválido,404,409,503, error inesperado y fallo de autenticación. Corrección local centraliza únicamente la respuesta negativa, conserva estados/mensajes genéricos y no adjunta hash ni nombre de descarga al error. GREEN16 pruebas de request/servicio/export340580. La validación completa `npm run check` está en curso; no se considera terminada hasta tener salida0.

Alcance de evidencia: respuestas reales `Request/Response` del manejador con dependencias controladas; no CDN ni proveedor de staging real. La ruta GET vigente delega en este manejador tras inicializar Payload. No se afirma que errores fatales previos a esa inicialización estén cubiertos por este cambio.

Siguiente: terminar comprobación completa, commit recuperable y continuar las puertas operativas locales del plan. Este incremento no redefine el objetivo global ni acredita CMS listo para producción.

Cierre del incremento: `npm run check` sesión32833 terminó0 (`4a1fe8`): 1384unitarias, integración, ambas recuperaciones, lint, tipos y build. Registro distinguido de verificación de staging real. El usuario interrumpe para una prueba visual pública aislada; no quedan verificaciones CMS ejecutándose. Sin despliegue. Reanudar objetivo global posteriormente, no marcado completo.
