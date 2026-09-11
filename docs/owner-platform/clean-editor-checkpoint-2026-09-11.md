# Checkpoint editorial limpio d004d7c

## Procedencia

SHA: `d004d7c40898c9535b40b115511ebd30d5b9f1ec`. Se clona el bundle
completo f0435bf documentado en clean-checkout-verification-2026-09-11.md y se
aplica por Git el bundle incremental `.audit/owner-clean-d004d7c-delta.bundle`.
Este último requiere f0435bf y su SHA256 es:
`1B9FE70A49D390070E8E66B21A92301E6BBB15F207AA371E01C7813BC42FCECE`.

Directorio nuevo `/work/verification-d004d7c`, sin overlays. HEAD y árbol limpio
verificados en `7fbfc2`. No se modifica el checkout compartido ni el anterior.
La primera clonación desde carpeta fue rechazada por Git por propiedad distinta;
se usó el bundle existente, sin excepciones globales a safe.directory.

Dependencias Linux copiadas: lockfiles host/copia anterior/copia nueva coinciden
en `FF25B164CF957B66A19E4A8F8FFBBAB5148B9E00A1AC40FC14B9F3598A47FB11`.
No se afirma instalación nueva de dependencias. Docker local aislado, PostgreSQL16,
proveedor de objetos sintético; sin datos reales ni operaciones públicas.

## Recuperación

`node scripts/test-recovery-postgres.mjs --object-media --full-owner`, salida
`e071f9`, código 0, applicationCommit exacto d004d7c. 45 pruebas del arnés,
18 archivos de backup, 12 medios, tres revisiones, tres versiones de página y
dos de artículo. Login, historial, edición independiente de página/artículo,
preview congelado, plan de restauración y copia de objetos verificados.
Doce daños/ausencias rechazados antes de asignar destino. Origen y recibos
intactos; proceso/clúster cerrados y raíz sintética del ensayo retirada.

## Editor de producción

`node scripts/test-production-http.mjs --browser-editor --object-media`,
sesión 51167, resultado `834693` / cierre `0e5000`, código 0. Build de
producción y recorridos a 390/1280: login, páginas, marcas, medios/encuadres,
papelera, revisión/preflight sin publicar, artículos clásicos/modulares e
imágenes con recorte. Privacidad y conservación de documentos/objetos tras
reinicio pasan. App y clúster cerrados, raíz sintética retirada.

Comprobación final `968e4a`: Git limpio y SHA exacto; contenedor solo init/sleep.
Checkpoint público sigue `0f0adf686b2752e23c25d224f8c60815b10fd451`.

## Límites

No despliegue, cuenta de cliente, respaldo externo, integración comercial ni
validación con móvil físico. El código recuperable no sustituye a una copia
externa de base de datos y medios. La copia de prueba no contiene cambios
compartidos sin commit; el registro mixto del host se preserva aparte.
