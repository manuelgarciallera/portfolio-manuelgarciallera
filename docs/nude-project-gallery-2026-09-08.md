# NudeProject + galería editorial — 2026-09-08

## Alcance y vuelta atrás

Petición directa de Manuel: pausar CMS, añadir galería de imágenes a la landing y el TFM NudeProject como último caso, probar y publicar. No se cambia hero, correo, DNS, bio, dependencias ni configuración del owner.

Checkpoint local `checkpoint/pre-nude-gallery-2026-09-08` apunta a `d2bf86a75b3a295f652f71b44f3f5e0020f3f764`. El checkpoint pre-editor se conserva. Reanudación exacta en `owner-platform/resume-after-nude-project-2026-09-08.md`.

La asignación de este incremento público procede de Manuel. Solicitud de coordinación a Claude `1f19c726-34c6-4f1c-b2b1-40acb84785bf`, aclaración `74444915-7d70-49f8-934a-7ac0bb3e196e`, estado de integración `e687df12-98cf-4a31-a5c7-c3be2e49b3d7`. No se afirma aceptación ni revisión de Claude por ausencia de respuesta. Al iniciar no había ediciones públicas concurrentes; los documentos compartidos modificados se conservan y no se incluyen en este commit.

## Procedencia y límites

- Referencia consultada: https://www.royalclub.sh/ — tratamiento editorial de imágenes grandes. Sin copiar activos ni estructura completa.
- Figma NudeProject: `q8g3VDiheBeFjwQYLhrIbn`, página `309:5697`.
- Inicio: `492:41478`; bolsa: `492:40700`; navegación: `492:42909`; logotipo original: `492:42966`; diagrama: `534:12084`, en página `513:12025`.
- Fotografía de colección: recurso original presente en el inicio de Figma, sin los textos de la interfaz. Marca/fotografía de sus titulares; caso académico no oficial.
- TheUXUnion: ilustración aislada `444:466` de la presentación `420:176`, archivo `HZRG1Ulm7nA8EQCtn38ZoX`; sin texto de las láminas.
- LALIGA y Coordination Hub: portadas editoriales locales existentes, reutilizadas sin cambios.
- Buy&Sell: arte editorial nuevo generado para esta galería; no se presenta como evidencia del TFM. Original conservado en la carpeta de imágenes generadas de Codex, convertido a WebP local.

Prompt del arte Buy&Sell: «High-end 3D studio still life: two bold interlocking rounded rectangular loops, one translucent cobalt blue glass and one polished vibrant orange ceramic, symbolising exchange. Very close sculptural composition with striking depth, realistic caustics and broad soft white highlights. Deep saturated cobalt blue seamless background. Objects occupy middle and upper two-thirds, bottom quarter quiet blue space for a word later overlaid in HTML. Portrait 4:5 composition. No text, no logos, no UI, no typography, no money symbols, no watermarks.»

Se documenta Figma + Adobe CC, trabajo académico en equipo, sin frontend/backend/pagos desarrollados. No se inventan año exacto, liderazgo individual, ensayos con usuarios ni métricas comerciales. `dateCreated` se omite si el año no es una fecha verificable.

## Implementación

- Galería de cinco enlaces entre investigación y casos, renderizada en servidor y pasada como contenido al shell. Scroll horizontal nativo, teclado, foco visible, imágenes lazy, sin autoplay ni dependencias nuevas.
- Portada NudeProject con fotografía original, logotipo vectorial y perspectiva CSS sutil. Movimiento reducido respetado. Caso completo con cuatro láminas, fases, límites y enlaces a originales ampliables.
- La cadena siguiente caso conserva el orden anterior, añade NudeProject al final y vuelve a Buy&Sell.
- El primer build detectó +5,5 KB raw por importar el catálogo completo en cliente. Se elimina esa importación: las rutas entregan únicamente los campos de tarjeta; cada caso recibe solamente la siguiente tarjeta. No se amplía el presupuesto ni se regenera la referencia para ocultar el aumento.
- Exportaciones optimizadas: `scripts/prepare-nude-assets.mjs` utiliza sharp ya instalado. Los PNG fuente temporales no forman parte del despliegue.

## Verificación

Primer barrido local: 360/768/1440 × claro/oscuro, galería, navegación por teclado, selección de diapositiva y siguiente caso: 6/6 sin errores JavaScript. Capturas y JSON privados en `.tmp-screens/nude-gallery/verification`.

Pruebas reproducibles: `scripts/verify-nude-gallery.mjs [baseURL]` y `scripts/check-layout-overflow.mjs [baseURL]`, este último ampliado a NudeProject. Puertas finales y recibo de publicación se registrarán al completarse; este documento no acredita todavía una publicación nueva.
