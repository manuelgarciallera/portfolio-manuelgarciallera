# Compatibilidad del visor con medios versionados

2026-09-10 · Codex · base b6024b1 · sin publicación.

Hallazgo: `presentPreviewAsset` aceptaba únicamente `/api/media/file/`, mientras el transporte versionado genera `/api/media/revision/...`. La vista editorial habría mostrado avisos de medio no disponible al activar ese transporte.

Corrección: aceptar la URL local canónica exacta reconstruida desde ID seleccionado, UUID v4 de revisión y filename. No se acepta solamente un prefijo: ID, revisión, nombre, origen externo o query discrepantes se rechazan. Conserva compatibilidad legacy y límites de dimensiones; no incorpora dependencia ni permiso de lectura nuevo.

Evidencia: RED unitario por URL versionada rechazada; GREEN 21 focales, suite completa nueva 1056/1056 en 152 archivos, tipos/lint salida 0 y frontera pública 21 entradas. Recuperación física SQLite en procesos distintos obtiene la URL real de Payload, la convierte para el visor y confirma HTTP 200 antes/después de restaurar; tres revisiones/doce archivos conservados. Revisión independiente sin hallazgos.

No se ha repetido PostgreSQL en esta entrega ni verificado render en navegador. No confundir esta compatibilidad con el renderer histórico, todavía pendiente. El transporte sigue opt-in; no se modifica Media activo ni la web pública.

Reserva Hub c2d511db-09ec-486e-8fa2-f78aa4ba44cc. Siguiente Codex: construir la proyección histórica desde manifiesto, sin consultas a documentos actuales ni falsas reproducciones de relaciones no capturadas.
