# OBSERVACIONES — CLAUDE

> Documento de trabajo **exclusivo de Claude**. Solo Claude edita aquí.
> Las demás IAs leen pero no escriben. Lo vinculante va al `00_CONCENSO.md`.
> Propósito: control de avances, observaciones y análisis de Claude.

---

## 2026-06-15 (1) — Auditoría y diagnóstico
- Proyecto avanzado. Módulos sólidos. Andamiaje blog/login/posts presente pero VACÍO. CLOSE_LOOK real bueno.
- Problema: contenido placeholder (copy Apple M5, imágenes stock, proyectos vacíos). Trabajo = contenido + curación.

## 2026-06-15 (2) — Perfil y primeros cambios
- Título honesto "Diseño y visualización · Oficina Técnica de LALIGA" (2018). Herramientas 3D = Twinmotion/SketchUp/AutoCAD. Slate = Buy&Sell, The UX Union, Fintech, Estadio Render. Buy&Sell = marketplace C2C.
- `content.js`: Apple M5 fuera, narrativa propia, PROJECTS al slate real. Creados `CONTENIDO_PERFIL.md`, `CASO_BUYSELL.md`.

## 2026-06-15 (3) — Sección "Sobre mí" + nav
- `PortfolioPage.jsx`: sección "Sobre mí" real (bio + estudios + herramientas). Nav reapuntado.

## 2026-06-15 (4) — Login/BBDD: estado real + propuesta
- `next-auth`/`mongoose` instalados pero auth/posts/blog VACÍOS. Propuesta: portfolio **sin BBDD** (blog MDX, allowlist env, contacto serverless, JWT). Pendiente ratificar.

## 2026-06-15 (5) — Formulario de contacto (UI + API)
- `components/ContactForm.jsx` (validación + honeypot + estados).
- `app/api/contact/route.ts` (envío vía Resend por fetch; env `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`; 503 si faltan).
- `PortfolioPage.jsx`: mailto sustituido por formulario + enlace de respaldo + sociales.

## 2026-06-15 (6) — VERIFICACIÓN: build verde ✅
- `npm run lint` → Status 0. `npm run build` → **`✓ Compiled successfully`**, TS OK, 15 páginas, `/api/contact` registrada. TODO COMPILA.
- Confirmado: `/blog`, `/proyectos`, `/api/auth`, `/api/posts` NO generan rutas (vacías).

## 2026-06-15 (7) — Textos profesionales (honestidad + energía) + alineación ✅
- Encargo de Manuel: crearle como profesional, con energía y verdad; dejar todo alineado.
- `HeroSection.jsx`: ELIMINADO "Visual Design Manager en LALIGA" (estaba en el subtítulo del home, lo más visible). Headline conservado "Diseño que piensa en código." Subtítulo nuevo: "UX, producto, visualización 3D y desarrollo full-stack. / En la oficina técnica de LALIGA desde 2018."
- `site-config.ts`: `jobTitle` "Visual Design Manager" → "Diseñador y especialista en visualización". `SITE_TITLE` y `SITE_DESCRIPTION` reescritos honestos + energéticos.
- `PortfolioPage.jsx`: "Sobre mí" reescrito con energía (3 párrafos: la escalada, las capas del producto, la mirada a investigación).
- Build verde tras los cambios (`✓ Compiled successfully in 6.1s`).

## Pendiente de Manuel (para afinar textos / completar)
- Pegar su "Acerca de" de LinkedIn (no fetcheable). Logros LALIGA. Pregunta de investigación exacta. Idiomas. Confirmar jobTitle propuesto.
- Datos reales de Buy&Sell / The UX Union / Fintech. Estadio Render: ¿público o privado?
- Foto profesional + imágenes reales (ahora stock).
- Resend (clave + `.env.local`) para que el formulario envíe. ¿`hola@manuelgarciallera.com` reenvía a outlook?
- Ratificar "sin BBDD" al CONCENSO. Google OAuth (Fase 2).

## Próximos pasos seguros
- Blog MDX con filtrado por etiquetas. Página de Investigación. Completar caso Buy&Sell. Verificar con build.

## Backlog
- Repurpose slide chips → DISEÑO/CÓDIGO/RESEARCH. Podar `app/lab/*`. Archivar `_a` y `portfolioManuel`.
