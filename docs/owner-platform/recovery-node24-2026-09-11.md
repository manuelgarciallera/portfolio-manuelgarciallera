# Recuperación: compatibilidad del helper con Node 24

Base380da1e. Cambia solo tests/recovery/backup-manifest.mjs, no runtime público.
Ensayo Docker --object-media --full-owner:66544c exit1. Dos pruebas existentes
fallan EEXIST al copiar sobre restoreDirectory recién creado con mkdir.

Se mantiene mkdir exclusivo y se copian las entradas del origen validado hacia
hijos nuevos, conservando errorOnExist:true y force:false. Snapshot final sigue
comparando rutas, tamaños y hashes. No se permite sobrescribir un destino previo.
Este helper exige fixtures detenidos: no es una frontera atómica frente a otros
escritores ni un procedimiento productivo aprobado.

GREEN Linux/Node24:45 pruebas en5 archivos, salida b5d0b8. Windows:45/5,
e10a69 exit0; ESLint previo y diffcheck sin errores. Revisión independiente
solo lectura sin hallazgos; no builds simultáneos.

Ensayo completo62194 termina exit1 (4bead3) después: el contenedor no contiene
.git y falla la identificación del commit de origen. Cluster propio detenido y
raíz sintética eliminada. No es una restauración completa verificada ni motivo
para omitir la trazabilidad. Siguiente: preparar checkout de QA con referencia Git
verificable y fuentes correspondientes; repetir --object-media --full-owner.
No falsificar SHA ni utilizar datos reales para pasar la prueba.

Hub650882ab recoge causa y reserva. Sin push, despliegue o nuevas dependencias.

## Entorno reproducible con fuentes versionadas

Bundle local completo de a98b80db3b668ddc94c3db2e0c67b37433fd9f19:
`.audit/recovery-a98b80d.bundle`, SHA256
`F2FF09FF9540BA179F697FC7B0CACB5DFC1CF2C68715D9ECEA17D3AB08D431D1`.
Clonado dentro del contenedor como `/work/recovery-a98b80d`, sin remotos de red.
`git diff --exit-code HEAD -- owner-platform` confirma fuentes sin cambios.

La primera preparación usó un enlace a node_modules:34151 falló correctamente
por scratch bajo un ancestro enlazado. Se conservó el enlace fuera del checkout
y se copiaron físicamente las dependencias existentes (sin instalar/descargar).
No se modificó la validación de rutas reales del CMS.

40316 alcanzó pg_dump y pg_restore pero no el cierre: el worker sanea el entorno
y Chromium no estaba en la ubicación predeterminada de Playwright. Se verificó
que chromium_headless_shell-1234 ya existe en /ms-playwright y que el destino
/home/pwuser/.cache/ms-playwright no existía; se creó allí un enlace a los
navegadores preinstalados, sin saltarse TLS ni descargar ejecutables.
Este enlace de herramientas no es una raíz de almacenamiento del CMS.

Repetición36411 terminada: f10d90 exit0. PostgreSQL16.15, commit exacto a98b80d;
18 archivos en copia,12 medios verificados,3 revisiones recuperadas,3 versiones
de página. Se rechazan12 casos de daño antes de asignar destino. Acceso, historial,
preview histórico, retención exclusiva de snapshot, ejecución de plan restaurado
y edición posterior correctos. Origen lógico y recibos de backup intactos;
migración de medios con copia y reconciliación verificadas. Cluster propio cerrado
y raíz sintética eliminada.45 tests previos también verdes.

El navegador verifica imagen histórica y dimensiones a390/1280 usando el componente
de preview real y bytes HTTP; no es todo el panel Next de producción. Proveedor S3
sintético nuevo por proceso, no bucket contratado ni respaldo externo de cliente.
No se afirma recuperación ante fallo de región, RPO/RTO productivo o servicio listo.
