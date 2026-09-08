# Entrega: medios versionados del CMS

Estado: incremento local implementado y revisado, **no activado en la biblioteca
real ni publicado**. Rango de código revisado: `cd33df0..d704ee6`. Documentación de
cierre posterior: `f972aa8` y esta entrega. Las cinco tareas del plan tienen su
revisión cerrada; la revisión conjunta no encontró hallazgos Critical/Important.
Esto no certifica como terminado todo el CMS anterior a ese rango.

## Qué cambia para el producto

Se ha reproducido un defecto del almacenamiento local anterior: reemplazar una
imagen podía borrar sus bytes históricos aunque siguiera existiendo su versión
en la base de datos. Restaurar esa fila no recuperaba el archivo perdido.

La nueva integración opt-in conserva cada subida como una revisión inmutable:
original y miniaturas, nombres, tamaños y sumas SHA-256. Reemplazar crea otra
revisión; restaurar selecciona los bytes de la anterior. La asociación entre
documento, revisión y archivo se comprueba antes de permitir una descarga.

- Metadatos, publicación, borrador, papelera y recuperación se prueban con Payload
  real, tanto en SQLite como en PostgreSQL.
- El recorte y la duplicación nativos se ejercitan mediante HTTP autenticado;
  el origen de recuperación es explícito y la fuente procede del servidor.
- Las previews congeladas guardan la revisión exacta. La compensación de una
  importación fallida no borra revisiones históricas o inciertas.
- La recuperación física comprende BD, todas las revisiones, archivos huérfanos
  e intentos incompletos/vacíos. Se restaura y edita una instancia independiente,
  manteniendo intactos origen y backup.
- La medición local verifica descargas completas y conserva evidencias de ambos
  ensayos. Un inicio incierto impide limpiar archivos hasta confirmar el cierre.

No se ha añadido ninguna dependencia ni alterado la configuración activa,
`Media.ts`, el diseño público, sus paquetes o su contenido en este incremento.

## Evidencia ejecutada

| Puerta | Resultado y alcance |
| --- | --- |
| Núcleo físico | 39 casos focales; límite exacto de 64 MiB comprobado aparte |
| Unitarias owner | 783/783 en 144 archivos, repetición final del controlador tras `d704ee6`, salida 0 en 69.28 s; la ejecución anterior de 82.49 s se conserva como evidencia separada |
| HTTP SQLite final | 7/7, incluidas descarga autorizada, recorte y duplicación |
| Integración PostgreSQL final | 38/38: editorial, binding y HTTP |
| Helpers de recuperación | 41/41, incluidos 14 casos del inventario estricto |
| Recuperación real aislada | Modos legacy y versionado en SQLite y PostgreSQL: cuatro comandos con salida 0 |
| Backup versionado | 27 archivos y seis directorios de revisión; siete variantes dañadas rechazadas antes de asignar destino |
| Recursos final | 16/16 focales también repetidas por el controlador al cierre, salida 0; lint y tipos salida 0 según implementador; 51/51 respuestas completas con hashes exactos |
| Protección pública | Frontera de 21 entradas y bundle de 10 rutas pasan sin ampliar tolerancias; no equivalen a la procedencia completa |

En el ensayo final, el conjunto grande ocupa 62149485 B (92.6100 % del límite de
64 MiB). El pico RSS observado fue 821137408 B, aproximadamente 783.1 MiB, bajo
un presupuesto diagnóstico predefinido de 2 GiB. Hay buffers de revisión completa,
copias del transporte sintético y caché/GC no controlados: **no son métricas de
la web pública, capacidad comercial ni garantía de coste**.

Los informes conservan los fallos iniciales y sus correcciones. La revisión
independiente leyó el código y puntos concretos de Payload; no repitió las
pruebas pesadas. Las ejecuciones se atribuyen a implementadores y controlador.

## Qué permanece pendiente

1. Procedencia completa del aislamiento owner/público: build público dedicado y
   resolución revisada de la discrepancia package/lock con el checkpoint tras
   cambios públicos separados. No se ha relajado la referencia.
2. Almacenamiento persistente, permisos efectivos en el destino, política de
   redirecciones, límites de memoria/concurrencia y crecimiento real.
3. Backup externo, cuotas/costes, retención y responsables de restauración.
4. Migración y vuelta atrás ensayadas en un clon desechable; activación deliberada
   solo después de superar esas puertas. La biblioteca legacy activa sigue con
   su limitación: no se la presenta como reparada por los tests opt-in.
5. Cierre de dependencias de publicación y puente entre CMS y portfolio. Fuentes,
   PDF y CV son capacidades posteriores con validaciones propias.
6. Seguridad owner: la auditoría de dependencias del 8 de septiembre sigue
   registrando 12 entradas moderadas de paquetes afectados, cero altas/críticas.
   No es una auditoría limpia ni una excepción para publicar; véase el informe.

El CV no se ha leído, importado ni publicado en este incremento. La revisión del
PDF concreto sigue siendo previa a cualquier publicación; las versiones
específicas/académicas se mantienen fuera de la publicación automática.

## Mejoras menores de pruebas registradas

- Verificar contenido original y derivados del duplicado y hacerle una edición
  binaria, comprobando que los bytes de su fuente no cambian. La prueba actual
  cubre duplicación nativa y edición independiente de metadatos, no ese caso completo.
- Inyectar una respuesta detenida hasta vencer el plazo de EOF y comprobar el
  recibo fallido y que no se inicia el siguiente lote.
- Capturar exclusivamente los diagnósticos esperados de denegación/correo sin
  ocultar errores inesperados.

La revisión los clasifica no bloqueantes para este incremento aislado. No se
han eliminado ni presentado como resueltos. Próximo responsable: Codex, siguiente
fase de preparación operativa y activación en clon; Claude mantiene su carril
público/dominio/correo. Un mensaje enviado al Hub no implica aceptación.

## Evidencia y recuperación del trabajo

- [Plan](versioned-media-storage-plan-2026-09-07.md) y [decisiones con coste de rectificación](media-storage-decision-log-2026-09-08.md).
- [Núcleo](media-revision-core-verification-2026-09-08.md), [binding](media-binding-verification-2026-09-08.md), [HTTP](media-native-http-verification-2026-09-08.md).
- [Recuperación](media-recovery-verification-2026-09-08.md), [recursos](media-resource-verification-2026-09-08.md) y [migración/rollback](media-storage-rollout-2026-09-08.md).
- [Dependencias](dependency-remediation-2026-09-05.md): sección de revisión del 8 de septiembre.

Commits principales: `8b044a7` núcleo, `0c19fee`/`5a9619c` validación Unicode,
`3ccf011` binding, `4cd0c9b`/`a79335b` limpieza de tests, `339fb8d` HTTP,
`cf28533` selección de borrador, `73a52f6` recuperación, `5035ce8` recursos y
`d704ee6` cierre incierto. Correcciones y documentación permanecen en la rama
`codex/checkpoint-pre-editor-2026-09-04`; no push, merge ni deploy.

Checkpoint intacto: `checkpoint/pre-editor-2026-09-04` apunta a
`0f0adf686b2752e23c25d224f8c60815b10fd451`. Se conserva también el espacio local
de trabajo y la documentación compartida sin incorporar modificaciones ajenas.
Un checkpoint Git no sustituye una copia de bases de datos y archivos reales.
