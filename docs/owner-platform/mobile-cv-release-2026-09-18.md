# CV accesible desde el menú móvil — 18 septiembre 2026

## Autoridad y alcance

Manuel aprueba probar «Descargar CV» en el menú móvil y poder volver atrás. Sin botón flotante, sin ampliar la barra desktop, sin mover el acceso de Sobre mí ni tocar el Hero. Reserva Hub `ce84fdd5-324a-4b03-ad43-7f26ab20646f`, tema `portfolio-profesional::mobile-cv`.

## Implementación

- `SiteHeader.tsx`: reutiliza `CvDownloads` y los PDF ES/EN existentes, dentro de la navegación móvil compartida por las páginas públicas.
- El foco incluye summary y calcula los enlaces visibles en cada Tab al abrir/cerrar el selector; Escape devuelve foco al botón de menú.
- `mobile-cv.css`: menú desplazable en pantallas bajas, con espacio seguro inferior. Desktop intacto.
- `SiteHeader.unit.test.tsx` y `scripts/verify-mobile-cv.mjs`: regresión y prueba real de descargas.

## Verificación local

- TDD: fallo esperado por ausencia de Descargar CV, luego GREEN; 280 tests / 45 archivos PASS.
- Build producción aislado `.owner-verification-builds/mobile-cv-20260918`, TypeScript y 30 páginas PASS. Inclusiones transitorias de tsconfig retiradas; baseline no modificada.
- Checks responsive, navegación móvil, frontera pública (22 entradas), Hero y ESLint focal PASS.
- Playwright Chromium: 320×568, 390×844, 768×900, 1280×900; inicio, artículos y Sobre mí. Descargas reales ES/EN, Tab con selector abierto/cerrado, ciclo de foco, Escape, scroll, ausencia de overflow y errores JS PASS. Desktop no muestra el nuevo acceso; Sobre mí conserva el suyo. Capturas de ambos temas en `.audit/mobile-cv/`; revisión visual 320 y 390.
- Presupuesto JS PASS sin elevar baseline: home 140244 raw / 51104 gzip; artículos 86403 / 30875. Diferencia respecto a anterior: +1538 raw / +466 gzip por ruta.
- No prueba en móvil físico; Manuel hará la revisión estética.

## Publicación y vuelta atrás

Pendiente de commit, CI y LIVE. Producción anterior a esta prueba: `dpl_7Tgi8U59Smf3za12qrr8RnnHVdJo`, runtime `5b6be4f` (conserva las portadas grandes del blog). Para deshacer solo esta prueba, revertir su commit, no restaurar el antiguo checkpoint del Hero.

## LinkedIn

Ayuda oficial consultada el 18/09/2026: el antiguo enlace de Creator Mode ya no está disponible. Botón personalizado para grupo elegible de Premium Business, Sales Navigator y Recruiter Lite; alternativa gratuita, web dentro de Información de contacto. No se ha editado el perfil.

- https://www.linkedin.com/help/linkedin/answer/a1494309
- https://www.linkedin.com/help/linkedin/answer/a727760
- https://www.linkedin.com/help/linkedin/answer/a548010

Siguiente responsable: Codex publicar y verificar; Manuel revisar el ensayo. CMS sigue bloqueado por sus gates operativos, fuera del alcance.
