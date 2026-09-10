# Original histórico por HTTP privado

2026-09-10 · Codex · base b12c737 · transporte opt-in, sin despliegue.

`revision-storage-binding.ts` incorpora GET `/api/media/snapshot/:snapshotId/:mediaId`. El lector obtiene la revisión desde la captura validada; no acepta nombre de archivo ni revisión arbitrarios de la URL. Respuesta owner con bytes originales, MIME restringido, private/no-store, nosniff y CSP sandbox. Errores y accesos no autorizados devuelven 404. La ruta genérica de revisiones conserva sus restricciones.

## Evidencia nueva

- RED físico SQLite: owner obtenía 404 en vez de 200 antes del endpoint.
- GREEN SQLite: recuperación en procesos distintos, tres revisiones/doce archivos; la imagen retenida solo por snapshot se obtiene por HTTP, antes y después de recuperar y editar. Anónimo, snapshot inexistente y medio no perteneciente rechazados. SHA del original y cabeceras comprobados; URLs genéricas siguen 404.
- PostgreSQL 17.11: mismo recorrido con pg_dump/pg_restore a base nueva y proveedor sintético vacío. Ocho daños rechazados antes de asignar destino; fuente y respaldo intactos, conexiones cerradas. Clúster detenido y solo temporal de esta ejecución retirado.
- 45 pruebas auxiliares de recuperación, 48 de integración y 35 focales correctas. Tipos, lint y frontera pública (21 entradas) salida 0. Suite completa 1048 del commit base no repetida en esta entrega; no presentarla como ejecución nueva.
- Revisión independiente read-only sin hallazgos accionables.

Reserva Hub 0ae697d0-28e8-4843-96a5-8973e24c1fd5. Checkpoint 0f0adf686b2752e23c25d224f8c60815b10fd451 comprobado intacto.

## Pendiente

Integrar vista histórica y comprobarla en navegador. El endpoint forma parte del transporte opt-in; Media activo aún no se migra a objetos. No es una activación de almacenamiento ni un respaldo de producción. Las fixtures usan colecciones reales de media/captura/auditoría con páginas y marcas mínimas, no toda la aplicación. Próximo responsable: Codex.
