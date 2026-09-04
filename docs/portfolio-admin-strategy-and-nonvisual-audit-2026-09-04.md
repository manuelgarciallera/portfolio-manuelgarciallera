# Estrategia de administración y auditoría técnica no visual

Fecha: 4 de septiembre de 2026

## Decisión ejecutiva

- Sí conviene crear un acceso privado de autor para Manuel.
- No conviene abrir cuentas a visitantes mientras no exista una utilidad recurrente y exclusiva que las justifique.
- La primera versión debe resolver publicación, previsualización, control de calidad y estadísticas; no debe intentar convertirse en un constructor visual completo.
- La opción recomendada para este portfolio es Sanity Studio integrado con Next.js. Payload es una alternativa sólida si se prioriza control total sobre simplicidad operativa.

## Qué debería resolver el panel privado

### Primera versión

1. Blog: título, entradilla, cuerpo enriquecido, imágenes, pies, enlaces, autor, fecha, etiquetas y tiempo de lectura.
2. Flujo editorial: borrador, preview privado, publicación, despublicación y revisión anterior.
3. SEO: slug, title, description, canonical, imagen social y previsualización del resultado.
4. Medios: texto alternativo obligatorio, pie, punto focal, dimensiones y aviso de peso excesivo.
5. Proyectos: orden, destacado, ficha, portada, textos, stack, fases, galería y siguiente caso.
6. Panel de estado: borradores, contenido publicado, enlaces rotos, imágenes incompletas y contenido desactualizado.

### Segunda versión

- Programación de publicaciones.
- Histórico y restauración.
- Analítica resumida por artículo y proyecto.
- Eventos de negocio: apertura de caso, finalización de caso, clic en contacto, LinkedIn y CV.
- Exportación/backup del contenido.

### Editor de efectos viable

No se recomienda un editor libre de CSS/GSAP. Sí es viable un editor de presets limitado y seguro:

- tipo de entrada;
- dirección;
- duración y retardo dentro de límites;
- intensidad;
- umbral de viewport;
- repetición o ejecución única;
- reproducción automática;
- alternativa para `prefers-reduced-motion`;
- preview y botón de restaurar valores.

El componente visual sigue en código; el panel solo modifica parámetros validados. Esto conserva la dirección artística y evita combinaciones que rompan responsive o rendimiento.

## Arquitecturas comparadas

| Opción | Ventajas | Coste real | Encaje |
| --- | --- | --- | --- |
| Sanity Studio | Editor maduro, datos estructurados, media, preview en vivo, poco mantenimiento, plan gratuito suficiente para un portfolio | Dependencia de servicio y modelado GROQ | Recomendado |
| Payload en el propio Next.js | Control total, panel integrado, auth, RBAC, borradores, versiones y preview | Base de datos, almacenamiento, copias, actualizaciones y más superficie de seguridad | Alternativa si el panel también debe ser un producto propio |
| MDX/Git | Barato, portable, versionado con Git | Mala experiencia para editar sin código; no es un panel editorial real | Solo como solución mínima |
| Panel completamente personalizado | UX exacta y extensible | Mayor coste y riesgo; se reconstruyen editor, auth, historial y media | No para la primera fase |

Sanity ofrece actualmente un plan gratuito con Studio, base de contenido alojada y visual editing; Growth añade funciones editoriales avanzadas. Payload proporciona panel, borradores, publicación programada, versiones y control granular, pero su operación queda a cargo del proyecto.

## Autenticación

### Autor

- Una cuenta privada sin registro público.
- MFA o passkey cuando el proveedor lo permita.
- Autorización en servidor y próxima al acceso a datos; ocultar un botón o una ruta no es seguridad.
- Sesiones en cookies `HttpOnly`, `Secure` y `SameSite`.
- Rutas administrativas dinámicas y sin caché compartida.
- Rate limiting, registro de acciones, backups y recuperación de cuenta.

Si se usa Sanity, su identidad y permisos cubren el acceso editorial. Si se usa Payload, su colección de administradores y access control evitan añadir un segundo sistema de auth. No conviene combinar CMS, Supabase y otro proveedor de identidad sin necesidad.

### Visitantes

No se recomienda ahora. Añadiría fricción, consentimiento, recuperación de cuenta, soporte y seguridad sin mejorar la función principal del portfolio. Solo debe reconsiderarse si aparece al menos una utilidad persistente:

- guardar lecturas o recursos;
- área privada para reclutadores con material específico;
- cursos, comunidad o recursos descargables;
- colaboración o feedback privado;
- personalización real entre visitas.

Comentarios, “likes” o guardar proyectos no justifican por sí solos el coste para este sitio.

## Analítica recomendada

Primera fase: Vercel Web Analytics y Speed Insights. Aportan páginas, procedencia, dispositivo y Web Vitals con datos agregados y sin cookies de terceros. En Hobby, Web Analytics incluye actualmente 50.000 eventos por ciclo y un mes de ventana; los eventos personalizados requieren Pro.

No hace falta construir un dashboard propio inicialmente. Si más adelante el panel lo resume, debe leer datos agregados y responder preguntas concretas:

- qué casos abren y terminan;
- qué artículo lleva a un caso;
- qué CTA conduce a contacto;
- qué dispositivo o ruta presenta peor rendimiento;
- qué contenido necesita actualización.

## Migración propuesta

1. Modelar `Article`, `Project`, `Media`, `Technology` y `MotionPreset`.
2. Importar el contenido actual manteniendo slugs y URLs.
3. Activar preview y borradores.
4. Migrar primero el blog.
5. Migrar después proyectos sin cambiar su presentación pública.
6. Añadir el editor de presets únicamente tras estabilizar el contenido.
7. Incorporar estadísticas agregadas al final.

El frontend público debe conservar render estático/caché. Publicar puede disparar revalidación selectiva, sin reconstruir ni convertir todo el sitio en una aplicación dinámica.

## Auditoría técnica no visual ejecutada

### Correcto

- `next build`: correcto; 27 páginas generadas y casos/artículos prerenderizados.
- TypeScript: correcto.
- ESLint: 0 errores; 1 aviso en un script auxiliar de auditoría.
- Checks de encoding, estructura del hero, tipografía responsive y navegación móvil: correctos.
- Lighthouse de producción, desktop: Performance 97, Accessibility 100, Best Practices 96, SEO 100.
- Lighthouse de producción, mobile: Performance 65, Accessibility 100, Best Practices 96, SEO 100.
- Desktop: LCP 1,1 s, TBT 10 ms y CLS 0.
- Mobile: LCP 5,3 s, TBT 450 ms, TTI 8,5 s y CLS 0.
- Cabeceras de producción: HTTPS/HSTS, CSP, COOP, X-Frame-Options, no-sniff, Permissions Policy y cache HIT.
- SEO: metadata global y específica, canonical, Open Graph, Twitter cards, sitemap, robots y JSON-LD para persona, web, artículos y casos.
- Assets públicos: el mayor archivo detectado es el modelo 3D de 522 KB; las imágenes principales están optimizadas en WebP.

### Prioridades técnicas

1. Rendimiento móvil: reducir el trabajo de JavaScript de portada y diferir Three/Spline/animaciones no críticas. Lighthouse estima unos 198 KB de JavaScript no utilizado.
2. Analítica: `/api/web-vitals` solo escribe métricas en logs; no existe persistencia ni cuadro histórico.
3. Formulario: la validación, honeypot, límite de tamaño y limitación básica están bien; el rate limit en memoria no es global entre instancias serverless. Si aumenta abuso, moverlo a almacenamiento compartido o protección de plataforma.
4. CSP: es amplia (`unsafe-inline` y `unsafe-eval`) por compatibilidad actual; endurecerla requiere trabajo específico con nonce/hash y pruebas de animación.
5. Auditoría de dependencias: `npm audit` no terminó por timeout del registro en esta ejecución; no debe declararse aprobada hasta repetirla con conectividad estable.
6. El script Lighthouse debería exigir explícitamente URL de producción o levantar un build local de producción para evitar resultados engañosos del servidor dev.

## Plan por fases

### Fase 0 — sin cambios visuales

- Resolver rendimiento móvil y persistencia de métricas.
- Corregir el aviso de lint del script auxiliar.
- Repetir auditoría de dependencias.
- Añadir pruebas de enlaces, metadata y rutas publicadas.

### Fase 1 — panel editorial mínimo

- Sanity Studio privado.
- Blog, medios, preview, borradores, SEO y publicación.
- Migración sin alterar URLs ni diseño.

### Fase 2 — proyectos

- Edición estructurada de casos, orden, destacado, stack y relación “siguiente caso”.
- Validadores para evitar textos incompletos, imágenes incorrectas o slugs duplicados.

### Fase 3 — autonomía visual segura

- Presets de movimiento con preview, límites, reduced motion e historial.
- Nunca edición arbitraria del layout de producción.

### Fase 4 — inteligencia editorial

- Resumen analítico, contenido desactualizado, enlaces rotos, oportunidades SEO y rendimiento por ruta.

## Fuentes primarias

- [Sanity: Visual Editing](https://www.sanity.io/docs/visual-editing)
- [Sanity: precios](https://www.sanity.io/pricing)
- [Payload: panel de administración](https://payloadcms.com/docs/admin/overview)
- [Payload: borradores](https://payloadcms.com/docs/versions/drafts)
- [Payload: versiones](https://payloadcms.com/docs/versions/overview)
- [Payload: control de acceso](https://payloadcms.com/docs/access-control/overview)
- [Next.js: autenticación](https://nextjs.org/docs/app/guides/authentication)
- [Vercel Web Analytics](https://vercel.com/docs/analytics)
- [Vercel: privacidad de Web Analytics](https://vercel.com/docs/analytics/privacy-policy)
- [Vercel: precios y límites de Web Analytics](https://vercel.com/docs/analytics/limits-and-pricing)
- [Vercel Speed Insights](https://vercel.com/docs/speed-insights)
