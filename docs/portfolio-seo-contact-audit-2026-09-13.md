# Auditoría de favicon, contacto e identidad SEO — 2026-09-13

Alcance: comprobaciones del dominio público y del código. No despliegue ni cambios de configuración de correo/DNS.

- `/`, `/sobre-mi`, `/robots.txt`, `/sitemap.xml` y `/favicon.ico`: HTTP 200 en consulta directa HTTPS.
- Favicon público: 5641 bytes, idéntico al archivo local. SHA-256 `37de7dbf1e84e68e9052c308ceec4db5844c0728d64b52357177c0363a5e3d6c`. El generador utiliza el monograma MG con variantes 16/32/48/64. No se ha verificado visualmente una pestaña real en este barrido.
- El HTML anuncia dos enlaces de favicon: uno generado con versión y otro manual sin versión. Revisar simplificación para evitar referencias redundantes; no se ha demostrado un fallo de caché.
- Envío único real al formulario: HTTP 200, `{"ok":true}`. Identificador del mensaje `AUDIT-20260913-SEO-CONTACT`. Esto demuestra aceptación por el endpoint/transporte, no entrega final a todas las bandejas. Pendiente confirmación del mensaje recibido.
- Canonical propio, robots index/follow y sitemap disponibles. El sitemap usa fechas 2026-09-02 también en páginas modificadas después: revisar fechas de modificación reales, sin sustituirlas por fechas artificiales diarias.
- Título publicado de portada: `Manuel García-Llera — Product Designer, Design Systems y HCI`. Falta Añón en el título y descripción; el modelo Person local sí contiene el nombre completo.
- Descripción publicada: Product Designer/Design Engineer, sistemas de diseño, HCI e interacción humano-IA. Puede comunicar UX/UI e investigación en español con mayor claridad sin sobrecargar palabras clave.
- `/sobre-mi` tiene descripción propia, pero hereda descripción Twitter de portada. Revisar coherencia de tarjetas sociales por ruta.
- El modelo local incluye LALIGA, URJC, UNIR, ORCID y Scholar. No atribuir una matrícula doctoral, publicaciones ni credenciales nuevas sin verificación.
- La búsqueda web `site:manuelgarciallera.com "Manuel"` no devolvió resultados en la herramienta. No prueba ausencia en Google; confirmar indexación con Search Console, actualmente no consultada.

Propuesta inicial de la auditoría, sustituida por la decisión editorial posterior:

- Título: `Manuel García-Llera Añón | Diseño UX/UI e investigación`.
- Descripción: `Diseñador en LALIGA. Conecto diseño UX/UI, sistemas de diseño e investigación en interacción humano-IA para crear productos digitales claros y accesibles.`

Google puede reescribir títulos y fragmentos según la consulta. No se garantiza posicionamiento ni un texto exacto: https://developers.google.com/search/docs/appearance/title-link y https://developers.google.com/search/docs/appearance/snippet.

Siguiente responsable: Codex, integrar ajustes de identidad con pruebas y comprobar despliegue; Manuel, confirmar recepción del mensaje de prueba. Este informe no cierra la auditoría visual global del portfolio ni la entrega final del correo.

## Decisión editorial posterior e implementación local

Tras revisión con Manuel, el título de portada pasa a
`Manuel García-Llera Añón | Diseño UX/UI y sistemas de diseño`.
Descripción: `Diseño UX/UI, sistemas de diseño e investigación en interacción humano-IA. Manuel García-Llera Añón: del concepto al producto digital.`

Implementado en SITE_TITLE/SITE_DESCRIPTION de src/lib/site-config.ts. El layout
consume ambas constantes para title, description, Open Graph y Twitter de portada;
las rutas con metadatos propios conservan sus títulos. No se cambia el nombre
corto de navegación ni se afirma matrícula doctoral. El doctorado queda pendiente
de confirmación para Sobre mí/Investigación. Sin publicación ni solicitud de
indexación en este cambio. Search Console espera el acceso a IONOS del usuario.

Verificación de esta edición: 233/233 unitarias en 38 archivos (b3357d),
TypeScript sin errores, lint focal y diffcheck sin hallazgos; sesión termina
salida 0 (53c529). Revisión del consumidor layout: las constantes alimentan las
cuatro representaciones de texto indicadas. No se ha regenerado un build ni
consultado producción para presentar este texto nuevo como desplegado.
