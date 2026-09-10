# Respaldo de una revisión referenciada solo por captura

Codex · 2026-09-10 · base `21bec0a` · reserva Hub `2320d06c`.

## Caso probado

La fixture crea una imagen amarilla y una captura real de ella, seguida de dos reemplazos, rojo y azul. Resuelve los IDs de las versiones amarillas y elimina únicamente esas filas en la DB sintética, con filtro conjunto de padre e IDs. No borra objetos. Es una simulación del estado posterior a retención, no una política de purga automática ni una operación contra la app real.

El recolector debe incluir la revisión amarilla y todas sus referencias deben ser de tipo `snapshot`. La exportación sigue dirigida por la DB. Se respaldan tres revisiones y doce archivos; tras recuperar se compara el inventario completo, la captura/auditoría y todos los bytes amarillos directamente por el transporte interno.

Las URLs de la revisión amarilla devuelven 404 para owner y anónimo: conservar un objeto para respaldo no concede acceso mediante un documento o versión que ya no lo referencia. Esto se comprueba antes y después de recuperar y editar. Las versiones roja y azul siguen probando restauración nativa y edición independiente.

## Evidencia

- RED: el caso anterior no cumplía referencia exclusivamente de captura porque aún existía una versión de Media.
- SQLite: salida 0, `snapshotOnlyRetention: true`, tres revisiones/doce archivos, captura e historial conservados, edición correcta y seis daños rechazados.
- Lint y TypeScript: salida 0. Revisión independiente sin hallazgos accionables.
- PostgreSQL 17.11: salida 0, tres revisiones/doce archivos recuperados, 16 archivos en copia física, ocho daños rechazados, fuente/copia intactas y `snapshotOnlyRetention: true`. Auxiliares 45/45; cero sesiones y cierre del clúster verificados, temporal propio retirado.
- Sin cambios runtime; no se repiten build ni unitarias generales. La recuperación completa es el ensayo afectado.

## Pendiente real

No se ha implementado un endpoint de visualización de archivos autorizado por captura. Los bytes conservados no implican que el editor pueda renderizarlos después de purgar su historial. El siguiente paso es revisar ese recorrido y su autorización específica, sin abrir la URL genérica ni hacer público el histórico.

Tampoco acredita backups operativos, el esquema completo de producción o un proveedor S3 real. Clúster/datos/credenciales son sintéticos y locales. Sin cambios de apariencia, push ni despliegue.
