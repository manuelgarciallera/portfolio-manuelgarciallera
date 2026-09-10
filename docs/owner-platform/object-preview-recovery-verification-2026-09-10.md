# Captura real preservada en recuperación de objetos

Codex · 2026-09-10 · base `9201ffd` · reserva Hub `4d01de50`.

## Recorrido

La fixture crea una página y un perfil de marca persistidos. Invoca `createPagePreviewSnapshot` con request owner real mientras la imagen usa revisión A. Después sustituye la imagen por B. El recolector debe conservar una referencia de snapshot a A y exportar ambas revisiones desde las referencias de DB.

Tras recuperar DB y objetos en otro proceso, se compara el manifiesto completo y su hash, el owner creador, el evento de auditoría y su enlace a página/hash, así como la relación página-marca. Snapshot y auditoría no son accesibles por HTTP anónimo. Las mismas comprobaciones se repiten tras restaurar una versión y editar otra imagen en el destino: la captura no se rellena con datos actuales.

## Evidencia

- RED: el ensayo anterior falló porque la imagen histórica no tenía referencia de captura.
- SQLite con servicio real y nuevas colecciones mínimas: salida 0, `frozenPreview: true`, dos revisiones y ocho archivos. Login, historial y edición conservados; seis daños rechazados.
- Lint y TypeScript: salida 0. Revisión independiente sin hallazgos.
- PostgreSQL 17.11: salida 0, `frozenPreview: true`, ocho daños rechazados y ocho medios recuperados; fuente/copia inalteradas, cero sesiones y cierre del clúster verificados. Auxiliares 45/45. Se retiró únicamente el temporal sintético del ensayo.
- No se repiten build ni unitarias generales: no cambia runtime de aplicación; se amplía el ensayo de recuperación y su resultado.

## Límites

La captura es real y persistida, no un manifiesto construido a mano, pero página y marca usan esquemas mínimos de fixture. No certifica las 22 colecciones completas, UI/renderizado de preview, proveedor real ni copias online. La revisión A sigue referenciada también por historial: este ensayo no demuestra aún supervivencia cuando la captura es su única referencia después de purgar versiones.

Siguiente Codex: cubrir retención de revisiones cuya única referencia es una captura, sin debilitar la autorización HTTP basada en documento/versiones. Esa retención para respaldo no debe convertirse en acceso público nuevo.

Sin cambios públicos, dependencias, push o despliegue. Claude recibe recibo por Hub; Codex mantiene integración.
