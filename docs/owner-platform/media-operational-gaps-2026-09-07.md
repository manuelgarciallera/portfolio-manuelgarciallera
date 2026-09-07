# Biblioteca de archivos: revisión operativa previa a almacenamiento duradero

Revisión de código local sobre `5f3f228`, separada del incremento PostgreSQL editorial. No se han subido archivos, publicado el CV, conectado un proveedor ni cambiado la web pública. Estos hallazgos no certifican un fallo observado en producción.

Actualización posterior: la paridad editorial PostgreSQL ya está verificada. El riesgo de archivos huérfanos se reprodujo en SQLite con archivos sintéticos reales; se implementó compensación limitada a subidas completadas que fallan antes de intentar commit. Véase [alcance, pruebas y límites](figma-media-compensation-2026-09-07.md). La tabla siguiente conserva el diagnóstico inicial; no interpretar esta corrección como atomicidad general del almacenamiento ni como cierre de las demás puertas.

## Evidencia y prioridades

Actualización 2026-09-08: la pérdida de archivos históricos tras reemplazo ya está
reproducida, no solo inferida. Se ha implementado y revisado un
[núcleo de revisiones inmutables](media-revision-core-verification-2026-09-08.md),
todavía sin activar en Payload. La integración aislada está en curso; las puertas
de permisos HTTP, copia completa, persistencia del alojamiento y publicación del CV
siguen pendientes. No presentar la biblioteca activa como reparada por esos tests.

| Prioridad | Evidencia actual | Consecuencia y comprobación necesaria |
| --- | --- | --- |
| Antes de activar importaciones reales | `src/collections/Media.ts` usa `staticDir` local; no hay adaptador de objetos en `payload.config.ts` | Verificar persistencia en el alojamiento elegido, permisos de lectura y recuperación de original más derivados. El ensayo físico local no sustituye almacenamiento persistente externo. |
| Antes de considerar atómica una importación | `src/connectors/figma/import-execution-service.ts` abre una transacción, crea Media, encuadre y auditoría; ante error revierte la transacción. La integración editorial desactiva el almacenamiento local | La prueba acredita rollback de filas, no de archivos. En Payload 3.88 instalado, `dist/collections/operations/create.js` llama `uploadFiles` antes de persistir el documento; el catch llama `killTransaction`. No hay compensación de archivos en el servicio propio. Es un riesgo de archivos huérfanos sustentado por código, aún pendiente de reproducir con fallo inyectado y almacenamiento habilitado. |
| Antes de prometer restauración histórica de archivos | `src/collections/shared.ts` conserva hasta 25 versiones documentales; el manifiesto físico copia los archivos presentes | Restaurar metadatos no demuestra recuperar bytes sustituidos o eliminados. Probar reemplazo, papelera, borrado y restauración histórica, con manifiesto de originales y derivados y política explícita de retención. No borrar archivos por inferencia mientras haya referencias históricas. |
| Antes de ofrecer fuentes personalizadas | `BrandProfiles.ts` expone `typography.fontAssets` relacionado con Media; Media permite solo `image/*` | El control no constituye soporte real de fuentes WOFF/WOFF2. Corregir el contrato de tipos y su interfaz en una tarea específica; no ampliar a cualquier archivo sin validación. |
| Antes de publicar el CV | Media permite imágenes, no PDF; `media-health-service.ts` trata dimensiones ausentes como incidencia | PDF requiere clasificación y validaciones distintas de una imagen. No basta añadir un MIME: revisar diagnóstico, presentación, descarga, original/versiones y autorización. Revisar el PDF concreto con Manuel antes de hacerlo público; mantener privadas las variantes específicas/académicas. |
| Antes de exposición pública de medios | `access/published.ts` filtra publicado y no eliminado para lectura anónima; versiones son owner-only | Probar también la URL binaria directa y sus derivados, no solo Local API. El proveedor/CDN no debe eludir la condición de borrador por conocer una URL. No se ha realizado esa prueba HTTP aquí. |

## Orden de cierre

1. Terminar la paridad editorial PostgreSQL sin relajar asertos SQLite.
2. Reproducir con archivos sintéticos la importación fallida, reemplazo y recuperación. Registrar filas y bytes antes/después; no activar proveedores reales durante ese ensayo.
3. Elegir y probar persistencia duradera, permisos y retención con su coste explícito y sin trasladar datos reales por defecto.
4. Habilitar tipos de archivo concretos (imágenes, fuentes, PDF), con formularios y diagnósticos adecuados a cada tipo.
5. Solo después, incorporar sustitución del CV y fecha desde el CMS, con revisión previa del documento y una publicación deliberada.

Responsable: Codex, carril owner. La publicación del portfolio, dominio y correo permanecen separados en el carril de Claude. Este informe registra límites concretos; no anuncia implementación ni aprobación de proveedor, coste, migración o despliegue.
