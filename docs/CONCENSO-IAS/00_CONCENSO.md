# CONCENSO IAS — Portfolio Manuel García-Llera

> Documento de consenso y **fuente de verdad** del proyecto.
> Modelo de colaboración multi-IA. **Léeme al arrancar cualquier sesión.**
> Última actualización: 2026-06-15 (Claude)

---

## 0. Criterio de colaboración multi-IA

Este proyecto lo desarrollan varias IAs coordinadas por Manuel:

- **Claude** — coordinación, análisis, criterio de producto y arquitectura de contenido.
- **Codex** — ejecución técnica profunda (código, rendimiento, infraestructura).
- **Gemini** — análisis estratégico y comparativo. Intervendrá a futuro.
- **DeepSeek** — rol por definir. Intervendrá a futuro.

**Reglas del modelo:**
1. Cada IA tiene su propio documento `OBSERVACIONES_*.md`. **Solo esa IA edita el suyo.**
2. Este documento (CONCENSO) es lo único **compartido y vinculante**. Solo se modifica con acuerdo de todas las partes y visto bueno de Manuel.
3. **"Suma, no resta":** las entradas se añaden, no se borran.
4. Manuel es el puente y árbitro. En caso de discrepancia, decide Manuel.
5. Antes de tocar el proyecto, leer este documento.

---

## 1. Propósito del portfolio

Portfolio profesional **dual**: escaparate visual (Product/UX Designer + Full-Stack) y perfil de **investigador** (HCI, alta carga cognitiva). Audiencias: industria/diseño y supervisores doctorales (Suiza). Dominio: manuelgarciallera.com · idioma: español. Objetivo transversal: **vender el perfil** y que la web sea sólida, escalable y duradera.

**Título profesional acordado:** Diseño y visualización · Oficina Técnica de LALIGA (desde 2018). Veraz y descriptivo; no inflar a "manager" ni a "ingeniero".

## 2. Dónde vive el proyecto

- **Repo canónico:** `C:\Develop\portfolio-manuelgarciallera` (Claude + Codex).
- **Archivo / retirar:** `portfolio-manuelgarciallera_a` (árbol huérfano sin config), `portfolioManuel` (portfolio viejo en vanilla JS).

## 3. Stack real (verificado en código, 2026-06-15)

- Next.js (App Router) + React. Secciones en `.jsx`/`.js`; infraestructura en `.tsx`/`.ts`.
- 3D: React Three Fiber + Drei + shaders propios. Integraciones experimentales: Spline, Theatre.js (en `app/lab/*`).
- Animación: GSAP, Framer Motion, Lenis (smooth scroll). Reveal propio (`usePortfolioReveal`).
- Auth: NextAuth ya configurado (`app/api/auth/[...nextauth]`).
- Blog ya andamiado (`app/blog/[slug]` + `app/api/posts`).
- SEO sólido: robots, sitemap, manifest, opengraph, security.txt, humans.txt.

## 4. Reglas de diseño y tokens

- Dark: bg #000 · cards #1c1c1e · texto #f5f5f7 · secundario #86868b · acento #5ec4c8.
- Light: bg/cards #fff · texto #1d1d1f · secundario #6e6e73 · acento #0e6b6b.
- Tipografía estilo SF Pro Display / system-ui · letter-spacing negativo en headlines.
- Radios: cards 18px · panels 30px · pills 980px.
- Reveal: `.rv` `.rv2` `.rs` `.rl` `.rr` `.clip-rv` `.ttl-rv`.
- Mobile-first 375px · `prefers-reduced-motion` con fallback · componentes < 150 líneas · solo R3F/Drei para 3D · no mezclar GSAP y Framer en el mismo elemento.
- **Pendiente de criterio:** las secciones están en `.jsx`, no en TS estricto (regla de oro original). Migración a evaluar, no urgente.

## 5. Arquitectura de contenido (páginas y jerarquía)

- **Home (`/`)** — escaparate-resumen que enruta. Módulos 3D existentes en arco narrativo. NO contiene casos completos.
- **Proyectos (`/proyectos`)** — índice filtrable (UX · Full-Stack · Visual · Research).
- **Proyecto (`/proyectos/[slug]`)** — caso completo (plantilla de 9 bloques). Reveal por scroll + índice "jump to section".
- **Investigación (`/investigacion`)** — enfoque metodológico + líneas + escritos. Página para ojos doctorales.
- **Sobre mí (`/sobre-mi`)** — trayectoria (Gráfico → Integrado → UX/UI → Full Stack) + LALIGA.
- **Blog (`/blog`)** — artículos/escritos. SEO, posicionamiento, notoriedad, munición doctoral.
- **Contacto (`/contacto`)** — formulario serverless (email, sin BBDD, honeypot).
- **CV** — PDF descargable.
- **(Fase 2) Área privada** — trabajo NDA tras login Google contra allowlist administrada por Manuel.

**Decisiones de backend:** Fase 1 = estático + formulario serverless, **sin BBDD ni registros públicos**. Login = Google OAuth contra allowlist (no alta libre), solo Fase 2.

## 6. Plantilla estándar de caso

Cabecera: título + claim · rol/contexto · toolkit · tipo+tags · hero visual.
Cuerpo: 1) Problema (HMW) · 2) Investigación + metodologías · 3) Insight clave · 4) Decisiones (con alternativas pros/contras) · 5) Solución · 6) Validación/testing · 7) Resultado/impacto · 8) Aprendizajes · 9) CTA fijo "ver proyecto completo".
Dos niveles: resumida (tarjeta) + completa (URL propia).

## 7. Enfoque metodológico (perfil investigador)

Marco: DCU (ISO 9241-210) + Doble Diamante. Toolkit acreditado en el máster UX/UI (UNIR): entrevistas, test de usabilidad, card sorting, benchmarking, evaluación heurística (Nielsen), evaluación de accesibilidad (WCAG), personas, customer journey map, arquitectura de información (8 principios), site maps, wireframing, prototipado, diseño de interacción responsive. Por adquirir (capa doctoral): método experimental, estadística, codificación cualitativa, teoría de carga cognitiva (Sweller), situation awareness (Endsley).

## 8. Slate de proyectos (confirmado 2026-06-15)

1. **Buy&Sell** — marketplace C2C de electrónica de segunda mano (TFM, Angular + Node + MySQL). NO es un CRM. Caso bandera.
2. **The UX Union** — MVP de red de conexión entre diseñadores.
3. **Proyecto Fintech** — plataforma fintech en desarrollo (orientada a Suiza).
4. **Estadio Render** — visualización arquitectónica (CAD/SketchUp → Twinmotion).

Descartado: plataforma de películas ficticia (commodity, resta credibilidad doctoral). Veterinaria (housevet) solo si aporta narrativa real de software de gestión, no como relleno.

## 9. Diagnóstico

- **Estructura/módulos:** sólidos y construidos.
- **CLOSE_LOOK:** contenido real (8 áreas de capacidad). Conservado.
- **Galería:** [RESUELTO 2026-06-15] eliminado el copy de marketing de Apple M5; sustituido por narrativa propia.
- **Imágenes:** aún de stock (Unsplash). Pendiente trabajo real.
- **Proyectos:** [RESUELTO 2026-06-15] fichas actualizadas al slate real con stacks correctos. Pendiente: casos completos e imágenes reales.

## 10. Hoja de ruta por fases

- **FASE 1 (crítica, antes de plazos doctorales):** [hecho] vaciar copy de Apple + narrativa propia · [pendiente] sustituir imágenes stock por trabajo real · desarrollar 3–4 casos reales · páginas Sobre mí + Investigación · formulario de contacto · CV. Online e indexada.
- **FASE 2:** blog con línea editorial + login/área privada (allowlist) + noindex en privado.
- **FASE 3:** depuración 3D (podar `app/lab/*`), mejora progresiva de efectos.

## 11. Decisiones tomadas

- Repo canónico único: `portfolio-manuelgarciallera`. Retirar duplicados.
- Estética: limpio estilo Apple + esencia personal + reveal por scroll + jerarquía clara.
- Galería Apple: módulo mantenido, contenido de Apple sustituido por narrativa propia.
- Blog: SÍ (ya andamiado). Contacto sin BBDD. Sin registros públicos.
- Título profesional veraz (ver §1). Herramientas 3D = Twinmotion/SketchUp/AutoCAD/CAD; Unreal fuera de cabecera.
- Slate de 4 proyectos reales (ver §8); descartado lo ficticio.

## 12. Registro de sesiones

- **2026-06-15 (Claude):** Auditado el repo real. Confirmados módulos y andamiaje (galería Apple, blog, NextAuth, rutas [slug], SEO). Definidos: criterio multi-IA, arquitectura de contenido, plantilla de caso, enfoque metodológico, decisiones de backend. Creado el sistema de documentación CONCENSO-IAS.
- **2026-06-15 (Claude, cont.):** Definido el bloque de perfil (posicionamiento, título, sobre mí, estudios, herramientas, intereses) → `CONTENIDO_PERFIL.md`. Confirmado el slate de proyectos. Ejecutado en código: eliminado todo el copy de Apple M5 de `content.js` y sustituido por narrativa propia; PROJECTS actualizado al slate real. Creado el guion del primer caso → `CASO_BUYSELL.md`. Pendiente para Manuel: aportar imágenes/datos reales; confirmar metodologías reales de Buy&Sell; confirmar si Estadio Render es material público o privado.
