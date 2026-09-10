# Inventario de referencias versionadas para respaldo

Codex · 2026-09-10 · base `cb3a5d5` · reserva Hub `13debfde`.

## Cambio

`collectPayloadRevisionReferences` reutiliza el lector autorizado del inventario legacy: documentos publicados/trashed, último draft, versiones de Media y referencias de PreviewSnapshots con hash y procedencia comprobados. Agrupa UUID válidos conservando tipo, documento y referencia origen. No requiere raíz local ni inspecciona filesystem. Falta de revisión, legacy, null o UUID malformado impiden devolver un inventario parcial.

La extracción mantiene las consultas originales, `overrideAccess: false`, sesión owner, rechazo de transacción activa, paginación estricta, límites de filas/referencias y presupuesto de metadata. `inspectPayloadLegacyMedia` sigue utilizando el mismo lector y conserva su inspección local posterior. No hay endpoint nuevo ni activación de almacenamiento.

El worker de recuperación exporta ahora los IDs descubiertos por este lector en la DB y compara el inventario recuperado. Los recibos de upload quedan como expectativas independientes, no como lista que conduce la exportación.

## Evidencia

- Seis pruebas RED por función ausente; 28/28 focales verdes tras implementación. Dos primeras aserciones esperaban texto inglés mientras el validador devuelve español: se corrigió el test para exigir rechazo sin acoplarse al idioma.
- Unitarias completas: 1.039/1.039, 151 archivos. Integración SQLite: 48/48.
- Recuperación física SQLite: dos revisiones/ocho archivos, seis daños rechazados; inventario, login, historial y edición conservados.
- Lint, TypeScript y build finales: salida 0, 23 páginas generadas. Primer tipos/build señaló un cast incompleto del request anónimo de la prueba; se sustituyó por el helper tipado existente y se repitieron correctamente.
- Revisión independiente sin hallazgos accionables.
- Frontera pública: 21 entradas correctas; código/dependencias públicos sin cambios y checkpoint original intacto. Prueba focal repetida tras corregir el request: 28/28.
- PostgreSQL 17.11 con el recolector: salida 0, dos revisiones/ocho medios, ocho daños rechazados, inventario y fuente lógica conservados, clúster cerrado y temporal propio retirado. Auxiliares 45/45 dentro del controlador.

## Límites y siguiente paso

No es una instantánea online: deben detenerse escritores antes del recorrido y de la copia coordinada. No inventaría objetos huérfanos ni verifica bytes por sí mismo. La fixture física usa Media y PreviewSnapshots vacía; referencias de capturas no vacías están cubiertas aquí por unitarias, no por recuperación física de un snapshot real. No afirma cubrir todas las colecciones ni relaciones futuras.

Siguiente Codex: añadir una captura persistida real y una referencia exclusivamente histórica al ensayo de recuperación, y comprobar que ambas conducen la exportación sin depender del documento actual. Después, control operacional de pausa/copia y staging. Público, dependencias y checkpoint intactos; sin push ni despliegue.
