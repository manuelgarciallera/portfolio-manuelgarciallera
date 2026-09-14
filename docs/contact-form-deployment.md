# Formulario de contacto: despliegue y privacidad

El formulario de la experiencia `redesign` publica únicamente `/api/contact`. La dirección final no forma parte del JavaScript del navegador, del HTML, de los metadatos ni del repositorio versionado.

## Transporte vigente (contrastado con código el 14 de septiembre de 2026)

La fuente operativa es `src/lib/mailer.ts`. El transporte principal es SMTP;
Resend es una alternativa cuando SMTP no está configurado. Un fallo de envío
SMTP no dispara otro envío por Resend: devuelve error, evitando duplicados.
Esta guía no acredita qué secretos están configurados en Vercel.

## Variables privadas

- `CONTACT_TO_EMAIL`: uno o varios destinatarios, separados por comas.
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`: servidor y credenciales del buzón.
- `SMTP_PORT`: 587 con STARTTLS obligatorio (valor predeterminado) o 465 con TLS directo.
- `SMTP_FROM_NAME`: nombre visible opcional. El remitente SMTP es siempre `SMTP_USER`; el visitante se incluye en `Reply-To`.
- `RESEND_API_KEY`: alternativa opcional si SMTP no está configurado.
- `CONTACT_FROM_EMAIL`: remitente verificado para Resend. El remitente de onboarding predeterminado no debe asumirse válido para destinatarios de producción.

Configurar por entorno y con destinatarios de prueba separados en Preview/Development.
No copiar automáticamente secretos de Production a las vistas previas. No deben
llevar el prefijo `NEXT_PUBLIC_` ni guardarse en Git, capturas, informes o el Hub.
No confundir este transporte del portfolio con la recuperación de acceso del CMS.

## Controles implementados

- validación compartida y límites de longitud;
- honeypot invisible;
- máximo de cinco intentos por cliente cada quince minutos;
- lectura incremental limitada a 40.000 bytes, incluso sin `Content-Length`, con rechazo de JSON/UTF-8 inválidos y de otros `Content-Type`;
- respuesta `no-store` al limitar frecuencia;
- `reply_to` al remitente sin publicar la dirección receptora.

El límite en memoria protege una instancia, pero no sustituye un límite distribuido en producción. Si el tráfico crece, conviene moverlo a Vercel Firewall/Rate Limiting o a un almacén como Upstash.

## Pruebas y verificación pendiente

El 14/09, `npm run test:unit -- src/lib/contact.unit.test.ts src/lib/contact-body.unit.test.ts`
terminó con 8 pruebas aprobadas en 2 archivos. Comprueban validación y lectura del
cuerpo; no son una prueba de transporte SMTP ni de recepción real.

Para cerrar entrega: enviar un único mensaje identificado como prueba desde el
dominio desplegado, comprobar recepción en los destinatarios configurados y que
Responder apunta al visitante. Verificar también la respuesta visible ante fallo
sin exponer credenciales ni información privada del proveedor. No declarar cierre
solo porque el servidor acepte un correo. Esta revisión no envió mensajes ni
consultó secretos. El limitador distribuido y el endurecimiento CSP siguen pendientes.
