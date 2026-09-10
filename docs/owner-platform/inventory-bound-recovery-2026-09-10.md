# Recuperación owner ligada al inventario de medios

Fecha: 2026-09-10. Base Git: `b40026e`. Solo ensayo aislado, no despliegue.

## Cambio

El modo `--object-media --full-owner` deja de reproducir objetos directamente.
Ahora captura el inventario real de Payload (documentos, versiones y capturas),
lo relaciona con los manifiestos de las revisiones nativas exportadas y construye
un plan de copia. Su evidencia referencia el hash de los bytes del manifiesto
archivado, no un valor ficticio. Conserva los tres derivados de la revisión que
solo sigue referenciada por una captura, sin inventar referencias a miniaturas.

`media/migration/plan.json` e `inventory.json` se incluyen en la copia conjunta
con PostgreSQL y los archivos. Los hashes del plan y del inventario también se
devuelven al proceso padre antes de cerrar el origen. Este recibo independiente
se usa al restaurar; no se confía únicamente en lo que afirma el archivo copiado.

Después de `pg_restore`, el proceso nuevo autentica al owner, compara el inventario
real restaurado, valida el plan y los manifiestos, prepara los archivos en una
carpeta propia fuera de la biblioteca respaldada y ejecuta la copia con diario.
La reconciliación exige las tres revisiones verificadas y coincidentes antes de
las comprobaciones editoriales e imágenes privadas. El diario se cierra en
`finally`; los intentos no se reintentan ni borran para simular éxito.

Se mantienen el recorrido editorial completo, los controles de permisos, la
edición posterior y el render de la captura histórica en Chromium. Reabrir el
origen también usa el nuevo recorrido, en otro proveedor sintético vacío, sin
modificar su biblioteca o sus documentos. El modo reducido conserva su flujo.

## Pruebas y alcance

- RED `33155c`: el modo full-owner anterior falla por carecer del candidato
  ligado al inventario. Cierre de cluster y limpieza confirmados, salida 1.
- Lint focal `c1253a`: salida 0. Diff/checkpoint `57fb5f`: limpio/intacto.
- Revisión independiente de solo lectura: sin bloqueadores; su dictamen queda
  condicionado al ensayo ejecutable. No ejecutó pruebas ni escrituras.
- Ensayo completo `6e1256`, salida 0: PostgreSQL 17.11, 45 pruebas previas en
  cinco archivos, 18 archivos de backup, tres revisiones y 12 archivos de imagen.
  Se rechazan 12 casos de corrupción/ausencia antes de asignar destino.
  `migrationCopyVerified`, `planExecuted` y `pageEditedAfterRecovery` verdaderos;
  tres derivados retenidos y tres revisiones reconciliadas. Historial editorial,
  origen y backup sin cambios. Cierre de procesos, cluster y carpeta verificado.
  Incluye captura histórica real renderizada en Chromium a 390/1280 px, no un
  dispositivo físico ni una prueba completa del panel administrativo.
- Regresión del modo reducido `de372e`: salida 0, tres revisiones, 12 archivos,
  ocho rechazos, origen/backup intactos y cierre/limpieza verificados.
- Typecheck y lint completos `011581`: salida 0. Frontera pública `b30455`:
  21 entradas correctas. No nuevo build de Next por alcance exclusivo de pruebas.
- Unitarias completas `d76bd7`: 1.172/1.172, 161 archivos, 63,86 s, salida 0.

La prueba añade corrupción y ausencia del plan y del inventario a las negativas
de archivos originales, derivados, manifiesto y archivo PostgreSQL. Todas deben
rechazarse antes de crear el destino de restauración.

Esto prueba un recorrido de recuperación con revisiones nativas conocidas de
este fixture. No reconstruye versiones legacy perdidas, no acredita un servicio
S3 real ni su disponibilidad, permisos o costes. Los helpers no son una API de
migración ni una herramienta preparada para recibir entradas hostiles de un
operador: el padre controla rutas y artefactos sintéticos, sin escritores
concurrentes. El plan sigue con `canApply:false`; no autoriza cutover.

Siguiente puerta: staging operativo y ensayo de la biblioteca real bajo permisos,
copias y retención aprobados. No se modificaron runtime, dependencias, configuración
productiva ni apariencia pública. Codex integra; Claude recibe por Hub.

Reserva Hub: `56003693-41cf-49af-8319-96572314afee`. La entrega no implica que Claude
la haya procesado o aceptado.
