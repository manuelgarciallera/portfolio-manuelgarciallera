# Restauración de release desde interfaz: ensayo local

Base9e3e404. Reserva866ae91c; pruebas browser-restore.mjs,
browser-publication.mjs y browser-editor.mjs. Sin runtime nuevo.

La release y sus puntuaciones son fixture API explícitamente sintético del
ensayo existente, no una versión registrada nativamente ni métricas reales.
La página sí fue creada por formulario. Se cambia y guarda título/encabezado
desde UI; en dashboard se prepara restauración, en plan se confirma y ejecuta
mediante las frases requeridas. Preparar y confirmar deben conservar idéntico
el documento actual. Ejecutar recupera título, slug, marca y layout históricos
como borrador, con referencia de medios al snapshot objetivo y resultados
persistidos en el plan. La página se relee también desde el formulario; el
controlador conserva el documento restaurado para contrastarlo tras reiniciar.

Entorno: build de producción, PostgreSQL16 y proveedor de objetos sintéticos,
390/1280 en Chromium aislado. Base de contenedor d004d7c más overlays, sin
instalación nueva ni checkout limpio. No datos reales ni despliegue.

Revisión read-only detectó una aserción débil: no-null admitía undefined.
Fortalecida para exigir ID y coincidencia con targetSnapshot. También se
captura inmediatamente el rechazo de waitForResponse. Primer ensayo completo
`cbd18a`, cierre `74556e`, salida0 a390/1280 y reinicio. Delta añade vista previa
real del borrador restaurado, encabezado histórico y ausencia de overflow;
segunda revisión read-only sin bloqueadores. Lint d21985 y diffcheck29b39d
pasan. Contenedor sin redes, mounts o puertos publicados:29b39d.
Repetición fortalecida `cb14c6`, salida0:390/1280 con preview histórico,
referencia exacta y documento completo restaurado conservado tras reinicio.
Aplicación y clúster cerrados; raíz sintética retirada. Diffcheck706762 pasa.
Solo tests/docs, sin nuevas unitarias/types; el build completo sí compila el CMS.

No certifica publicación, restauración de un sitio cloud, dispositivos físicos,
ni registro de versiones desde UI. No sustituye los ensayos de copia física
PostgreSQL/medios. Próximo Codex: cierre y puertas editoriales restantes.
