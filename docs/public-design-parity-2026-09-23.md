# Portfolio: coherencia visual y paridad de navegadores

Ronda solicitada por Manuel, 23/09/2026 (Europe/Madrid). Base local a79b9df;
producción anterior c172706. Documento de trabajo: implementación no equivale
a publicación. Se completará con la versión y las pruebas finales.

## Criterio de aceptación

Firefox móvil es la referencia aportada por Manuel: siete líneas en el hero,
CTA próximo y jerarquía clara. Una sola implementación responsive para ambos
motores, sin detección de navegador ni bloquear el zoom del lector. Paridad
significa composición e interacción equivalentes, no píxeles idénticos entre
sistemas operativos, fuentes instaladas y dispositivos físicos distintos.

La primera comparación Windows390/1440 en Firefox y Chromium dio diferencias
de geometría inferiores a0,13px: no reprodujo por sí sola la diferencia de
las capturas Android. No se atribuye sin evidencia a caché, Brave Shields o una
fuente concreta. Sí se reprodujo un hueco de164px por distribución vertical
space-between. Se fijan límites de frase móviles y separación explícita.

## Inventario de la ronda

| Petición | Implementación | Verificación final |
| --- | --- | --- |
| Hero como referenciaFirefox en Chromium | Siete frases móviles, hueco acotado; escritorio conserva composición | Pendiente de candidato |
| Auditoría de todo el portfolio | Matrices de lectura, controles, casos y navegación en ambos motores | En curso |
| Quitar00y unificar cabeceras | PageIntro común: etiqueta, título, entradilla y cuerpo | En curso |
| Proyectos: CTA redundante y doble introducción | Índice directo; CTA solo en home | En curso |
| Espacios entre títulos/párrafos y enlaces claros | Jerarquía común y enlace al proceso separado | En curso |
| Investigación: alineación de subtítulos | Alineación izquierda y espaciado consistente | En curso |
| Ampliar imágenes sin abandonar recorrido | Dialog conX, Escape, exterior, foco y scroll restaurados; originalHD opcional | En curso |
| Previsualización al75% | Umbral relativo a porción visible posible; pausa y controles accesibles | En curso |
| Nombre completo y SEO personal | Manuel García-Llera Añón centralizado en identidad/autor/metadatos | En curso |
| NudeProject chocolate | Marco exterior#382921; originales opacos crema preservados | En curso |
| Nombre en banda, arrastre y color localizado | Componente común de banda interactiva con pausa/reducedmotion | En curso |
| Saturno más grande y color interactivo | Escala móvil+material existente, sin dependencias nuevas | En curso |
| CMS como laboratorio | Mención prudente: en desarrollo, sin validación científica/comercial | Implementado |
| Referencia Frayling | Identificación y contexto explícitos, sin atribuir metodología validada | Implementado |
| Analítica sin cartel | Evaluación: se conserva consentimiento actual | Decisión documentada abajo |
| Google/favicon | Comprobar versión pública y solicitar nuevo rastreo | Pendiente de publicación |

## Referencias y decisiones editoriales

La referencia es Christopher Frayling, no Grayling: *Research in Art and Design*
(1993/94), Royal College of Art: https://researchonline.rca.ac.uk/384/ .
El texto anterior presentaba con demasiada contundencia una orientación
metodológica. Ahora se identifica como referencia para una línea a desarrollar,
no como prueba de que Manuel haya validado científicamente sus casos.

El CMS puede presentarse como laboratorio en desarrollo sin afirmar admisión
doctoral, publicaciones, usuarios de pago o resultados que todavía no existen.

## Analítica y SEO

La aplicación integra GA4 y Umami con autorización independiente y revocable,
bloqueo previo, limitación a rutas públicas/canonical y respeto a preferencias
de privacidad. Quitar únicamente el cartel manteniendo estas integraciones no
está justificado. La AEPD permite una exención de medición de audiencia solo
bajo condiciones concretas (finalidad limitada, agregación anónima, ausencia
de reutilización/cruce y configuración/contrato acreditados), no por llamarse
«sin cookies»: https://www.aepd.es/guias/guia-cookies-analiticas-externas.pdf .
No se cambia de proveedor ni se debilitan protecciones en esta ronda. Una
migración a medición exenta requiere comprobar el tratamiento completo.

SEO natural: identidad consistente, contenido original y verificable, títulos
y jerarquía claros, URLs/canonical/sitemap coherentes, imágenes legibles y una
web usable. No se añaden palabras clave artificiales, traducciones ficticias ni
fechas lastModified iguales a la fecha de build.

Google permite solicitar rastreo, no garantizar la fecha ni el aspecto del
resultado: https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl .
Los cambios de favicon también dependen de su rastreo:
https://developers.google.com/search/docs/appearance/favicon-in-search .

## Límites de esta entrega

- Las pruebas emulan tamaños y entradas; no certifican el Brave físico del
  teléfono de Manuel ni todos los navegadores/dispositivos existentes.
- La traducción completa a otros idiomas es un pendiente histórico explícito;
  esta ronda no puede presentarse como una web multilingüe ya implementada.
- No se publica ni se certifica el piloto privado del CMS.
- Los fallos de montaje, timeouts y comprobaciones parciales se registran por
  separado; no cuentan como pruebas superadas.

## Evidencia de implementación (cierre en curso)

Fuente pública aislada: `7a2432649cca96ab494554a9eb59c220356d3768`, hija directa
de la producción anterior `c17270657796b02373fc35f809866b301c7aba93`.
Rama `codex/public-design-parity-2026-09-23`; 65 archivos públicos, sin cambios
en `owner-platform`. Push confirmado. Preview Vercel
`8x4sPtAAXmKv4f4N7TQQDwbkbowo` Ready, 23/09/2026 01:12 CEST.
Esto todavía no acredita publicación en el dominio.

Retorno remoto conservado: etiqueta anotada
`checkpoint/public-before-design-parity-2026-09-23`, sobre `c172706`.
No se ha reescrito historial ni eliminado activos anteriores.

- Unitarias: 371/371, 55 archivos. Tras la corrección final de cabecera,
  sus 5 pruebas vuelven a pasar; build final Next/TypeScript y 30 rutas PASS.
- Identidad: 16/16 comprobaciones sobre HTML generado. El verificador antiguo
  buscaba `/casos` y `/articulos`; se actualiza a `/proyectos` y `/blog`, las
  rutas canónicas vigentes. Los intentos con rutas antiguas no cuentan como PASS.
- Frontera pública: 22 entradas; guardas: 15/15; presupuesto oficial: 11 rutas
  dentro del límite, sin alterar el baseline. El comando por defecto busca
  `.next`: la comprobación válida usa explícitamente el build del candidato.
- Lint: sin errores; permanece un aviso preexistente de otra tarea en
  `.superpowers/sdd/2026-09-22-selector-escape-focus/`.
- Codificación: `src` y `public` PASS. El barrido global detecta marcadores en
  vendor/builds/auditorías privadas; no se declara una comprobación global limpia.
- Cabecera, menú, contacto y pie: 22/22 Chromium y 22/22 Firefox en el build
  candidato. Se encontraron y corrigieron un solapamiento a 1180 px y pérdida
  de foco desktop→mobile. Repetición con fuentes cargadas: 8/8 en 1180/1280,
  ambos temas y motores. Foco del pie: 11,81:1; estados de contacto: mínimo 5,99:1.
- Recibos de controles: `.audit/browser-parity-controls-20260923/3102/`;
  el RED anterior se conserva en `3102-header-red/`.
- La medición Lighthouse inicial se descarta como inválida: aviso de carga
  demasiado lenta y fallo de limpieza EPERM. Un JSON escrito no convierte
  una ejecución fallida en una medida de rendimiento aprobada.

### Comparación de páginas finalizada

- Casos: 60/60 perfiles (cinco proyectos × 390/768/1366 px × dos temas ×
  dos motores). 30 comparaciones y 288 pares de imágenes; mismo inventario,
  sin imágenes rotas, recorte de h1, desbordamiento o errores de página.
  Deltas máximos: h1 0,49 px; imágenes 0,39 px. Cero candidatos geométricos.
  `.audit/case-browser-parity-20260923/both-results.json`.
- Lectura: 54/54 Chromium y 54/54 Firefox (cinco páginas principales y cuatro
  artículos, 320/390/1440 px, ambos temas). Escala de etiquetas y separaciones
  comunes; alturas de h1 con diferencias máximas de 0,058 px. El ancho máximo
  de la caja de artículos a escritorio difiere 27,84 px por la unidad `ch`,
  sin cambiar saltos de línea, alturas ni producir desbordamiento. Se registra
  esta diferencia, no se presenta paridad como igualdad matemática de píxeles.
  `.audit/public-reading-foundations-20260923/production-final-*/results.json`.
- Bundle final frente a c172706: portada +1035 B gzip; casos +2940 B gzip;
  sin dependencias nuevas. El visor accesible y la banda interactiva justifican
  el incremento medido; permanece dentro del presupuesto oficial de 11 rutas.
  `.audit/public-parity-performance-20260923/bundle-final.json`.

Las interacciones, rendimiento, despliegue y Search Console continúan en cierre.
