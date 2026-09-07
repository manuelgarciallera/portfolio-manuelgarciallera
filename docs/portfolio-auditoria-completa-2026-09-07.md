# Auditoría completa del portfolio · 7 de septiembre de 2026

Superficie: producción (`portfolio-manuelgarciallera.vercel.app`, `x-vercel-cache: HIT`, `age: 266094` → el despliegue vivo tiene ~3 días) y código local en `codex/checkpoint-pre-editor-2026-09-04`.
Fuera de alcance: `owner-platform`.

**Método.** Renderizado real de cada ruta en iframes de ancho controlado (320/360/768/1440) desde el navegador de Manuel, midiendo por elemento `getBoundingClientRect`, `scrollWidth/clientWidth`, `overflow-x`, `tabIndex` y tamaño de objetivos táctiles; axe-core 4.10 WCAG 2.0/2.1 A+AA; cabeceras y HTML servido de las 8 rutas indexables vía HTTP directo; `PerformanceResourceTiming` con `decodedBodySize` sobre una carga limpia; lectura del repositorio.

---

## Lo que importa, en cuatro frases

1. **El sitio no es indexable.** Todos los canonical, el sitemap y el `Host` de robots apuntan a `manuelgarciallera.com`, un dominio que no responde desde tres puntos distintos. Google recibe la orden de indexar una URL que no existe.
2. **La home carga 1,77 MB de JavaScript** en 21 archivos, uno solo de 867 KB, y es un árbol de cliente completo: `app/page.tsx` monta un componente `'use client'`, así que no hay un solo componente de servidor en toda la página.
3. **768 px está roto**: la sección «Now» de la home se renderiza de 430 a 814 px en un viewport de 753 y `.rd-root` la recorta. Un iPad en vertical no ve esa sección.
4. **El pie de página pierde 124 px en móvil, en todas las rutas** (`cw 360 / sw 484`, `overflow: hidden`).

---

## P0

### P0-1 · Canonical y sitemap apuntan a un dominio que no responde

| Comprobación | Resultado |
|---|---|
| `curl https://manuelgarciallera.com/` (contenedor) | `SSL routines::tlsv1 alert internal error` |
| WebFetch sobre el mismo dominio | fallo de TLS al pedir robots.txt |
| `fetch(..., {mode:'no-cors'})` desde el navegador de Manuel | `Failed to fetch` (fallo de red, no de CORS) |

Mientras tanto, las 8 rutas servidas declaran:

```
<link rel="canonical" href="https://manuelgarciallera.com/…">
robots.txt →  Host: https://manuelgarciallera.com
              Sitemap: https://manuelgarciallera.com/sitemap.xml
sitemap.xml → 15 URLs, todas bajo manuelgarciallera.com
```

Efecto: el contenido vive en `vercel.app` y cada página le dice al buscador que la versión buena está en otro sitio inalcanzable. No se indexa ni una cosa ni la otra. Además el sitemap incluye `/humans.txt` y `/.well-known/security.txt`, que no son páginas.

**Corrección.** O se apunta el dominio a Vercel hoy, o el `metadataBase` y el sitemap pasan a la URL que realmente sirve el contenido. No hay tercera opción: cada día en este estado es un día sin indexar.

### P0-2 · Cero datos estructurados

No hay ni un `application/ld+json` en el HTML servido de ninguna ruta. Para un perfil cuyo objetivo declarado es que «se entienda bien quién soy» y que quiere aparecer ante supervisores y recruiters, faltan las tres entidades básicas: `Person` (con `sameAs` a LinkedIn, ORCID y Google Scholar), `BreadcrumbList` y `Article`/`CreativeWork` en artículos y casos. Es la vía más directa para que el nombre genere un panel de conocimiento.

### P0-3 · 1,77 MB de JavaScript y una home 100 % cliente

Carga limpia de `/` (tamaños descomprimidos):

| Tipo | Peticiones | Peso |
|---|---|---|
| JavaScript | 21 | **1 766 KB** |
| Imágenes | 27 | 717 KB |
| CSS | 3 | 131 KB |
| Fuente | 1 | 38 KB |
| **Total** | | **≈ 2 710 KB** |

Los cuatro fragmentos mayores: **867 KB**, 221 KB, 142 KB, 131 KB.

Dos causas identificadas en el código:

- `src/app/page.tsx` renderiza `PortfolioRuntime`, que es `'use client'`, y este renderiza `RedesignPage`, también `'use client'`. Toda la home se hidrata en cliente: 31 de 78 archivos llevan `'use client'`. Next 16 con App Router aquí no aporta nada.
- El orbe carga `three` + `@react-three/drei` en cuanto monta el `Hero`, sin condición. `next/dynamic` lo separa en un fragmento, pero ese fragmento se pide siempre, también en un móvil de gama media, para una pieza decorativa que ya tiene fallback estático (`hero-refractive-orb-fallback-v2.webp`).

**Correcciones, por orden de rentabilidad:**

1. Condicionar `HeroOrbCanvas` a `prefers-reduced-motion: no-preference` **y** a un umbral de capacidad (`matchMedia('(min-width: 768px)')`, `navigator.hardwareConcurrency`, `deviceMemory`), sirviendo el `webp` en el resto. Ahorro estimado: el fragmento de 867 KB en móvil.
2. Bajar la frontera de cliente: `Hero`, `CasesSection` y `CapabilityAccordion` necesitan interactividad; `ManifestoSection`, `ContactSection` (salvo el formulario), `Footer` y el contenido tipado no. Que `RedesignPage` deje de ser `'use client'` es el cambio de mayor impacto.
3. `TechStack.tsx` importa 16 iconos del barril raíz de `simple-icons` (21 MB en `node_modules`). Añadirlo a `experimental.optimizePackageImports` o importar por ruta directa.
4. `@splinetool/react-spline` y `@react-three/postprocessing` solo los usa `/lab`, que está en `Disallow`. Verificar que no entran en el bundle de la home.

---

## P1 · Responsive, por breakpoint

Medido con `overflow-x` real; `.rd-root { overflow-x: clip }` hace que `document.scrollWidth` sea siempre correcto y **oculta todos estos casos**: por eso la auditoría del 4 de septiembre informó de «0 overflow horizontal» sin equivocarse y sin ver nada.

### 768 px — el peor breakpoint

| Elemento | Medida | Efecto |
|---|---|---|
| `.rd-root` | cw 753 / sw 814 | 61 px recortados en toda la página |
| `.rd-now__list` + su `h2`, `p` y `figure` | 430..814 | La sección «Now» queda fuera de pantalla |
| `.rd-research-artifact` | cw 468 / sw 576 | recortado |
| `.rd-research-copy` | cw 256 / sw 437 | recortado |

En la ficha de caso a 768: `form.rd-contact-form` 406..758 y `p.rd-label` 88..758, ambos al borde.

### 360 px

| Elemento | Medida | Rutas |
|---|---|---|
| `footer.rd-footer` | cw 360 / sw 484, `overflow: hidden` | **todas** |
| `a.rd-brand` / `span.rd-brand-wordmark` | cw 161-163 / sw 345 | **todas** — el nombre del propietario del sitio sale recortado en la cabecera |
| `.rd-case-visual` (buy-sell, laliga, coordination) | cw 375 / sw 413 | home, /casos, fichas |
| `.rd-preview-slide` | 22..405 (transform `matrix(1.035,…,15,0)`) | todas las tarjetas: 45 px de imagen fuera |
| `dl.rd-meta-grid` | cw 328 / sw 397-522 | todas las fichas de caso |
| `figure.rd-buy-sell-scene` | cw 360 / sw 390 | ficha Buy&Sell |
| `aside.rd-next-case` | cw 360 / sw 368 | fichas |
| `.rd-article-cover--material` | cw 296 / sw 320 | /articulos |
| `main.rd-article-page` | cw 360 / sw 375 | ficha de artículo |
| botones de pestaña | -188..-106, -101..-37, -32..50 | laliga y theuxunion: pestañas renderizadas fuera por la izquierda |

### 1440 px

`.rd-research-copy` cw 469 / sw 820 y `.rd-cases` cw 1093 / sw 1267 con `overflow: visible`: el contenido excede su caja sin recortarse, así que se superpone con lo vecino en lugar de desbordar. Revisar visualmente.

---

## P1 · Usabilidad táctil

### Regiones desplazables sin acceso de teclado

axe-core lo confirma en `/casos/buy-sell-marketplace` a 375 px: `scrollable-region-focusable`, impacto **serio**, 3 nodos. Medido elemento a elemento:

| Elemento | cw / sw | `tabIndex` |
|---|---|---|
| `nav.rd-phase-nav` | 360 / 528-539 | −1 |
| `p.rd-data-mapping` | 326 / **916** | −1 |
| `pre.rd-code` | 327 / 463 | −1 |
| `div.rd-preview-tabs` | 320-329 / 373-528 | −1 |

`p.rd-data-mapping` es especialmente grave: 916 px de contenido en una caja de 326 px, sin barra, sin sombra, sin foco. Nadie sabe que hay texto a la derecha.

Ninguna de estas regiones acepta gesto táctil propio más allá del scroll nativo, y la navegación sticky de fases —la pieza que vertebra la lectura del caso— es una de ellas.

### Objetivos táctiles por debajo de 44 px

Recuento a 360 px, cajas reales:

| Elemento | Tamaño | Dónde |
|---|---|---|
| `a` «Ver evidencia →» | 115 × **21** | home, ×4 |
| enlaces del preludio «01 Identidad» | 76 × **15** | ficha Buy&Sell |
| `a.rd-article-related` | 286 × **20** | ficha de artículo |
| «Conectar en LinkedIn ↗» | 136 × **16** | ficha de artículo |
| `a.rd-editorial__all` | 179 × 24 | /articulos |
| `a.rd-brand` | 163 × **29** | todas |
| pestañas del carrusel | 104 × 31 | todas |
| `a.rd-mobile-nav-contact` | 111 × 33 | todas |
| `a.rd-skip-link` | 135 × 34 | todas |
| enlaces de navegación | 51-88 × 30-35 | todas |
| `button.rd-theme-btn` | **38 × 38** | todas |

### Gestos que faltan

Además del carrusel (ya corregido hoy), estas superficies son horizontales y solo responden a scroll nativo, sin arrastre asistido ni indicación visual de continuidad: `nav.rd-phase-nav`, `.rd-preview-tabs`, `.rd-more-articles` (carrusel con `scroll-snap` en `/articulos`), `pre.rd-code` y `p.rd-data-mapping`.

---

## Accesibilidad

Lo bueno: axe no encuentra **ninguna** violación WCAG A/AA en la home en escritorio. Skip link, foco visible, `lang`, un `main` y un `h1` por ruta, `alt` en todas las imágenes, `prefers-reduced-motion` contemplado. La base está bien hecha.

Lo que falla:

- `scrollable-region-focusable` (serio, 3 nodos) en las fichas de caso.
- **Orden de encabezados roto en todas las fichas de caso.** Secuencias medidas: `12222244232` (Buy&Sell), `12432` (LaLiga), `124232` (TheUXUnion). Hay saltos h2→h4 y retrocesos h4→h3. Un lector de pantalla no puede construir el índice del caso.

---

## Rendimiento

`TTFB` 63-143 ms y `x-vercel-cache: HIT`: la entrega es excelente. El problema es todo lo que se descarga después.

- 1 766 KB de JS es el techo real de la experiencia móvil, muy por encima de las imágenes.
- 37 `<img>` en la home; 27 peticiones de imagen, 717 KB. Ninguna sobredimensionada: `next/image` está bien configurado.
- `public/` pesa 6,2 MB. Piezas notables: `models/phone.gltf` 510 KB, `art/research-stained-glass-v1.webp` 389 KB, tres capturas de TheUXUnion entre 262 y 279 KB.
- Una sola fuente, 38 KB. Correcto.
- `cache-control: public, max-age=0, must-revalidate` en el documento: correcto para HTML.

---

## Código

- 31 de 78 archivos son `'use client'`, empezando por la raíz de la home.
- `ProjectPreviewCarousel.tsx` tiene 197 líneas y `CasePage.tsx` 176, por encima del límite de 150 que fija el propio proyecto.
- Quedan 23 archivos `.jsx` heredados en `src/features/portfolio`. Solo `/lab/spline` y el `PortfolioRuntime` de una línea los tocan; el resto es superficie muerta que sigue en el árbol.
- `redesign.css` acumula 1 824 líneas en un único archivo, con reglas del carrusel repartidas entre las líneas 757-781, 1015-1027, 1163-1178, 1268-1274 y 1777-1778. Cualquier cambio en el carrusel obliga a tocar cinco bloques distintos.
- Sin versión en inglés ni `hreflang`, cuando el plan de fase 1 contemplaba ES+EN. Para el objetivo suizo, la ausencia de la versión inglesa es una limitación de alcance, no de estética.

---

## Ya corregido hoy (commits `878d9ea` y `1b3ddb0`)

CSP `blob:` para el worker de Troika (el nombre dentro del orbe), swipe horizontal en el carrusel con cancelación del enlace, controles del carrusel siempre visibles en `(pointer: coarse)`, `min-width: 0` y una sola columna en `.rd-meta-grid` bajo 768 px, objetivos táctiles del carrusel y del preludio a 44 px, máscara en la tira de pestañas. Detalle en `docs/portfolio-usabilidad-movil-2026-09-07.md`.

Nada de esto está desplegado todavía.

---

## Orden de trabajo

**Hoy**

1. Push de la rama (sigue sin copia remota desde el 18 de marzo).
2. Decidir el dominio y alinear canonical, `metadataBase`, robots y sitemap. Retirar `humans.txt` y `security.txt` del sitemap.
3. `npm run check:all` en Windows y desplegar lo ya corregido.

**Esta semana**

4. `.rd-root { overflow-x: clip }` → sustituir por una comprobación por elemento en el script de QA, para que estos fallos vuelvan a ser visibles en lugar de silenciados.
5. Los cuatro desbordes universales: pie de página, marca de la cabecera, `.rd-case-visual` y `.rd-preview-slide`.
6. La sección «Now» a 768 px.
7. `tabIndex={0}` + `role="region"` + `aria-label` en las cuatro regiones desplazables, y afordancia visual de continuidad.
8. Orden de encabezados en las tres fichas de caso.

**Siguiente**

9. Condicionar el orbe 3D por capacidad del dispositivo y bajar la frontera de cliente en `RedesignPage`.
10. JSON-LD `Person` + `BreadcrumbList` + `Article`.
11. Objetivos táctiles del resto del sitio.
12. Trocear `redesign.css` por componente.

## Cómo reproducir

Ninguna de estas medidas necesita herramientas nuevas: se obtienen con `getBoundingClientRect`, `scrollWidth/clientWidth`, `tabIndex` y `PerformanceResourceTiming` sobre la página servida. Merece la pena convertirlas en un script de QA en `scripts/`, porque el criterio actual —desbordamiento del documento— da verde sobre una página con 61 px recortados.

---

# Adenda · correcciones aplicadas y rectificaciones (7 sep, tarde)

## Rectificaciones al informe anterior

Al ir a corregir, tres hallazgos no resistieron la comprobación. Quedan retirados:

- **El pie de página no está roto.** Su único hijo que desborda es `img.rd-footer-artwork`, decorativa y con `aria-hidden="true"`, recortada a propósito por el `overflow: hidden` del pie. El contenido real (los dos `span` y el `nav`) cabe holgadamente: 24..336 en un viewport de 360.
- **`.rd-case-visual` tampoco.** Sus hijos que salen del marco son la aurora, la rejilla, los planos y las monedas de la portada editorial: sangrado intencionado. La única excepción es `.rd-preview-viewport` (29..396 a 360 px), que recorta ~36 px del borde derecho de cada diapositiva por el `transform: matrix(1.035,0,0,1.035,15,0)`. Es una decisión de encuadre, no un fallo; queda anotada, sin tocar.
- **El orden de encabezados y dos de las tres regiones sin foco ya estaban corregidos en el código.** No queda ni un `<h4>` en `src/features/redesign`, y `pre.rd-code`, `p.rd-data-mapping` y `.rd-tech-stack` ya llevan `tabIndex={0}`. Lo que axe encuentra es el despliegue de hace tres días, no el repositorio.

Esa última rectificación cambia la conclusión del informe: **una parte de lo auditado se arregla desplegando.**

## Aplicado en `28c960b`

### 1. Los datos estructurados no llegaban al HTML — `layout.tsx`, `casos/[slug]`, `articulos/[slug]`

El JSON-LD estaba bien construido (`WebSite`, `Person`, `ProfilePage`, `Article` y el de cada caso) pero se emitía con `next/script`, cuyo `strategy` por defecto es `afterInteractive`. En el HTML servido no hay una sola etiqueta `<script type="application/ld+json">`: lo que hay es el payload de React con el contenido escapado,

```
application/ld+json\",\"dangerouslySetInnerHTML\":{\"__html\":\"{\\\"@context\\\":\\\"https://schema.org\\\"…
```

es decir, props serializadas para inyectar tras la hidratación. Un rastreador que no ejecute JavaScript —LinkedIn, Slack, Bing, la mayoría de validadores— no ve absolutamente nada.

Corrección: `<script type="application/ld+json">` normal en el JSX, renderizado en servidor. `Script` sigue usándose para `theme-init`, que sí necesita `beforeInteractive`.

**Verificar:** `curl` a `/`, `/casos/<slug>` y `/articulos/<slug>` debe devolver `"@type":"Person"`, `"@type":"Article"`, etc. en texto plano.

### 2. La banda de 768 px — `responsive.css`

`.rd-now` declara `grid-template-columns: minmax(18rem,.72fr) minmax(24rem,1.28fr)`: 672 px de mínimos más `gap: clamp(2rem,7vw,8rem)` y dos gutters. En un viewport de 753 px la segunda columna se resolvía en 430..814 y `.rd-root { overflow-x: clip }` se la comía.

La regla de móvil que ya existía (`max-width: 760px`, columna única) se extiende a la banda 761–1023 px. A partir de 1024 la composición de dos columnas queda intacta.

Medido en producción inyectando la regla: la lista pasa de `430..814` a `88..664`, y el recorte del root baja de 814 a 760.

Detectado de paso: el proyecto mezcla cortes en `760px` y `767px` según el bloque. La franja 761–767 se comporta de forma distinta a ambos lados. Merece una normalización aparte.

### 3. Regiones desplazables alcanzables — `CaseBlocks.tsx`, `ProjectPreviewCarousel.tsx`

`nav.rd-phase-nav` (cw 360 / sw 528) y `div.rd-preview-tabs` (cw 320 / sw 528) eran las dos que faltaban: `tabIndex={0}`, `role="group"` en la tira de pestañas, foco visible y máscara de degradado en el borde derecho para que se entienda que el contenido sigue.

### 4. La marca fantasma — `responsive.css`

`.rd-brand-wordmark` ya estaba oculta bajo 768 px con `opacity: 0`, pero con `white-space: nowrap` seguía reservando 345 px de rejilla en la cabecera. `display: none` en esa franja; el monograma, que es lo que se ve, define el ancho.

### 5. Peso y sitemap

`simple-icons` añadido a `experimental.optimizePackageImports`: `TechStack.tsx` importa 16 iconos del barril raíz de un paquete de 21 MB. Y fuera del sitemap `humans.txt` y `.well-known/security.txt`, que no son páginas.

## Verificado

`tsc --noEmit`, `eslint` sobre `src/app` y `src/features/redesign`, y los cinco guardas del repositorio (`check:hero`, `check:responsive-type`, `check:mobile-nav`, `check:encoding`, `check:public-boundary`) en verde, más `public-guards` (11 pass) y `owner-isolation` (8 pass).

`vitest` y `next build` siguen sin poder ejecutarse desde esta sesión: `node_modules` tiene binarios de Windows. **`npm run check:all` en Windows antes de desplegar.** Las aserciones de los tests unitarios que tocan estos componentes son `toContain` sobre subcadenas que no he eliminado, así que no deberían romperse; conviene confirmarlo.

## Pendiente y por qué no lo he tocado

1. **Dominio y locale.** El destino es `https://manuelgarciallera.com/es`. Hoy `SITE_URL` (ya configurable por `NEXT_PUBLIC_SITE_URL`) resuelve a `https://manuelgarciallera.com` sin segmento de idioma, así que todos los canonical y las 13 URLs del sitemap apuntarían a `/casos`, no a `/es/casos`. Eso es una decisión de enrutado —`app/[locale]/`, `hreflang` ES/EN, redirección de `/` a `/es`— que no debo tomar yo. Mientras el dominio no responda, ningún canonical apunta a nada servible.
2. **1,77 MB de JavaScript.** Bajar la frontera de cliente en `RedesignPage` y condicionar el orbe 3D por capacidad del dispositivo son los dos cambios de mayor impacto, y los dos alteran comportamiento visible: no los hago sin poder ejecutar `next build` ni comparar capturas.
3. **`.rd-preview-viewport`**: los 36 px recortados de cada diapositiva son encuadre deliberado. Decisión de Manuel.
4. **`.rd-research-copy` a 1440** (cw 469 / sw 820, `overflow: visible`): el contenido excede su caja sin recortarse, así que se superpone con lo vecino en lugar de desbordar. Requiere revisión visual, no medición.
