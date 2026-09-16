# CMS remoto: puerta siguiente y evidencia actual

16/09/2026 · Codex · Base `fcf3aa9`. Manuel pide continuar implementación autónoma y avisar dependencias. No autoriza implícitamente gasto, cuentas nuevas o traslado de datos. Este avance es verificación y preparación de alojamiento; no añade código runtime ni despliega CMS.

## Verificado ahora

Comando en owner-platform:

```powershell
npx vitest run src/config/media-storage.test.ts src/config/email.test.ts src/dashboard/readiness.test.ts src/dashboard/readiness-service.test.ts src/dashboard/readiness-request.test.ts
```

58 pruebas / 5 archivos PASS, 11,27 s, salida0 (`da38b5`, sesión16456 cerrada). Comprueba validación de configuración y controles, no envío real de correo, persistencia remota ni restauración del proveedor. No se repitieron build, navegador o baterías completas: sus recibos históricos conservan sus bases de código.

## Restricciones actuales del destino

- `src/config/media-storage.ts` ya integra objetos privados: no volver a desarrollar ese adaptador leyendo informes antiguos. Requiere origen HTTPS, namespace, credenciales servidor y scratch real provisionado.
- `src/media/revision-storage-binding.ts` valida el directorio con lstat/realpath y conserva subidas/descargas autorizadas a través del servidor. El almacenamiento remoto no convierte automáticamente el transporte en subida directa del navegador.
- `src/config/email.ts` implementa Resend REST para recuperación del owner; el correo del portfolio no lo configura automáticamente.
- `src/dashboard/readiness.ts` mantiene `deploymentAllowed:false` y `productionReady:false`. No retirar esos bloqueadores por haber pasado pruebas locales.
- La [documentación Vercel vigente](https://vercel.com/docs/functions/limitations) fija 4,5 MB por cuerpo de petición/respuesta de Functions. Una imagen mayor en el flujo actual puede encontrar ese límite. Además debe probarse el scratch en build/arranque. No se ha reproducido el error en un CMS Vercel real: aún no existe ese despliegue.

## Recomendación de alojamiento, sin contratación

Mantener el portfolio en Vercel y evaluar **Node gestionado separado + PostgreSQL + objetos privados + correo owner** para el CMS. Conserva Next/Payload y el transporte actual; no es reescribir el stack. No desplegar legacy Media sobre disco efímero.

Render es candidato para presupuestar, no proveedor contratado: [compute](https://render.com/docs/compute-plans) documenta 1 CPU/2 GB (`1c-2g`), y [comparación oficial](https://render.com/docs/render-vs-heroku-comparison) indica $25/mes para esa capacidad. PostgreSQL pequeño aparece a $6/mes en el [ejemplo oficial](https://github.com/render-examples/sim-on-render); verificar precio vigente final y almacenamiento en contratación. **$31 es subtotal orientativo de cómputo, no factura completa ni garantía de capacidad.** Deben añadirse almacenamiento, copias, tráfico, correo, impuestos y condiciones del workspace si corresponden. No garantizar que 2 GB o la base más pequeña basten sin prueba de carga.

Los [discos Render](https://render.com/docs/disks) no están disponibles durante build y un disco persistente implica una sola instancia y despliegues con interrupción. No proponer snapshots del disco como sustituto de una copia externa coordinada de PostgreSQL y medios. Con objetos privados, el scratch puede ser temporal, pero debe crearse/verificarse en cada entorno apropiado antes de cargar configuración.

Alternativa: owner en Vercel, que exige resolver transporte de archivos grandes y arranque/scratch, sin asumir que pagar Pro elimina el límite. Elegir por coste total de adaptación y operación, no por compartir proveedor con el público.

## Secuencia hasta implementación alojada

1. Confirmar si ya hay destino contratado; solicitud Hub `ca5b339a-3fc1-4ed1-8670-af06e293167c`, sin respuesta/aceptación inferida.
2. Acordar presupuesto con Manuel y verificar factura/configuración completas antes de crear servicios. No activar trials con renovación ni suscripciones por cuenta propia.
3. Tras destino aprobado: preparar arranque/build y migraciones versionadas, origen HTTPS y secretos por canal del proveedor; proyecto CMS separado del portfolio.
4. Crear staging con datos sintéticos, comprobar login anónimo/owner, guardar-reabrir, subir/descargar archivos, reiniciar y recuperar correo.
5. Restaurar PostgreSQL y medios desde copia independiente y verificar consistencia. Solo entonces plantear piloto con datos reales.
6. Publicación pública sigue como hito posterior independiente; no habilitar bridge para conseguir un indicador verde.

No se solicitan contraseñas ni API keys por chat. La dependencia de Manuel es presupuesto/destino, no rehacer la investigación. Codex continúa implementación específica cuando exista esa decisión, conservando pruebas locales y web pública.
