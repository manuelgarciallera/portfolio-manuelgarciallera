# Restauración entre instancias de módulo · 2026-09-10

Base `6bb8de7`. Reserva Hub `94901490`; propuesta técnica `7051cd14`. Codex único escritor. Cambio local, sin publicación, datos reales ni dependencias nuevas.

## Defecto y causa comprobada

El ensayo adicional del recibo `editor-labels-2026-09-10.md` no encontraba el control para usar las imágenes actuales. Se adelantó la lectura del borrador a la espera de UI: `897548` demuestra que `restoredMediaSnapshot` es `null` después de una ejecución de restauración aceptada.

Instrumentación temporal `f28934`: el servicio concede la capacidad en una instancia del módulo y el hook consulta otra. Una marca diagnóstica en la petición demuestra que es el mismo objeto, pero el segundo WeakMap no lo contiene. La instrumentación se retiró íntegramente: no se conservan marcas sobre requests, logs ni identificadores diagnósticos en producción.

## Corrección

Compartir el WeakMap entre instancias del mismo ámbito global mediante un `Symbol.for` con nombre propio y versión. La propiedad global no es enumerable, escribible ni configurable. Un registro existente de tipo inesperado se rechaza.

La capacidad continúa ligada a la identidad exacta del request del servidor. No procede de body, context, campos, símbolos del request ni prototipos. Conserva rechazo de concesiones anidadas sobre el mismo request y eliminación en `finally`; requests diferentes pueden operar con snapshots diferentes.

No es una barrera frente a código servidor arbitrario: ese código ya pertenece al ámbito de confianza y podía llamar al servicio. No pretende compartir objetos entre procesos, workers o ámbitos globales independientes.

## Pruebas

- Dos imports efectivos del módulo tras invalidar caché de pruebas: RED `220f54`, esperaba snapshot 7 y obtenía null. Comprueba también rechazo anidado entre instancias, vidas de concesión solapadas con requests distintos, ausencia de permiso de un tercero y limpieza tras excepción.
- GREEN focal `f879d0`: 10 pruebas en dos archivos, incluyendo ejecución de restauración.
- GREEN Next real `83ea12`: control visible y editable, snapshot persistido antes de la UI, selección sin efecto antes de guardar, referencia eliminada tras guardar, título y estado draft correctos, sin errores de página ni desbordamiento a 390 y 1280 px. Datos sintéticos y servidor cerrado.
- Tipos y lint: `f2be8a`, salida 0. Frontera pública: 21 entradas, `d7e3f7`, salida 0.
- Revisión independiente de solo lectura: sin bloqueadores de compatibilidad o autoridad; ejecución PostgreSQL y suite completa se registran al finalizar.
- PostgreSQL aislado 17.11: `58f4fd`, 60 pruebas / 10 archivos, 134,20 s, salida 0. Incluye edición y restauración con configuración completa sobre disco y objetos, conservación de bytes históricos, permisos, auditoría y recuperación de acceso. El runner verificó cierre de proceso y sesiones, detuvo su clúster y eliminó únicamente su raíz sintética.
- Suite unitaria completa: `npm test -- --maxWorkers=2`, `c94d7b`, 1174 pruebas / 161 archivos, 136,79 s, salida 0. No se ha ejecutado un nuevo build ni desplegado este incremento.

## Límite y siguiente defensa

El fallo concreto queda corregido en la prueba Next; no se afirma despliegue ni disponibilidad en un teléfono físico. Conviene que el ejecutor de restauración rechace y revierta explícitamente una referencia histórica ausente o incorrecta antes de marcar éxito, además de comparar contenido y referencias de imágenes. Esa defensa adicional todavía no forma parte de este cambio.
