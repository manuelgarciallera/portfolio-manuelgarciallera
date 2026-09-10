# Transporte de revisiones en objetos: diseño y ejecución

Base b297d4b. Continúa el almacén portable, sin activar colecciones ni conectar datos reales. SDK oficial `@aws-sdk/client-s3@3.1129.0` únicamente en owner; Node >=20, Apache-2.0. No escribir firma S3 propia ni añadir dependencias públicas.

## Contrato

`createObjectRevisionStore({client:S3Client,bucket:string,prefix:string,timeoutMs?:number})` devuelve `write(files):Promise<string>` y `read(revision):Promise<{name:string,bytes:Buffer}[]>`. Cliente, bucket privado y prefijo son configuración confiable del servidor, nunca entradas de la petición ni autorización de un tenant. El propietario del cliente controla su cierre.

Reutilizar snapshotFiles/validateRevision/validateManifest y límites schema1. Claves: `<prefix>/<uuid>/files/<ordinal>`; manifiesto `<prefix>/<uuid>/manifest.json`, conservando nombres originales solo en manifiesto. Todas las escrituras usan IfNoneMatch `*`; manifiesto escrito último. Sin Delete, creación de bucket, ACL pública ni fallback local. Fallo de escritura conserva los objetos y devuelve error con UUID para futura reconciliación; ni error ni timeout prueban que el servidor no haya escrito.

Lectura: validar UUID antes de red; GET manifiesto <=64KiB, validar schema/identidad; LIST exacto del prefijo antes y después (máximo 18 entradas; rechazo de truncamiento); GET de cada binario acotado por tamaño declarado y SHA-256, incluyendo EOF. Deadline total de operación configurable de 100 a 60000ms, predeterminado15000; abortar y destruir cuerpo pendiente al vencer. No confiar en ETag como hash ni en versionado nativo R2.

## Pruebas y pasos

- [x] Crear pruebas con SDK real y servidor HTTP en 127.0.0.1, credenciales sintéticas literales; comprobar RED por módulo ausente.
- [x] Implementar contrato opt-in, sin cambiar payload.config.ts ni Media. Casos: revisiones históricas, original y derivados; condiciones PUT y manifiesto último; rechazo 412 sin borrado; fallo intermedio sin manifiesto; corrupción, falta y exceso de bytes; inventario extra/incompleto; UUID/nombres inválidos sin red; cuerpo detenido hasta deadline.
- [x] Reabrir cliente contra el mismo servidor para leer revisión sin estado en el proceso cliente. No presentar esto como durabilidad de R2 ni backup físico.
- [x] Ejecutar focused, unitarias completas, integración SQLite, lint, tipos y build owner. Auditoría comparada; comprobar boundary público sin elevar baseline. Revisión independiente y commit local recuperable.

## Fuera de este tramo, pero requisitos del objetivo

Binding Payload, autorización por documento/revisión, recorte nativo, migración, ensayo PostgreSQL+objetos, copia externa/restauración e infraestructura real no quedan resueltos por este transporte. Requieren sus pruebas completas antes de activar. El servidor local simula semántica S3 para probar nuestras peticiones y fallos; no certifica al proveedor.

Fuentes consultadas 10 septiembre: [R2 S3 API](https://developers.cloudflare.com/r2/api/s3/api/), [extensiones condicionales](https://developers.cloudflare.com/r2/api/s3/extensions/), [consistencia](https://developers.cloudflare.com/r2/reference/consistency/). No se contrata ni crea servicio. No push ni despliegue.

## Recibo de ejecución

- RED1: módulo ausente. GREEN inicial11 casos. RED2: prefijo undefined aceptado por coerción de RegExp; corregido con validación typeof antes del patrón. GREEN final17/17.
- Suite owner1013/1013,151 archivos; integración SQLite44/44,5 archivos; lint y tipos0.
- Build owner Next16.3.4,23 páginas, salida0. Ejecutado binario directo con OWNER_PLATFORM_BUILD_PHASE=1, sin limpiar `.next/dev`; retirada de `--use-system-ca` solo del entorno hijo por incompatibilidad conocida. Sin cambio global de TLS.
- Audit runtime:8 moderadas, todas cadena Payload anterior,0altas/críticas. SDK añade25 paquetes; lockfile solo adiciones. La instalación completa informa10moderadas incluyendo desarrollo; no se afirma audit verde.
- Boundary público21 entradas correcto. Presupuesto10 rutas correcto sobre build público ya existente; no se reconstruyó el público. Diff vacío en src público/package.json/package-lock.json/next.config.ts y baseline intacto. No confundir esta comprobación con medición nueva de carga en usuarios.
- Revisión independiente read-only sin hallazgos accionables, sin ejecución de pruebas por el revisor.
- Checkpoint original `0f0adf686b2752e23c25d224f8c60815b10fd451` intacto. Archivos compartidos previamente modificados preservados.

`ObjectRevisionWriteError.revision` permite localizar una escritura incierta; reconciliarla no está automatizado ni concede autorización para publicar. Lectura valida bytes frente al manifiesto, no acredita integridad frente a un administrador del proveedor que reescribiera ambos. LIST usa SDK/MaxKeys y deadline, no un parser XML propio con límite de memoria. Solo se permiten endpoints confiables desde configuración del servidor.
