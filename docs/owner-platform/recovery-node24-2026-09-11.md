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
