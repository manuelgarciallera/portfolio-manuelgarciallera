# Vista histórica: navegación real en QA

2026-09-10 · Codex · base 4aa8718 · no publicación.

Next16.3.4 dev loopback3013, base nueva `.data/qa-snapshot-view-20260910-0933.db`, owner sintético example.invalid y seed-workflow-qa. No datos reales ni configuración de proveedores. Agent-browser no disponible; se utilizó Playwright instalado, con contextos independientes.

`tests/snapshot-view.browser.mjs` pasa a390 y1280: login HTTP, ficha de captura, enlace abre popup histórico, título/bloque capturados, selección de controles (aria-pressed), retorno a la ficha. Sin pageerrors. Anónimo redirige a login conservando query de retorno. La primera ejecución falló porque el test exigía URL sin query; se contrastó servidor/navegador y se corrigió a pathname, sin modificar runtime.

Capturas `owner-platform/node_modules/.cache/snapshot-view-390.png` y `snapshot-view-1280.png` inspeccionadas: contenido visible y controles sin solapamiento apreciable. Overflow global comprobado tras seleccionar Desktop a cada ancho. No se midió geometría de cada modo de canvas ni interacción con teléfono físico. Fixture no contiene imágenes: esta evidencia NO verifica imágenes históricas en navegador. La lectura de sus bytes cuenta con pruebas HTTP separadas, no equivalentes.

La primera observación del login obtuvo body vacío antes de hidratar; espera posterior a contenido visible confirmó pantalla de instalación con cero pageerrors/overlay. No se presenta el primer HTTP200 como verificación visual.

Revisión independiente del test sin bloqueantes; límites anteriores registrados. ESLint del archivo y diffcheck correctos. Servidor propio detenido con Ctrl-C; puerto3013 sin listener. next-env generado por dev restaurado al estado anterior. Base sintética retenida localmente, no borrada ni publicada. No nueva build/suite runtime porque esta entrega solo añade prueba y recibo.

Hub275cb0df-5e9a-4388-bec6-f012cf212d94. Próximo Codex: QA con transporte versionado e imagen capturada dentro de navegador, sin activar el proveedor en Media de producción. La recuperación de credenciales owner y puesta en servicio de almacenamiento siguen siendo puertas separadas.
