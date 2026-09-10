# Conservación de derivados en planes de copia

Fecha: 2026-09-10. Base: `476b2bf`. Candidato interno; no activado en producción.

## Problema y solución

Una captura histórica puede referenciar solo el original de una revisión que
también contiene miniaturas. El verificador exige conservar exactamente todos
los archivos del manifiesto. Inventar referencias editoriales a las miniaturas
para satisfacerlo sería incorrecto.

El plan admite ahora `retainedFiles` mediante un esquema 2 explícito. Esos archivos
solo pueden complementar revisiones ya presentes en la evidencia lógica. No
satisfacen referencias ausentes, no autorizan acceso y no añaden revisiones
huérfanas. Participan en el digest, los controles de nombres y los límites
acumulados. Los planes sin esta propiedad conservan el formato 1.

Verificación física, copia con diario y reconciliación leen la unión de archivos
referenciados y retenidos. `canApply` sigue siendo falso. No cambia ningún endpoint,
permiso, esquema de base de datos, dependencia o componente público.

## Pruebas

- RED `b9c792`: falla la conservación de la miniatura por propiedad no admitida;
  las otras 16 pruebas físicas pasan.
- GREEN focal `2a7b2e`: 113 pruebas, cuatro archivos. Incluye compatibilidad,
  límites, referencias históricas ausentes, colisiones y manipulación del digest.
- Copia y reconciliación con SDK S3 real sobre proveedor sintético: dos archivos,
  24 bytes. Cambiar simultáneamente miniatura y manifiesto se detecta como
  discrepancia contra el candidato independiente.
- Suite completa `c665b3`: 1.172 pruebas en 161 archivos, 68,60 s, salida 0.
- Typecheck y lint completos `6a0c7c`: salida 0. Diff check `776ac8`: limpio.
- Revisión independiente de solo lectura: sin bloqueadores del candidato;
  el revisor no ejecutó pruebas.
- Guardas públicas `e2e738`: frontera de 21 entradas, estructura hero, tipografía
  en ocho perfiles y estructura de navegación móvil correctas. No son una
  auditoría visual ni métricas de usuarios reales.
- HTTP público `554c19`: 200 en inicio, sobre-mi, proceso, investigación,
  caso NudeProject y favicon.ico; favicon con tipo image/vnd.microsoft.icon.
  No se envió correo ni se comprobó visualmente WebGL en este turno.

## Pendientes y decisión de alcance

El ensayo completo de recuperación owner aún reproduce revisiones mediante el
transporte directamente. Se retiró únicamente nuestra aserción experimental
`migrationCandidate` que fallaba por una integración todavía ausente; no se ha
declarado verde esa futura integración ni alterado el recorrido anterior.

Próxima puerta: extraer inventario real de Payload y manifiestos conservados,
persistir plan e inventario dentro de la copia conjunta, validar contra la base
restaurada y ejecutar copia con diario y reconciliación en un destino sintético.
La autenticidad histórica debe demostrarse; no se reconstruyen bytes perdidos
con la imagen actual. No se ha repetido PostgreSQL, build de Next ni navegador
para este cambio interno. Staging real, permisos de proveedor, costes, retención
y recuperación externa siguen requiriendo su propia aceptación.

Codex integra; Claude recibe el relevo por Hub. Reserva de esta continuación:
`c1c34920-b240-4077-a707-90119b424e78`. Enviado no equivale a procesado o aceptado.
