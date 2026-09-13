# Recuperación owner: repetición aislada — 2026-09-13

Codex. Base del repositorio `beebcf6d5aa129f3e49d209ee6577ee17d7eed94`.
Sin edición de runtime, publicación, gasto ni acceso a datos reales.

## Entorno y correspondencia

Contenedor existente `owner-editor-6dc5c51-0911`, usuario `pwuser`, directorio
`/work/verification-fac73fa/owner-platform`, PostgreSQL 16.15.
El checkout del contenedor es `fac73fa4b1cc24351431fd45563acd629c3de3ea` con
overlays: no se presenta como checkout limpio de HEAD. Los dos archivos runtime
owner cambiados desde esa base coinciden con el árbol anfitrión tras normalizar
CRLF (comprobación 1a5e9f):

- `src/collections/Pages.ts`: SHA256 `6635fafc109fdd2733123432f8c9fe5dea25e9bd31fc1432b9f1477eb0acf16c`.
- `src/components/FieldErrorBinding.tsx`: SHA256 `f9cf07a1a5b1ff00782fb483bfe08513b9ea58357c8bab655aeacfea88fdf878`.

Los overlays de pruebas de navegador no se ejecutan en este ensayo.

## Comando y resultado

`docker exec -u pwuser -w /work/verification-fac73fa/owner-platform -e OWNER_POSTGRES_BIN=/usr/lib/postgresql/16/bin owner-editor-6dc5c51-0911 node scripts/test-recovery-postgres.mjs --object-media --full-owner`

Sesión 9230; salida terminal 0, recibo 48a457. Pruebas auxiliares: 45/45 en
cinco archivos (573f91). Dump y restauración nativos en base nueva.

- 18 archivos de backup; 12 archivos de medios verificados.
- Tres revisiones recuperadas; tres versiones de página y dos de artículo.
- Login, historial, vista previa congelada y edición posterior de página/artículo pasan.
- Copia del plan de migración verificada, tres revisiones reconciliadas.
- Doce casos de daño rechazados antes de asignar destino.
- Estado lógico del origen y recibos del backup conservados.
- Sesiones cerradas antes del dump; clúster sintético detenido y únicamente
  la carpeta de esta ejecución eliminada por el arnés. No se borraron datos del usuario.

## Límites y siguiente puerta

Usa la configuración owner completa, pero un recorrido editorial sintético,
no todas las funcionalidades. El proveedor S3 es sintético, no R2 remoto.
No prueba UX del navegador, correo, durabilidad del proveedor ni recuperación
de datos productivos. No resuelve los defectos visuales públicos reportados.

Checkpoint comprobado: `0f0adf686b2752e23c25d224f8c60815b10fd451`, intacto.
Quedan seis archivos de pruebas de navegador pendientes en el árbol, sin incluir
en este commit: no se afirma verificación completa de sus dos perfiles.
Siguiente responsable Codex: cerrar la verificación editorial pendiente y después
ensayar staging real cuando estén autorizados/provisionados sus recursos.
