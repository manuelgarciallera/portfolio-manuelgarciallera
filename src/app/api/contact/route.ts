import { NextResponse } from "next/server";
import { parseContactSubmission } from "@/lib/contact";
import { sendContactMessage } from "@/lib/mailer";

// POST /api/contact
// Recibe { nombre, email, mensaje, website } del formulario de contacto y envia un email.
// El transporte y sus variables de entorno estan documentados en src/lib/mailer.ts.
// Mientras no exista configuracion, la ruta responde 503 y el formulario ofrece mailto.

// SMTP necesita TCP: esta ruta no puede ejecutarse en el runtime edge.
export const runtime = "nodejs";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 5;
const MAX_TRACKED_CLIENTS = 1_000;
const attempts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(request: Request): boolean {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const key = forwarded || request.headers.get("x-real-ip") || "local";
  const now = Date.now();
  const record = attempts.get(key);

  if (!record || record.resetAt <= now) {
    if (attempts.size >= MAX_TRACKED_CLIENTS) {
      const oldestKey = attempts.keys().next().value as string | undefined;
      if (oldestKey) attempts.delete(oldestKey);
    }
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  record.count += 1;
  return record.count > MAX_REQUESTS;
}

export async function POST(request: Request) {
  try {
    if (isRateLimited(request)) {
      return NextResponse.json(
        { ok: false, error: "Demasiados intentos. Prueba de nuevo en unos minutos." },
        { status: 429, headers: { "Retry-After": "900", "Cache-Control": "no-store" } },
      );
    }

    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
      return NextResponse.json({ ok: false, error: "Formato no admitido." }, { status: 415 });
    }

    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 12_000) {
      return NextResponse.json({ ok: false, error: "El mensaje es demasiado grande." }, { status: 413 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = parseContactSubmission(body);
    if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
    if ("spam" in parsed) return NextResponse.json({ ok: true });

    const sent = await sendContactMessage(parsed.data);

    if (!sent.ok) {
      if (sent.reason === "unconfigured") {
        return NextResponse.json(
          { ok: false, error: "El formulario está temporalmente indisponible. Puedes escribirme por email o LinkedIn." },
          { status: 503 },
        );
      }
      // El detalle solo va al registro del servidor: al visitante no le sirve y puede
      // filtrar el host o el usuario del buzon.
      console.error("[contact] envio fallido:", sent.detail);
      return NextResponse.json({ ok: false, error: "No se pudo enviar el email." }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Error inesperado." }, { status: 500 });
  }
}
