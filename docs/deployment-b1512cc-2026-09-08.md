# Publicación NudeProject + galería — recibo verificable

## Publicado

- SHA de aplicación: `b1512cca85026e2ad5796771efa38225c189e77b`.
- Rama: `codex/checkpoint-pre-editor-2026-09-04`.
- Preview: `dpl_HYexQWP3gca69EJxGgBgb1iMxqf2`, Ready (37 s).
- Producción: `dpl_2Nq6xQe2NpfCgf7Ccp8ydEH39aob`, Ready (39 s), 2026-09-08 09:37 CEST.
- Panel: https://vercel.com/manuels-projects-25322539/portfolio-manuelgarciallera/2Nq6xQe2NpfCgf7Ccp8ydEH39aob
- Dominio: https://manuelgarciallera.com
- Caso: https://manuelgarciallera.com/casos/nude-project

Manuel autorizó expresamente implementación, commits, push y publicación en su
petición de NudeProject. Vercel reconstruyó el mismo SHA con entorno Production
al promover la preview. Se comprobó Ready y asignación del dominio, no solamente
el éxito del push. No se tocaron correo, DNS, credenciales ni visibilidad GitHub.

## Protección

Tag local y remoto `checkpoint/pre-nude-gallery-2026-09-08` conserva
`d2bf86a75b3a295f652f71b44f3f5e0020f3f764`. El tag pre-editor sigue intacto.
Producción anterior: `d63d6fd`, `dpl_DmyZqKghiWSekyL5Zrii247CZAwx`.
El tag conserva código; no representa una copia de datos externos del CMS.

## Pruebas del SHA publicado

- `npm run check:all`: exit 0. 217 unitarias, 13 guards, 21 entradas de frontera
  pública, encoding, responsive typography, navegación móvil, lint, tipos, build
  de 29 páginas, presupuesto de 10 patrones de ruta y audit público sin vulnerabilidades.
- `node node_modules/vitest/vitest.mjs run --config vitest.unit.config.ts`:
  ejecución independiente, 35 archivos, 217/217, exit 0.
- `node scripts/check-layout-overflow.mjs http://127.0.0.1:3015`:
  11 rutas × 6 anchuras (320/360/390/768/1024/1440), exit 0.
- `node scripts/verify-nude-gallery.mjs`: 360/768/1440 × claro/oscuro, 6/6.
- El mismo verificador contra `https://manuelgarciallera.com`: 6/6, exit 0,
  sin errores JavaScript. Comprueba cinco enlaces, Nude último, acceso mediante
  foco/teclado, diapositiva Comprar, siguiente caso y anchura del documento.
- HTTP real: `/`, `/casos/nude-project` y `/sitemap.xml` responden 200 con Nude;
  canonical del caso apunta al dominio principal y la landing contiene la galería.
- Revisión independiente de código: 0 críticos, 0 importantes, 0 menores.

Los barridos visuales usan movimiento reducido; no acreditan el ritmo de todas
las animaciones ni equivalen a una auditoría completa WCAG/Core Web Vitals reales.
Las capturas finales privadas en `.tmp-screens/nude-gallery/verification` son de
producción, reemplazando las capturas de la ejecución local del mismo script.

Incidencias durante desarrollo: el primer catálogo cliente excedió presupuesto;
se corrigió proyectando tarjetas desde servidor, sin cambiar baseline. Hubo
timeouts de navegador con suites concurrentes; se interrumpieron esos intentos.
Las ejecuciones finales seriales descritas arriba terminaron correctamente.

## Peso y alcance

Sin dependencias nuevas. Contra el baseline existente sin modificar:

| Ruta | Delta JS raw | Delta gzip |
| --- | ---: | ---: |
| `/` | -35.229 B | -12.429 B |
| `/casos` | -35.445 B | -12.445 B |
| `/casos/[slug]` | -35.434 B | -12.704 B |

Nuevos recursos gráficos aproximadamente 695 KB en disco, carga lazy donde
corresponde. Reducción de JS no implica que toda visita transfiera menos bytes:
se añade contenido visual y su coste depende del recorrido y la caché.

## Coordinación y CMS

Push comunicado por Hub `3260f949-911a-4358-a319-70233ae3b450`.
La ausencia de respuesta no se presenta como aceptación de Claude.
Los tres documentos compartidos que estaban modificados permanecen sin incluir
en nuestros commits. Los temporales y carpetas privadas tampoco se han incluido.

Retomado el CMS en el punto documentado, sin repetir ensayos cerrados: nuevo diseño
`owner-platform/media-migration-artifact-design-2026-09-08.md` y propuesta de revisión
Hub `98ae53cf-1858-42a6-af13-2bcc4e2cd4c7`. Es diseño, no una migración operativa
implementada. Siguiente entrega: constructor/validador de plan de solo lectura con
pruebas, antes del ejecutor y del corte real a persistencia.
