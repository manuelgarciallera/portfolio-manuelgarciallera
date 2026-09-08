# Decisiones del incremento de medios versionados

Registro de decisiones de ejecución del plan iniciado en `cd33df0`. No son
autorizaciones de coste, traslado de datos, publicación o despliegue. Las
revisiones de tareas no equivalen a aprobar el CMS completo para producción.

| Decisión, en orden | Motivo | Coste de corregirla |
| --- | --- | --- |
| Trabajar en el carril owner de la rama compartida existente, sin cambiar de checkout | Preservar el trabajo concurrente y el relevo acordado | Revertir únicamente commits propios mediante cambios explícitos; nunca resetear trabajo ajeno |
| Crear primero el núcleo físico antes de seleccionar el binding de Payload | Separar conservación de bytes de la integración editorial | Adaptar después el binding, sin haber migrado la biblioteca real |
| Usar una factoría opt-in en fixtures aislados, con hooks soportados y sin dependencia nueva | Probar una revisión agregada de original y derivados sin activar un adaptador sobre archivos reales | Revisar la factoría antes de activación |
| Mover recorte y duplicación nativos al ensayo HTTP de Task 3 | Payload recupera la imagen por URL antes de los hooks de subida | Task 2 por sí sola no certifica el editor completo |
| Separar HTTP de recuperación/recursos conservando todos los requisitos | La descarga autenticada es una dependencia del ensayo de restauración | Una puerta de revisión adicional, no menos cobertura |
| Aplicar la limpieza no recursiva al código nuevo y conservar los ejecutores anteriores ya acotados | Evitar reescribir infraestructura ajena al defecto durante la integración | Revisar esa infraestructura por separado si aparece un fallo; nunca ampliar raíces |
| Exigir origen configurado explícitamente y fuente autorizada antes del refetch nativo | El comportamiento instalado podía propagar cookies usando un origen del solicitante | Configuración deliberada antes de habilitar edición nativa; revisar políticas de redirección del alojamiento |
| Separar recuperación física (Task 4) de mediciones y rollout (Task 5) | Sus fixtures, costes y criterios de fallo son diferentes | Otra puerta de revisión sin reducir requisitos finales |
| Conservar el manifiesto físico anterior y añadir un inventario de directorios al fixture versionado | El manifiesto de archivos no detectaba intentos vacíos desaparecidos | Sustituir el wrapper antes de una migración si no basta; no es una API de backup de producción |
| Fijar previamente 2 GiB de RSS como parada diagnóstica y exigir 4 GiB disponibles para medir | Acotar el experimento local sin fingir que existe un alojamiento elegido | Abortar y revisar el método; no subir el umbral después para presentar un aprobado |
| Preservar el espacio de trabajo y sus registros al cerrar el incremento | Contiene trabajo local no publicado y un informe de Task 3 que Git sí sigue | Mantener archivos locales; ninguna pérdida de evidencia por una limpieza automática |
| Revisar al final el incremento completo desde `cd33df0`, identificándolo como tal | La rama compartida también contiene trabajo anterior de CMS y del portfolio | La revisión no certifica todo ese historial; una auditoría global posterior debe nombrar su propio alcance |

## Límites que no se han levantado

La configuración activa, la biblioteca real, el diseño público y el checkpoint
permanecen protegidos. Siguen siendo decisiones distintas escoger almacenamiento
duradero, comprobar permisos efectivos, contratar servicios, migrar datos y
conectar las publicaciones del CMS con el portfolio. El CV no se publica ni se
incorpora a Media solo por existir su diseño en Figma.

Los resultados, fallos iniciales y límites técnicos se conservan en los informes
de [núcleo](media-revision-core-verification-2026-09-08.md),
[binding](media-binding-verification-2026-09-08.md),
[HTTP](media-native-http-verification-2026-09-08.md),
[recuperación](media-recovery-verification-2026-09-08.md) y
[recursos](media-resource-verification-2026-09-08.md). El
[procedimiento de migración y vuelta atrás](media-storage-rollout-2026-09-08.md)
es documental y requiere ensayo en clon antes de cualquier corte real.
