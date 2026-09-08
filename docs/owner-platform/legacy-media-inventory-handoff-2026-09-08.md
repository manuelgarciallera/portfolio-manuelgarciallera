# Entrega: inventario seguro previo a migración

Estado: incremento cerrado y revisado. La revisión conjunta detectó un problema
de acumulación de páginas, corregido en `c6746f6`; la revisión focal final confirma
el hallazgo resuelto, sin nuevos Critical/Important en el diff de corrección.
No se ha activado almacenamiento ni migrado la biblioteca real. El portfolio sí
se ha publicado por autorización posterior e independiente de Manuel; véase
[recibo de producción](../deployment-2026-09-08.md).

## Qué aporta al CMS

El nuevo inventario conecta las referencias de documentos, borradores, papelera,
versiones y capturas congeladas con los archivos físicos observados. Distingue
archivo vigente, historia sin verificar, revisión versionada no inspeccionada e
incidencias. Un archivo actual del mismo nombre no demuestra qué imagen había en
una versión anterior. El informe siempre conserva `migrationReady:false`.

La consulta exige owner y respeta las ACL de Payload. Rechaza peticiones con una
transacción activa antes de leer, para no cancelar por accidente una edición en
curso. Cada fila histórica conserva sus propios metadatos: no se rellena desde
la versión vigente. Las capturas se validan por hash y procedencia.

El lector no escribe, borra ni descarga archivos. Limita referencias, variantes,
entradas, bytes e informe; no sigue enlaces o carpetas, y no vuelca rutas privadas,
URLs ni texto editorial al resultado. Los casos inseguros quedan explícitos para
reconciliarlos privadamente. No es un anonimizador ni un permiso para publicar el
informe, borrar archivos o ejecutar una migración.

## Evidencia y atribución

| Comprobación | Resultado |
| --- | --- |
| Suite completa owner del controlador tras `c6746f6` | 880/880, 146 archivos, 99.88 s, salida 0; sesión 13367 cerrada, chunk 2b5f2a |
| Dos módulos del inventario, fuente final | 97/97, salida 0, chunk e99bed |
| SQLite | Completa anterior 41/41; fixture tras corrección final 3/3, salida 0, chunk e22e96 |
| PostgreSQL completo, fuente final | 41/41, salida 0, sesión 26836, chunk 57f457; proceso y cluster cerrados, cero sesiones y limpieza confirmada |
| Lint y tipos finales | Salida 0; chunks d323fa y 945ce4 |
| Público sobre el SHA final | check:all salida 0 con nuevo build y bundle 10 rutas sin ampliar tolerancias; unitarias independientes 209/209. No sustituye la puerta específica de aislamiento owner/público pendiente |

Las pruebas reales comparan filas, versiones, capturas y hashes físicos antes y
después. El fixture conserva cinco identidades de versión y verifica exactamente
todo el conjunto, no solo su tamaño. La omisión temporal de una identidad hizo
fallar la prueba; esa mutación de prueba se revirtió completamente.

Las revisiones son de lectura, no ejecuciones independientes de las suites
pesadas. Se conserva el historial de fallos y correcciones. Mejora menor diferida:
el fixture imprime el aviso de no tener adaptador de correo; es del entorno de
prueba, no una comprobación del formulario público ni su configuración real.

La corrección final consume cada página inmediatamente, antes de pedir la
siguiente. Retiene solo referencias normalizadas y los identificadores necesarios
para detectar duplicados, con presupuesto conjunto conservador de 8 MiB. Rechaza
metadatos anidados y exceso de variantes antes de acumularlos. La regresión prueba
que un exceso en la primera página impide solicitar la segunda.

## Lo que todavía no está hecho

- Reconciliar referencias antiguas con copias auténticas, migrar en un clon y
  ensayar un corte completo con vuelta atrás. El inventario solo diagnostica.
- Resolver persistencia, permisos efectivos, copias externas, retención, cuotas y
  coste del alojamiento antes de activar el almacenamiento nuevo.
- Cerrar la procedencia completa del aislamiento owner/público y la posterior
  conexión del contenido aprobado con el portfolio. No se ha relajado el baseline.
- Gestión pública de PDF/CV y fuentes: posterior, con validaciones propias. El CV
  concreto no se ha leído, importado ni publicado; debe revisarse antes.

Este incremento no acredita un SaaS multi-cliente ni que todo el CMS esté listo
para producción. Próximo responsable: Codex, reconciliación y ensayo de migración
en clon. Claude conserva público/dominio/correo; los mensajes enviados al Hub no
implican aceptación ni coordinación continua garantizada.

## Historial y recuperación

Commits de código: `4c52423`, `6b67f13`, `bb2e5fa`, `5273653`; prueba reforzada:
`fd4fb3c`; corrección final de recursos: `c6746f6`. Documentación y evidencia
conservadas, incluido el informe de tarea `0bee13a`. Push y despliegue público
posteriores autorizados documentados por separado. La documentación compartida ajena
permanece sin incorporar a los commits propios.

Checkpoint conservado: `checkpoint/pre-editor-2026-09-04^{commit}` =
`0f0adf686b2752e23c25d224f8c60815b10fd451`. Git conserva código, no sustituye la
copia física de bases de datos y archivos. Se mantienen los espacios de evidencia.

- [Diseño](legacy-media-inventory-design-2026-09-08.md) y [plan](legacy-media-inventory-plan-2026-09-08.md).
- [Decisiones y costes de rectificar](legacy-media-inventory-decisions-2026-09-08.md).
- [Verificación del colector](legacy-media-inventory-verification-2026-09-08.md).
- [Medios versionados: incremento anterior cerrado](media-increment-handoff-2026-09-08.md).
