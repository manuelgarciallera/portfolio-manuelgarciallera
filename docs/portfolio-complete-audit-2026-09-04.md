# Auditoría completa del portfolio

Fecha: 4 de septiembre de 2026  
Superficie: producción (`https://portfolio-manuelgarciallera.vercel.app`) y código local asociado  
Alcance: responsive, accesibilidad, rendimiento, SEO, robustez y contenido. No se ha rediseñado ni reescrito contenido.

## Resumen ejecutivo

La base del portfolio es estable: todas las rutas auditadas responden, no existe overflow horizontal de documento, las imágenes cargan, el build y TypeScript finalizan correctamente y las pruebas unitarias pasan. Desktop rinde muy bien. Las prioridades reales son el Web Worker del hero, el rendimiento móvil, el acceso por teclado a regiones desplazables, algunos objetivos táctiles y la consolidación futura del CSS responsive.

## Evidencia y método

- 10 rutas de producción.
- 6 viewports: 360×800, 390×844, 768×1024, 1024×768, 1440×900 y 1920×1080.
- 60 combinaciones verificadas mediante Playwright.
- 30 capturas completas y 10 capturas adicionales tras recorrer las páginas.
- 20 comprobaciones axe/WCAG (10 rutas × mobile/desktop).
- Lighthouse de producción en mobile y desktop.
- Inspección de cabeceras HTTP, metadatos, sitemap, robots, JSON-LD, assets y dependencias.
- ESLint, TypeScript, build, checks responsive y 108 pruebas unitarias.

Datos brutos:

- `.audit/complete-2026-09-04/production-audit.json`
- `.audit/complete-2026-09-04/axe-audit.json`
- `.lighthouse/report-mobile.report.html`
- `.lighthouse/report-desktop.report.html`

Capturas representativas aceptadas:

- `.audit/complete-2026-09-04/evidence-home-mobile.png`
- `.audit/complete-2026-09-04/evidence-theuxunion-mobile.png`
- `.audit/complete-2026-09-04/evidence-buysell-desktop.png`

## 1. Auditoría técnica y responsive

### Confirmado

- 60/60 navegaciones devolvieron HTTP 200.
- 0 documentos con overflow horizontal real.
- 0 imágenes rotas.
- 0 imágenes sin atributo `alt`.
- No se detectó solapamiento generalizado del layout.
- Los aparentes overflows internos pertenecen principalmente a carruseles, raíles animados, elementos decorativos y regiones diseñadas para desplazamiento horizontal; el documento no crece lateralmente.
- Los supuestos recortes de texto detectados automáticamente corresponden en su mayoría a texto solo para lectores de pantalla, máscaras de animación y títulos con reveal. Las capturas no muestran texto corrido truncado en las aperturas revisadas.
- La única supuesta deformación repetida era el logo Buy&Sell dentro de una transformación 3D. La relación visual calculada desde `getBoundingClientRect()` queda alterada por la perspectiva; el recurso no está deformado en la captura.

### Riesgos

**P1 — Error de Web Worker en la portada.** El hero registra repetidamente fallos `importScripts` y `worker module init function failed to rehydrate`. Se reproduce en los seis tamaños y también aparece en Lighthouse. El resto de rutas no genera errores. El origen probable es el texto WebGL de `@react-three/drei`/Troika dentro del Canvas. Debe aislarse y corregirse con comparación visual del hero, porque retirarlo o sustituirlo puede alterar la pieza 3D.

**P2 — Objetivos táctiles pequeños.** Las pestañas internas de casos miden aproximadamente 22 px de alto y los enlaces numerados del preludio unos 15 px. Algunos enlaces editoriales quedan entre 16 y 21 px. Aunque la separación evita muchas pulsaciones accidentales, conviene ampliar el área interactiva mediante padding o pseudo-elemento sin aumentar necesariamente la tipografía.

**P3 — Validación visual de secuencias sticky.** Las páginas completas incluyen grandes recorridos de scroll vinculados a animaciones. Una captura `fullPage` no representa correctamente todos sus estados. Las secuencias deben seguir validándose por estados de viewport, no mediante una única imagen vertical.

## 2. Accesibilidad

### Confirmado

- Lighthouse de portada: 100/100.
- Axe revisó 20 combinaciones y encontró solo dos reglas distintas.
- Existe skip link.
- Existe foco global visible de 2 px con offset.
- Formularios con etiquetas asociadas, autocompletado y región de estado `aria-live`.
- Navegación móvil bloquea correctamente el fondo y restaura el estado.
- Las imágenes informativas tienen alternativa; las decorativas usan `alt=""`/`aria-hidden`.
- `lang`, landmarks, un `main` y un `h1` por ruta auditada.
- `prefers-reduced-motion` está contemplado en las piezas principales.

### Corregido sin impacto visual normal

- La comparación Figma/Angular saltaba de `h2` a `h4`; sus subtítulos ahora son `h3` y mantienen exactamente el mismo selector visual.
- Las regiones desplazables de stack, código y mapeo de datos ahora pueden recibir foco de teclado. El aspecto solo cambia al navegar con teclado, mostrando el foco ya definido por el sistema.
- Eliminado un aviso de lint en un script auxiliar de QA.

### Pendiente con decisión visual

**P2 — Contraste de los números inactivos del preludio Buy&Sell.** Axe mide 2,63:1 frente al mínimo de 4,5:1 para ese tamaño. Requiere elevar ligeramente su luminosidad.

**P3 — Rail decorativo de LaLiga.** Axe informa 1,72:1, pero el rail está marcado `aria-hidden="true"` y repite texto puramente ambiental. No es una barrera para lectores de pantalla. Mejorarlo es una decisión estética, no una corrección semántica imprescindible.

### Límite de evidencia

La automatización no acredita conformidad WCAG completa. Queda una prueba manual breve con NVDA/VoiceOver: orden de lectura, anuncio del menú, carruseles, formulario y cambios de estado.

## 3. Rendimiento

### Producción

| Métrica | Mobile | Desktop |
| --- | ---: | ---: |
| Performance | 65 | 97 |
| FCP | 2,6 s | 0,7 s |
| LCP | 5,3 s | 1,1 s |
| TBT | 450 ms | 10 ms |
| TTI | 8,5 s | 1,9 s |
| CLS | 0 | 0 |
| Transferencia inicial | 1.068 KiB | 1.003 KiB |

### Prioridades

**P1 — Diferir el 3D del hero en mobile.** Lighthouse estima unos 198 KiB de JavaScript no utilizado. Three, React Three Fiber, Drei y materiales del hero concentran el coste de parseo/ejecución. Mantener el fallback estático hasta proximidad/idle y cargar el Canvas después mejoraría LCP/TBT sin cambiar la composición final.

**P1 — Resolver el Worker del texto 3D.** Además del error, su reintento añade trabajo inútil.

**P2 — Medición real.** `/api/web-vitals` valida y escribe métricas en logs, pero no crea histórico. Integrar Speed Insights o un almacén agregado permitiría decidir con datos de usuarios y no solo laboratorio.

**P3 — Imágenes.** Lighthouse estima únicamente unos 20 KiB ahorrables en mobile. No es la prioridad; los assets grandes ya están en WebP y el archivo público mayor es el GLTF del teléfono, 522 KiB.

## 4. SEO y metadatos

### Confirmado

- Metadata global y metadata específica para listados, artículos y casos.
- `metadataBase`, canonical, title, description, autores e iconos.
- Open Graph y Twitter Card.
- Imagen social generada a 1200×630.
- `robots.txt` válido y exclusión de `/lab/`.
- Sitemap con páginas, cuatro artículos y cuatro casos publicados.
- JSON-LD de `WebSite`, `Person`, `ProfilePage`, `Article` y `CreativeWork` para casos.
- Páginas de laboratorio y 404 con directivas de indexación apropiadas.
- Lighthouse SEO: 100 en mobile y desktop.

### Recomendaciones sin urgencia

- Cuando exista CMS, derivar `lastModified` de la fecha real del contenido y no de una fecha global fija.
- Añadir `dateModified` y, cuando sea cierto, imágenes específicas por artículo/proyecto.
- Validar periódicamente los datos estructurados en producción tras cambios de contenido.

## 5. Robustez del código

### Confirmado

- `next build`: correcto; 27 páginas generadas.
- TypeScript: correcto.
- 29 archivos de prueba y 108 pruebas unitarias: todos correctos.
- ESLint: 0 errores. El aviso del script auxiliar ha sido eliminado localmente.
- Checks de encoding, hero, tipografía responsive y navegación móvil: correctos.
- Los casos se alimentan desde un modelo de datos común; no son cuatro páginas independientes copiadas.
- El formulario valida tamaño, tipo, campos, honeypot y frecuencia básica.
- Producción entrega CSP, HSTS, COOP, X-Frame-Options, nosniff, Permissions Policy y cache HIT.

### Riesgos

**P2 — CSS monolítico.** `redesign.css` tiene 1.721 líneas y `responsive.css` 87. Hay media queries fragmentadas en 760, 767, 768, 900 y 1179 px, además de reglas añadidas al final y bloques minificados en una sola línea. No produce una rotura actual, pero aumenta el riesgo de contradicciones.

Recomendación: refactor posterior por capas (`tokens`, `shell`, `home`, `case`, `articles`, `responsive`) y consolidación de breakpoints. Debe hacerse con comparación visual automatizada, no como limpieza masiva.

**P2 — Rate limiting serverless.** El formulario usa un `Map` en memoria. Limita una instancia, pero no todas las instancias de Vercel. Si aparece abuso, moverlo a protección de plataforma o almacenamiento distribuido.

**P3 — CSP permisiva.** `unsafe-inline` y `unsafe-eval` reducen la protección. Endurecerla con nonce/hash requiere una tarea independiente y pruebas de Next.js, Three y animaciones.

**P3 — Dependencias.** Existen actualizaciones menores y mayores disponibles. No se han aplicado durante la auditoría para evitar regresiones. `npm audit` no completó por timeout del registro; debe repetirse con conectividad estable.

## 6. Inventario de contenido — sin reescritura

### Inconsistencias terminológicas

1. La misma sección se llama `Blog` en navegación, `Artículos` en CTA/URL/metadata y `Cuaderno` en breadcrumb e introducción. Conviene elegir una denominación principal y dejar las otras como descriptor.
2. Aparecen `Full Stack`, `Full stack` y `full stack`. Conviene fijar una capitalización editorial.
3. La marca aparece como `LaLiga` en el caso, mientras la marca corporativa suele comunicarse como `LALIGA`. Debe decidirse según el uso autorizado y mantenerlo estable.
4. Se alternan `IA`, `IAs`, `inteligencia artificial`, `agente` y `asistente`. No siempre son equivalentes; un glosario editorial evitaría ambigüedad.

### Repeticiones deliberadas que conviene vigilar

- `sistema`, `criterio`, `decisiones`, `evidencia`, `implementación` e `IA` forman el discurso central y no deben eliminarse mecánicamente.
- En Coordination Hub y TheUXUnion, varias secciones repiten la oposición “la IA acelera / la persona decide”. Mantener el principio una vez con fuerza y usar después pruebas concretas podría reducir fatiga.
- La fórmula “de X a Y” aparece en títulos, proof points y CTAs. Funciona como recurso editorial, pero pierde fuerza si se acumula.

### Densidad

- Coordination Hub contiene los párrafos más largos y abstractos; necesita una futura revisión de escaneabilidad, no de argumento.
- Las disclosures de Buy&Sell y LaLiga son importantes para autoría y confianza; no deben resumirse hasta perder su función.
- Las fichas superiores combinan contexto, contribución, stack, año, proof points y colaboración. La información es valiosa, pero debe vigilarse su repetición posterior dentro del relato.

## Priorización final

### Corregible sin cambio visual relevante

1. Jerarquía `h3` de la comparación — corregida localmente.
2. Foco en regiones desplazables — corregido localmente.
3. Aviso de lint del script QA — corregido localmente.
4. Persistir Web Vitals o instalar Speed Insights.
5. Mejorar el script Lighthouse para distinguir inequívocamente dev y producción.
6. Añadir checks automáticos de enlaces, sitemap y metadata.

### Requiere revisión visual antes de tocar

1. Worker/Text del hero 3D.
2. Carga diferida del Canvas y fallback móvil.
3. Contraste de numeración inactiva.
4. Ampliación de objetivos táctiles.
5. Consolidación del CSS responsive.
6. Contraste del rail decorativo LaLiga, solo si se quiere reforzar su presencia.

### Se deja expresamente intacto

- Jerarquía visual y tamaños tipográficos.
- Composición, espacios y colores.
- Movimiento y tiempos de animación.
- Recorte y tamaño de imágenes.
- Textos y nomenclatura visible.
- Contenido y orden de proyectos/artículos.

## Estado de cada paso del recorrido

1. Inicio y navegación — saludable; error técnico del Worker en segundo plano.
2. Índice de proyectos — saludable; sin overflow de documento ni imágenes rotas.
3. Buy&Sell — saludable; pendiente contraste de numeración y tamaños táctiles.
4. LaLiga — saludable; rail decorativo de bajo contraste, sin impacto semántico.
5. Coordination Hub — saludable; regiones de código desplazables corregidas para teclado.
6. TheUXUnion — saludable; aperturas mobile/desktop equilibradas en las capturas revisadas.
7. Índice de artículos — saludable.
8. Lectura de artículo — saludable; algunos enlaces tienen área táctil estrecha.
9. Proceso — saludable.
10. Sobre mí y contacto — saludable; formulario correctamente etiquetado.

## Criterio de producción

La auditoría de producción se ha realizado contra el despliegue actual. Las tres correcciones invisibles están verificadas localmente y no aparecerán en producción hasta el siguiente despliegue. No se ha publicado automáticamente para no mezclar una auditoría con un lanzamiento del resto del worktree, que contiene numerosos cambios en curso.
