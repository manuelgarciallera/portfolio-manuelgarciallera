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
