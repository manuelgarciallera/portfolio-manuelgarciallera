# Vista admin de capturas históricas

2026-09-10 · Codex · base 9d77b6e · no desplegado.

Conectada `/admin/snapshot-preview/:id` al PagePreviewView existente, con loader histórico exclusivo. Requiere owner antes de leer, valida ruta/ID, presenta errores sin detalles internos y distingue captura guardada de borrador actual. Reutiliza canvas y documento, incluidos controles desktop/tablet/móvil y avisos de relaciones no capturadas. Enlace «Ver captura histórica» desde un campo UI de PreviewSnapshots; no se alteran permisos ni inmutabilidad.

La pantalla avisa de límites: no publica, no reproduce módulos/animaciones específicos y necesita almacenamiento histórico disponible para sus imágenes. El Media activo sigue sin migrar al transporte versionado. No afirmar que la reproducción histórica completa está lista en producción.

Verificación nueva: RED tres casos de ruta/vista y enlace ausente; GREEN nueve focales. Suite completa 1066/1066 en 154 archivos. Tipos y lint salida 0. Build Next16.3.4 correcto, 23 páginas, sin cambio de importMap (ambos componentes ya registrados). Revisión independiente sin hallazgos. No navegación, capturas de pantalla ni prueba de imágenes en navegador en esta entrega.

Guías Next/React aplicadas: componente servidor para lectura privada, sin importar loaders desde componente cliente; navegación fuera del try/catch, props de presentación y controles existentes reutilizados. Sin dependencias nuevas ni cambios al frontend público.

Reserva Hub e32ffcc7-893c-4f8a-aecd-31ce747b1f62. Siguiente Codex: QA aislado en navegador, entrada desde colección, retorno, permisos, avisos e imágenes, desktop y móvil. Checkpoint preservado; no push/despliegue.
