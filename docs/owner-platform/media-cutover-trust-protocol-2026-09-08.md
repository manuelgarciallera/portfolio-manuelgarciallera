# Corte de medios: confianza y recuperación

Estado: **propuesta no implementada ni autorizada para datos reales**. Base
`bab07e3`. Continúa `media-migration-artifact-design-2026-09-08.md`; no amplía
el permiso de los ensayos sintéticos ni activa almacenamiento.

## Punto real de partida

- Candidato, cobertura del inventario y observación de bytes existen; integración
  en clones cerrada en `media-candidate-clone-integration-2026-09-08.md`.
  `canApply:false` permanece. El estado implementado del candidato es
  `awaiting-physical-verification`, no el nombre preliminar del diseño original.
- `src/collections/Media.ts`, importado por `src/payload.config.ts`, mantiene
  almacenamiento legacy local e imágenes únicamente. No existe aquí activación
  operativa del almacén versionado ni gestión de PDF habilitada.
- El controlador QA registra HEAD, pero eso no prueba un árbol limpio ni un
  artefacto ejecutable idéntico. El helper de backup no es un respaldo operativo
  de PostgreSQL: sus pruebas usan fixtures y raíces controladas.
- Falta un consumidor operativo con autorización, pin persistente de confianza,
  detención efectiva de escritores y resolución de fallos entre BD y archivos.
  No añadimos otro validador sin ese consumidor ni repetimos clones ya cerrados.

## Registro operativo separado del candidato

El futuro coordinador, fuera del navegador, debe conservar un registro protegido
de la operación. El cliente no podrá crearlo ni modificar sus campos de confianza.
Un hash o una firma del JSON no sustituyen autorización ni autenticidad histórica.

El registro vinculará: identificador único de operación; identidades opacas de
origen, destino y backup; digest del candidato y del inventario recogido por el
servidor; manifiesto de backup y recibo de restauración; revisión de esquema;
artefacto de código inmutable, lockfile y versiones efectivamente ejecutadas de
runtime/Payload/adaptador; y evidencia del cierre de escritores. Los bindings a
rutas, conexiones y credenciales se resuelven en configuración privada, no en el
JSON compartido. HEAD solo no basta si hay cambios locales o dependencias distintas.

La autorización autenticada de Manuel debe identificar ese alcance y una acción
concreta. No habrá `approved:true` enviado por formulario como puerta de ejecución.
Caducidad, permisos y estado de operación se comprobarán de nuevo al ejecutar;
una autorización vencida, revocada o para otro digest no se reutiliza. El registro
necesita persistencia independiente del proceso y acceso restringido; proveedor,
retención y mecanismo concreto siguen pendientes, no elegidos por este documento.

## Reposo verificable antes del corte

Para el piloto se propone mantenimiento offline, con un único actor de migración,
antes que prometer un bloqueo distribuido todavía inexistente. Ocultar botones,
cerrar el navegador o mostrar un aviso de mantenimiento no detiene escritores.

Inventariar y detener entradas HTTP de escritura, jobs/importaciones, hooks que
puedan escribir y procesos externos; drenar transacciones y cargas en curso.
Restringir credenciales/permisos de BD y medios de los actores antiguos y probar
que no pueden escribir ni reiniciarse automáticamente con capacidad de hacerlo.
La topología concreta debe demostrar exclusión también entre réplicas. Dos hashes
iguales consecutivos no prueban reposo. Si se usa un lease, caducar exige detener
al ejecutor obsoleto mediante fencing efectivo, no solo un reloj del proceso.

En ese estado se obtiene un backup consistente de BD y medios con un método
apropiado al motor; copiar archivos de una BD viva no es ese método. Se restaura
aislado, se verifica el plan exacto y se conserva evidencia de recuperación.
Ensayos previos pueden hacerse sin mantenimiento, pero no reemplazan el ensayo
de la captura final. Si se permiten nuevas escrituras después de esa captura,
se invalida la preparación y se crea una nueva base consistente antes del corte.

## Ejecución futura y estados de fallo

Registrar el inicio antes de la primera escritura. Revalidar permisos, código,
origen, backup restaurado, inventario, plan, evidencia histórica y exclusión de
escritores. Preescribir únicamente revisiones inmutables, verificar sus bytes y
aplicar referencias en una transacción dedicada viva. La transacción de BD no
vuelve atómica la escritura de archivos ni un cambio de configuración.

| Momento del fallo | Respuesta exigida |
| --- | --- |
| Antes de escribir | Invalidar operación; conservar diagnóstico, sin mutación |
| Solo archivos nuevos | Conservarlos y registrarlos; no borrar huérfanos automáticamente |
| Rollback de BD confirmado | Verificar estado original y bytes; no inferirlo solo de una excepción |
| Desconexión con commit desconocido | Mantener mantenimiento; reconciliar registro y estado real, sin reejecución ciega |
| Commit confirmado, comprobaciones fallan | No abrir escrituras; recuperación ensayada de BD, medios y binding como conjunto |
| Ya hubo nuevas ediciones | No restaurar automáticamente una copia antigua: preservarlas en un nuevo respaldo y resolver pérdida/conflictos explícitamente |

La reanudación requiere reconocer el identificador de operación y comprobar
postcondiciones persistidas. Un proceso nuevo no presume que el anterior falló
antes del commit. Recuperar el registro sin recuperar el estado de BD, o viceversa,
requiere reconciliación. La restauración misma tendrá registro y comprobaciones;
un fallo de recuperación mantiene el servicio cerrado y conserva las copias.

Antes de abrir escritura: comprobar lectura de todas las referencias previstas,
ACL owner/anónimo, versiones, snapshots intactos, edición y restauración en el
entorno de aceptación. El cambio al binding versionado es una acción controlada
y reversible, no un efecto lateral de importar el candidato. Conservar origen y
backup después del éxito; limpieza/retención son decisiones separadas.

## Próximo incremento y límites

Codex: diseñar el consumidor operativo mínimo con estados persistentes e
interfaces de backup/exclusión/autorización; antes de implementarlo, concretar qué
entorno de staging puede cumplir esos contratos. TDD del consumidor con dobles:
permiso revocado, digest cambiado, escritor reaparecido, backup no restaurable,
commit incierto, reinicio y fallo de recuperación. Los dobles no certificarán la
exclusión real: esa puerta necesita ensayo de integración con el backend elegido.

Claude: revisión del protocolo y sus límites por Hub. Manuel: decisión posterior
sobre persistencia, coste y corte real, cuando haya evidencia y alcance concreto.
No se pide ahora una decisión prematura. No hay endpoint nuevo, código productivo,
pruebas runtime nuevas, despliegue, transferencia ni afirmación de CMS vendible.

## Recibo documental

Revisión independiente estática completada: sin hallazgos Critical, Important o
Minor. Contrastó configuración activa, candidato y ensayo sintético; no ejecutó
pruebas ni migraciones. No se aplica TDD a esta entrega de prosa ni se atribuyen
resultados runtime nuevos. Reserva Hub `f987f9fe-8358-4a39-993f-5cf871075fcc`;
la revisión del subagente no implica aceptación de Claude. Checkpoint pre-editor
`0f0adf6` conservado. Próximo responsable Codex: definición del staging y consumidor
mínimo, todavía sin activación ni decisión de proveedor por inferencia.
