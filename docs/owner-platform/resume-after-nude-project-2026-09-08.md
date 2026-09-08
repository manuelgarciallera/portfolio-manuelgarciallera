# CMS — punto de reanudación

Interrupción solicitada por Manuel el 2026-09-08 para incorporar NudeProject y una galería visual a la landing. Base local: `d2bf86a75b3a295f652f71b44f3f5e0020f3f764`. Producción verificada: `d63d6fd2868cd0a8a62fc91aab300bf12bd761f5`, despliegue `dpl_DmyZqKghiWSekyL5Zrii247CZAwx`.

## Terminado; no repetir

- Plan `media-migration-clone-plan-2026-09-08.md` cerrado. Implementación QA `5873b3f`, corrección de retención `2af909e`, recibo final `07523d7`.
- Ensayos físicos sintéticos SQLite/PostgreSQL y recuperación, transacciones, ACL y conservación de snapshots revisados. Ver `media-migration-clone-verification-2026-09-08.md` y `.superpowers/sdd/media-migration-clone-plan-2026-09-08/progress.md`.
- Evidencias deliberadamente fallidas conservadas en los directorios de ensayo documentados; no borrarlas.

## Siguiente paso exacto

Diseñar y revisar el artefacto reutilizable de migración y el corte seguro hacia almacenamiento persistente real. Esta aplicación operativa todavía NO está implementada ni autorizada como activación de datos reales. Mantener publicación/puente estático inactivos hasta comprobar permisos, copias restaurables, proveedor y costes.

Resolver antes el contrato de aislamiento owner frente al baseline público autorizado: propuesta Hub `9585548d`, no confundir dependencias de servidor públicas autorizadas con código CMS enviado al visitante. No relajar presupuestos por conveniencia. Persistencia/staging, recuperación de cuenta y doce avisos moderados owner siguen siendo pendientes operativos, no producto comercial cerrado.

## Interrupción acotada

NudeProject será el último caso, identificado como TFM UX/UI realizado en equipo con Figma y Adobe CC, sin desarrollo en producción. Revisar originales de Figma; no atribuir métricas, pruebas de usuarios ni contribuciones individuales no demostradas. Galería horizontal con imágenes propias, navegación accesible, sin alterar hero ni correo/DNS. Publicación solicitada por Manuel, condicionada a pruebas y comparación contra checkpoint. Solicitud de relevo público a Claude: `1f19c726-34c6-4f1c-b2b1-40acb84785bf`.

Tras cerrar esta interrupción, continuar por el siguiente paso anterior, no reiniciar el CMS ni reabrir ensayos cerrados.
