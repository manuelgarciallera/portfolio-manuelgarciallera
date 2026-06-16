import { NextResponse } from "next/server";

// POST /api/contact
// Recibe { nombre, email, mensaje, website } del formulario de contacto y envia un email.
// Envio via Resend usando fetch (sin dependencia extra). Requiere variables de entorno:
//   RESEND_API_KEY     -> clave de Resend
//   CONTACT_TO_EMAIL   -> destinatario (tu email)
//   CONTACT_FROM_EMAIL -> remitente verificado (opcional; por defecto onboarding@resend.dev)
// Mientras no existan esas variables, la ruta responde 503 y el formulario muestra aviso.

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { nombre, email, mensaje, website } = body ?? {};

    // Honeypot: si viene relleno, es un bot. Respondemos ok sin enviar.
    if (website) {
      return NextResponse.json({ ok: true });
    }

    if (!nombre?.trim() || !email?.trim() || !mensaje?.trim()) {
      return NextResponse.json({ ok: false, error: "Campos incompletos." }, { status: 400 });
    }

    if (!/.+@.+\..+/.test(email)) {
      return NextResponse.json({ ok: false, error: "Email no válido." }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.CONTACT_TO_EMAIL;
    const from = process.env.CONTACT_FROM_EMAIL || "Portfolio <onboarding@resend.dev>";

    if (!apiKey || !to) {
      return NextResponse.json(
        { ok: false, error: "El envío de email aún no está configurado." },
        { status: 503 },
      );
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: `Nuevo mensaje de ${nombre} — Portfolio`,
        text: `Nombre: ${nombre}\nEmail: ${email}\n\n${mensaje}`,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: "No se pudo enviar el email." }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Error inesperado." }, { status: 500 });
  }
}
