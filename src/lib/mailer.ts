import type { ContactSubmission } from "@/lib/contact";

// Envio del formulario de contacto.
//
// Decision (2026-09-07): el transporte primario es SMTP contra el buzon propio de
// IONOS, no una plataforma de terceros. Razon medida, no preferencia: los MX de
// manuelgarciallera.com ya son mx00/mx01.ionos.es y el SPF publicado ya es
// `v=spf1 include:_spf-eu.ionos.com ~all`. Enviar desde ese mismo buzon pasa SPF y
// DKIM sin tocar el DNS. Cualquier plataforma externa exigiria anadir un include al
// SPF -y solo puede existir un registro SPF- mas los CNAME de su DKIM.
//
// Resend queda como transporte alternativo, activable solo por variables de entorno:
// si el SMTP de IONOS bloqueara la salida desde la funcion, se conmuta sin tocar codigo.
//
// Variables (Vercel -> Settings -> Environment Variables):
//   CONTACT_TO_EMAIL   destinatario final
//   SMTP_HOST          smtp.ionos.es
//   SMTP_PORT          587 (STARTTLS) o 465 (TLS directo)
//   SMTP_USER          buzon completo, p. ej. hello@manuelgarciallera.com
//   SMTP_PASS          contrasena de ese buzon
//   SMTP_FROM_NAME     opcional, nombre visible del remitente
//   RESEND_API_KEY     opcional, solo si se conmuta a Resend
//
// El remitente es SIEMPRE el buzon propio. El visitante viaja en Reply-To: poner su
// direccion en From haria fallar SPF/DMARC y acabaria en spam.

export type MailerResult =
  | { ok: true; transport: "smtp" | "resend" }
  | { ok: false; reason: "unconfigured" | "send-failed"; detail?: string };

const SEND_TIMEOUT_MS = 12_000;

// Una cabecera no puede contener saltos de linea: son el vector clasico de inyeccion
// de cabeceras (un "nombre" con \r\nBcc: ... anadiria destinatarios).
function sanitizeHeader(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function buildSubject(name: string): string {
  return sanitizeHeader(`Portfolio · mensaje de ${name}`);
}

function buildText({ name, email, company, message }: ContactSubmission): string {
  return [
    `Nombre: ${name}`,
    `Email: ${email}`,
    company ? `Organización: ${company}` : null,
    "",
    message,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

async function sendWithSmtp(submission: ContactSubmission, to: string): Promise<MailerResult> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return { ok: false, reason: "unconfigured" };

  const port = Number(process.env.SMTP_PORT) || 587;
  const { default: nodemailer } = await import("nodemailer");

  const transporter = nodemailer.createTransport({
    host,
    port,
    // 465 habla TLS desde el primer byte; 587 empieza en claro y sube con STARTTLS.
    secure: port === 465,
    requireTLS: port !== 465,
    auth: { user, pass },
    connectionTimeout: SEND_TIMEOUT_MS,
    greetingTimeout: SEND_TIMEOUT_MS,
    socketTimeout: SEND_TIMEOUT_MS,
  });

  try {
    await transporter.sendMail({
      from: { name: sanitizeHeader(process.env.SMTP_FROM_NAME || "Portfolio"), address: user },
      to,
      replyTo: { name: sanitizeHeader(submission.name), address: submission.email },
      subject: buildSubject(submission.name),
      text: buildText(submission),
    });
    return { ok: true, transport: "smtp" };
  } catch (error) {
    return { ok: false, reason: "send-failed", detail: error instanceof Error ? error.message : "smtp" };
  } finally {
    transporter.close();
  }
}

async function sendWithResend(submission: ContactSubmission, to: string): Promise<MailerResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, reason: "unconfigured" };

  const from = process.env.CONTACT_FROM_EMAIL || "Portfolio <onboarding@resend.dev>";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: submission.email,
        subject: buildSubject(submission.name),
        text: buildText(submission),
      }),
      signal: controller.signal,
    });
    if (!response.ok) return { ok: false, reason: "send-failed", detail: `resend ${response.status}` };
    return { ok: true, transport: "resend" };
  } catch (error) {
    return { ok: false, reason: "send-failed", detail: error instanceof Error ? error.message : "resend" };
  } finally {
    clearTimeout(timer);
  }
}

export async function sendContactMessage(submission: ContactSubmission): Promise<MailerResult> {
  const to = process.env.CONTACT_TO_EMAIL;
  if (!to) return { ok: false, reason: "unconfigured" };

  const smtp = await sendWithSmtp(submission, to);
  if (smtp.ok || smtp.reason === "send-failed") return smtp;

  return sendWithResend(submission, to);
}
