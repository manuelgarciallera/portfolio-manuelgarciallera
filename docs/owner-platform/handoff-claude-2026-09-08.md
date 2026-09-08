# Entrega consolidada a Claude — 8 de septiembre de 2026

Solicitada por Manuel: registrar el trabajo para que Claude pueda retomarlo sin intermediación. Estado: entrega para lectura y revisión, no aceptación ni despliegue.

## Base y protección

- Rama: `codex/checkpoint-pre-editor-2026-09-04`.
- HEAD antes de esta entrega documental: `edafb2e`.
- Checkpoint protegido: `checkpoint/pre-editor-2026-09-04`, SHA `0f0adf686b2752e23c25d224f8c60815b10fd451`.
- En estos últimos tramos Codex no ha hecho push ni despliegue. No afirmar que lo descrito esté publicado. El estado remoto debe verificarse de nuevo antes de publicar.
- Los cambios previos de ECOSISTEMA, PROTOCOLO y REGISTRO se preservan; no se incorporan en bloque a un commit propio. No se han tocado carpetas privadas, DNS, correo ni datos reales.

## Cambios públicos acumulados, ya en commits locales

| Commit | Alcance |
| --- | --- |
| `ba4f140` | Portada Nude sin franjas laterales y pulso sutil de marcos de previews |
| `8ac3006` | Subtítulos de formación alineados a la izquierda con clase exclusiva |
| `3c54845`, `650eceb` | Favicon MG de la navbar y corrección de exportación tipográfica |
| `c2b65b1` | Notas UX/UI 9,56 y Full Stack 9,86; sin editar PDFs |
| `8c3423f` | Menor separación desktop entre cita y Enfoque |
| `aca2409` | Flechas desktop de la galería editorial; barra y gesto táctil conservados |
| `64d33a3` | Seis imágenes de Proceso, proporción25:26, antes de número/título |
| `edafb2e` | Diagnóstico acotado del test de imágenes e informe de auditoría/CRM |

Consultar los diffs y REGISTRO para evidencias focales anteriores. No volver a implementar estos cambios. La auditoría actual prevalece sobre resultados históricos cuando detecta un fallo nuevo.

## Verificación actual sobre código público64d33a3

- `npm run check:all`: salida0, incluye build29rutas, presupuesto10rutas sin ampliar baseline y audit productivo sin vulnerabilidades notificadas.
- Vitest independiente: 223/223,37archivos, salida0.
- Owner unitarias: 974/974,149archivos, salida0.
- Dashboard owner: ocho escenarios de fixture,320/390/768/1280, claro/oscuro, correctos. No prueban almacenamiento ni publicación reales.
- Barrido de recortes:11rutas×6anchos320–1440, salida0. Umbral: contenido mayoritariamente oculto. No cubre toda colisión, pequeños recortes ni `/investigacion`.
- Menú móvil de `/proceso` en navegador integrado: apertura y cierre mediante Escape correctos. Captura móvil de primera fase inspeccionada sin superposición en ese punto.

## Hallazgo abierto: imágenes de Proceso

El test headless falla reiteradamente esperando la sexta imagen, `human-ai.webp`. Diagnóstico: currentSrc vacío, completefalse, naturalWidth0 aunque el marco queda dentro del viewport. Añadido timeout30s con limpieza y diagnóstico; cada ancho usa página nueva, sin resolver el fallo.

El navegador integrado sí carga la imagen al navegar hasta Verificación. Los endpoints original y optimizado responden200. El src fallback3840 de Next NO prueba que el navegador haya solicitado esa variante; no atribuir causa al optimizador ni rebajar calidad sin evidencia.

**No aprobar la auditoría completa de imágenes ni un supuesto arreglo visual.** Siguiente Codex: caracterizar carga diferida y peticiones en el escenario headless frente al navegador, comprobar todos los anchos y cerrar con evidencia. El script pasa lint; su prueba funcional permanece roja.

## CMS: dónde retomar

Plan/candidato, cobertura del inventario, verificación física y ensayos sintéticos SQLite/PostgreSQL ya cerrados: no repetirlos sin cambio relevante. `canApply:false` se conserva. Media activa sigue legacy local y solo imágenes; no hay almacenamiento durable, migración operativa ni PDF versionado habilitados por estos ensayos.

Leer, por este orden:

1. `media-migration-artifact-design-2026-09-08.md` (propuesta original; estados concretos actualizados en recibos posteriores).
2. `media-candidate-clone-integration-2026-09-08.md` (integración QA cerrada).
3. `backup-link-boundary-2026-09-08.md` (límites de seguridad del helper QA).
4. `media-cutover-trust-protocol-2026-09-08.md` (propuesta de consumidor, pin persistente, respaldo y exclusión de escritores; no implementado).
5. `crm-patterns-audit-2026-09-08.md` (auditoría actual y contraste Frappe/Twenty/EspoCRM, con fuentes).

Después del cierre público: comprobar recorrido owner real entrar→editar borrador→guardar→recargar→restaurar; móvil/desktop, foco, errores y cambios sin guardar. Concretar staging/almacenamiento antes del ejecutor operativo. No copiar otro CRM ni añadir funcionalidades por catálogo; no se han incorporado nuevas funciones CMS durante la auditoría.

## Entrega y siguiente responsable

Mensajes de auditoría previos: `88e30c24-4231-458c-b1a9-6b91a820b3be`, `b09dbc9d-982f-4f11-9aea-91c2f8c731b4`, precisión `eb102b4f-d757-4868-979d-47b92bbc6cdd`, cierre `0445f1ef-4459-4146-8bca-1aa57c52555c`.

Codex mantiene el siguiente diagnóstico. Se pide a Claude confirmar lectura, señalar solapes o discrepancias y comunicar cualquier nuevo SHA público. Confirmación de lectura no equivale a aprobar publicación. Manuel recuerda conservar commits y hacer push cuando proceda: comprobar primero el efecto sobre despliegues automáticos y las puertas de publicación. Esta entrega no publica ni cambia permisos.
