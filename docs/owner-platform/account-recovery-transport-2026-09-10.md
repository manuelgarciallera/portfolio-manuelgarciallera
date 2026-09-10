# Transporte owner preparado, no activado

2026-09-10 · Codex · base83d0a8a · reserva00876b20.

Se añade únicamente al paquete owner `@payloadcms/email-resend@3.88.0`, versión alineada con Payload. Instalación ignore-scripts: un paquete nuevo,13 líneas añadidas al lock, sin modificar versiones existentes. La [documentación oficial de Payload](https://payloadcms.com/docs/email/overview), consultada hoy, recomienda su adaptador Resend para serverless; no se crea integración Marketplace, cuenta ni DNS. No se añade React Email para un mensaje que Payload ya genera.

`config/email.ts` valida OWNER_EMAIL_API_KEY y OWNER_EMAIL_FROM (dirección simple), exige configuración completa en runtime productivo, fija remitente CMS y envuelve errores sin detalles del proveedor. Aceptación requiere recibo id no vacío. Build aislada y local sin configuración usan adaptador no operativo que rechaza envío503, en vez de simular éxito en consola. Payload.config lo integra y .env.example documenta variables privadas. No se lee ni copia la configuración del formulario público.

## Pruebas

- Diez pruebas focales fallaron antes de implementar, luego10/10 verdes: configuración parcial, remitentes inseguros, build sin red, remitente fijo, petición al endpoint oficial, error/protocolo inválido/recibo vacío redactados.
- Suite1095/1095 en156archivos; tipos y lint global0, lint focal repetido después del testHTTP actualizado0.
- Dos pruebas HTTP verdes con Users/DB/REST y adaptador owner/oficial reales. Solo fetch a api.resend.com se sustituye por buzón sintético; loopback sigue usando fetch real. Token válido y caducado/reuso/sustituido mantienen el contrato. No entrega real.
- Next16.3.4 build aislada0,23páginas; frontera pública21entradas0 y diffcheck0. Sin cambio público ni presupuesto incrementado.
- Instalación informa11 avisos moderados; no se ejecutó audit fix ni se afirma ausencia de vulnerabilidades. La dependencia nueva requiere el Payload que ya tiene avisos; falta comparación detallada del reporte para atribuir delta.

## Límites operativos pendientes

El adaptador oficial instalado usa fetch sin deadline explícito y considera id como aceptación; estas son limitaciones inspeccionadas, no garantías de entrega. Antes de activar: resolver espera acotada/cancelación, probar fallo de proveedor dentro de la transacción de recuperación, revisar sesiones y bloqueo, y staging real con remitente verificado. No declarar listo para producción por respuesta de API; aceptación no es recepción en buzón.

No gasto, claves reales, proveedor activado, push o despliegue. Codex continúa con esos casos antes de pedir configuración al usuario; Claude recibe evidencia. Público/checkpoint preservados.
