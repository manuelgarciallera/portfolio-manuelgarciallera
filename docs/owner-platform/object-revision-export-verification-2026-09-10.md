# Exportación autocontenida de revisiones privadas

Base86b252d. Reserva Hub68b91a13. Codex, 10 septiembre 2026. Continúa restore con UUID conservado, sin activar servicios.

`exportRevision(revision)` entrega `{manifest, files}` solo después de leer/verificar manifiesto, inventario, tamaños y SHA256 de toda la revisión. Se genera un manifiesto schema1 para los bytes ya verificados y se conserva el UUID. El plazo incluye la lectura y la preparación del resultado. No incluye cliente SDK, bucket, prefijo ni credenciales.

Es un paquete en memoria; el consumidor debe persistirlo en una ubicación privada aprobada y registrar procedencia. No se expone por HTTP, no es un botón de backup ni modifica la colección. Una copia corrupta se rechaza; una copia/manifiesto alterados conjuntamente requieren confianza o firma externa, aún no implementada.

## Pruebas de este tramo

- TDD: dos fallos por método ausente; primera repetición33/33 verde.
- Exportación íntegra comparada con bytes sintéticos y SHA calculado independientemente.
- Paquete escrito en archivos temporales exclusivos (`wx`, modo0600), manifiesto JSON y binarios ordinales. Se cierran clientes origen y se retiran únicamente objetos sintéticos de origen del servidor de pruebas. Se vuelve a leer la copia de disco y se restaura con nuevo cliente SDK y namespace destino, sin ninguna petición al prefijo origen. UUID y bytes originales/derivados conservados.
- Derivado corrupto: no se entrega paquete parcial.
- Cleanup de archivos temporales explícitos, sin recorrido o borrado recursivo de carpetas ajenas. Modo0600 es una petición al sistema operativo, no una auditoría ACL de Windows.

## Recibo final

- 1.033 unitarias en 151 archivos: correctas.
- Integración SQLite: 48/48, salida 0. Los errores registrados por los escenarios negativos son esperados.
- TypeScript, lint y build Next del owner: salida 0; 23 páginas generadas.
- Frontera pública: 21 entradas correctas; archivos públicos y dependencias raíz sin cambios. Sin nueva medición de Core Web Vitals.
- Revisión independiente: sin hallazgos pendientes. PostgreSQL no repetido en este tramo.

## No confundir con cierre de recuperación

La prueba retira los datos de origen del servidor sintético, pero no reinicia el proceso del proveedor ni restaura la DB. Las herramientas existentes `scripts/test-recovery.mjs` y `tests/recovery/backup-manifest.mjs` copian filesystem y coordinan workers; no se sustituyen ni se declara que ya soporten objetos. Siguiente: controlador de copia DB+paquetes y recuperación en procesos separados, manteniendo inventario de revisiones referenciadas, cuenta owner y aislamiento. R2 real y activación requieren staging y autoridad aplicable.

Sin cambios públicos, dependencias, push, despliegue ni datos reales. Responsable siguiente Codex; informe a Claude mediante Hub.
