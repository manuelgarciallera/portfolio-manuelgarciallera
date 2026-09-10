# Imagen histórica después de restaurar una copia

2026-09-10 · Codex · base 32ba2b6 · reserva Hub 654cef68-1d7e-45eb-9e73-e3254699f703.

La recuperación de objetos ejecuta ahora `tests/recovery/snapshot-browser.mjs`: renderiza PagePreviewDocument y su CSS reales; Chromium autenticado descarga la imagen desde el endpoint HTTP real. Sin interceptar respuestas. Después de restaurar la base y tres revisiones (12 archivos), la imagen actual se modifica a verde; la captura debe seguir mostrando el original amarillo.

Verificado en 390 y 1280 px: decodificación, píxel RGBA amarillo exacto, dimensiones naturales 1200×800, ancho visible válido, ausencia de desbordamiento global y pageerrors. Contextos y navegador se cierran con finally. Capturas locales snapshot-image-390.png y snapshot-image-1280.png inspeccionadas: imagen sintética visible, no cortada horizontalmente.

## Ejecuciones

- `node scripts/test-recovery-objects.mjs`: salida 0, SQLite, 6 daños rechazados, snapshotBrowser true, recuperación e historial correctos.
- `OWNER_POSTGRES_BIN` al binario local PostgreSQL 17.11; `node scripts/test-recovery-postgres.mjs --object-media`: salida 0, pg_dump/pg_restore en base nueva, 16 archivos de copia, 12 medios, 8 daños rechazados. El worker espera la prueba del navegador antes de devolver éxito. Origen lógico y recibos de copia sin cambios; clúster detenido y directorio exclusivo eliminado por el controlador.
- ESLint de los dos archivos de prueba: salida 0. Revisión independiente sin hallazgos accionables.

## Límites

El documento se monta con setContent: prueba componente/CSS + HTTP real, NO recorrido completo de Next con almacenamiento versionado. La navegación Next se probó por separado en snapshot-browser-qa-2026-09-10.md sin imágenes. No teléfono físico, proveedor real, activación de almacenamiento ni despliegue. No nueva dependencia ni cambio runtime público. No se atribuye una suite completa nueva a este cambio de pruebas.

Siguiente Codex: unir navegación administrativa y almacenamiento versionado en un único entorno de staging antes de habilitarlo para datos reales; mantener recuperación de acceso owner como puerta operativa separada.
