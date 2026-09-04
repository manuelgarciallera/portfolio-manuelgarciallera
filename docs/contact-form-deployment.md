# Formulario de contacto: despliegue y privacidad

El formulario de la experiencia `redesign` publica únicamente `/api/contact`. La dirección final no forma parte del JavaScript del navegador, del HTML, de los metadatos ni del repositorio versionado.

## Variables privadas

- `CONTACT_TO_EMAIL`: destinatario real. Está configurado localmente en `.env.local`, que Git ignora.
- `RESEND_API_KEY`: clave privada de Resend. Falta configurarla en local y en el proveedor de despliegue.
- `CONTACT_FROM_EMAIL`: remitente de un dominio verificado. En pruebas puede omitirse y la ruta usará el remitente de onboarding de Resend.

En Vercel deben añadirse en Project Settings → Environment Variables para Production, Preview y Development según corresponda. No deben llevar el prefijo `NEXT_PUBLIC_`.

## Controles implementados

- validación compartida y límites de longitud;
- honeypot invisible;
- máximo de cinco intentos por cliente cada quince minutos;
- cuerpo JSON limitado y rechazo de otros `Content-Type`;
- respuesta `no-store` al limitar frecuencia;
- `reply_to` al remitente sin publicar la dirección receptora.

El límite en memoria protege una instancia, pero no sustituye un límite distribuido en producción. Si el tráfico crece, conviene moverlo a Vercel Firewall/Rate Limiting o a un almacén como Upstash.

## Verificación final

Tras configurar Resend, enviar un mensaje de prueba desde el dominio desplegado, comprobar recepción y respuesta, y revisar los logs sin conservar el cuerpo del mensaje más tiempo del necesario.
