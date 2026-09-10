# Diseño y plan: manifiesto portable de revisiones

Objetivo: reutilizar exactamente la misma validación de revisiones en disco y en el futuro transporte de objetos, sin importar filesystem desde el validador ni migrar datos. Primer tramo de almacenamiento operativo, no su sustituto.

Alternativas: duplicar validadores en cada backend introduce divergencias; llevar el binding entero a objetos mezcla permisos y transporte; extraer solo el contrato de bytes conserva pruebas e interfaces. Se elige la tercera bajo la autorización de continuación local de Manuel. No autoriza servicios ni activación.

La [compatibilidad S3 de R2](https://developers.cloudflare.com/r2/api/s3/api/), consultada el 10 de septiembre, no implementa GetBucketVersioning. No apoyar la recuperación en versionado nativo supuesto. El siguiente transporte deberá escribir claves inmutables propias, con condiciones y manifiesto final, lectura acotada y hashes, sin borrado automático tras resultado incierto. La consistencia del proveedor no constituye backup externo.

## Tramo implementable ahora

Extraer a `owner-platform/src/media/revision-manifest.ts` el tipo Manifest, límites, digest, snapshotFiles, validateRevision y validateManifest, con sus auxiliares. Mantener nombres y lógica; exportar únicamente lo que consume `revision-store.ts`. Este último conserva rutas, enlaces, inodos, lectura acotada y escrituras exclusivas. API writeMediaRevision/readMediaRevision y formato schema1 intactos.

Pruebas `revision-manifest.test.ts`: contrato válido, instantánea independiente de mutaciones del Buffer, nombres inseguros/colisiones Unicode, límites, manifiesto de otro ID, tamaño/hash inválido y claves extra. Suite física previa cubre que la extracción no elimina garantías de disco.

## Ejecución TDD

- [x] Añadir pruebas del módulo ausente; ejecutar y comprobar fallo de importación.
- [x] Extraer funciones sin reescribir su algoritmo; cambiar el almacén para importarlas.
- [x] Ejecutar pruebas nuevas y suite física; inspeccionar diff por movimientos únicamente.
- [x] Ejecutar unitarias owner, integración SQLite, lint y tipos; revisión independiente antes del commit local.

No se declara compatibilidad R2 por pasar estas pruebas. Después hacen falta transporte condicional con SDK oficial, ensayos de fallos/lecturas hasta EOF, binding opt-in y recuperación completa en objetos y PostgreSQL. No instalar dependencias ni hacer esa activación en este tramo. Mantener checkpoint y público intactos.

## Resultado de ejecución

RED observado: módulo ausente, salida 1. Tras extracción: 65 pruebas enfocadas pasan. Suite owner final 996/996 en 150 archivos; integración SQLite 44/44 en cinco archivos; lint y tipos salida 0. No se repiten build público ni PostgreSQL en este tramo de extracción sin cambios de algoritmo, esquema o dependencias; no atribuirles verificación nueva.

Revisión independiente read-only: sin hallazgos críticos, importantes ni menores; confirma conservación de algoritmos y defensas fs. Contrato para futuros consumidores: llamar `validateRevision` antes de `validateManifest`, pues el segundo comprueba identidad coincidente, no sintaxis UUID por sí solo. No presenta un manifiesto válido como autorización de acceso: esa sigue en el binding.

Sin push, despliegue o migración. Reserva Hub `eee9bf00-d28a-4f01-ae98-4612b0cc1b3e`. Este tramo extrae una dependencia necesaria del transporte, no implementa aún almacenamiento de objetos ni cierra el objetivo global del CMS.
