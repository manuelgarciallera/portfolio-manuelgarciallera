# Contrato de transporte del formulario · 14/09/2026

Base 679a3ca. Cobertura nueva de comportamiento existente; no corrección runtime.
src/lib/mailer.unit.test.ts llama a sendContactMessage real y sustituye únicamente
nodemailer y fetch para impedir envíos. Variables sintéticas se restauran tras
cada prueba; no se leen secretos ni buzones.

Nueve casos: destinatarios ausentes/vacíos, SMTP 587/465 cifrado, remitente propio
y Reply-To visitante, normalización de destinatarios, ausencia de segundo envío
ante fallo SMTP ambiguo, cierre del transporte, saneamiento de cabeceras sin
alterar el cuerpo, alternativa solo sin SMTP, ausencia de configuración y rechazo
del proveedor. Algunos invariantes se agrupan en los dos recorridos SMTP.

La prueba de no duplicación detectaría continuar hacia Resend tras send-failed;
la de TLS detectaría desactivar requireTLS en 587; la de cabeceras detectaría
suprimir saneamiento; los contratos de payload detectan perder destinatarios o
usar al visitante como From. No se modificó producción para fabricar un RED:
son pruebas de caracterización de lógica ya existente, no un fallo descubierto.

Verificación:
- 17/17 dirigidas, tres archivos (aedeef), incluyendo las ocho anteriores de entrada.
- 251/251 unitarias completas, 40 archivos (8ff67f), frente a 242 anteriores.
- ESLint dirigido y tsc --noEmit terminan 0 (8e5fbb); diff-check ff4430.
- src/lib/mailer.ts permanece sin cambios. Sin build nuevo: solo tests/documento.

Limitaciones: no comprueba SMTP real, DNS, SPF/DKIM/DMARC, recepción, estado de
credenciales, integración HTTP del formulario o límite de frecuencia compartido.
No equivale a entrega acreditada. No push/despliegue/cambio de proveedor.
Reserva Hub17d4ebce. Siguiente Codex: puertas de cierre que no requieran secretos
o nuevas decisiones; mantener pendiente la entrega real hasta verificarla.
