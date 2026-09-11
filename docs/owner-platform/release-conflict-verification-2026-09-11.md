# Conflictos de versiones: verificación del CMS owner

Base: `106cce5`. Alcance: registro de versiones, sin publicación ni cambios visuales.

## Defecto y corrección

El índice único impedía repetir un commit, pero la API compilada respondía500.
El primer arreglo basado en instanceof pasó pruebas directas y falló por HTTP
(`ecd902`). El diagnóstico acotado confirmó status400/campo gitCommit con
instanceof APIError falso (`4a3f14`): la clase del adaptador y la de la ruta
compilada no compartían identidad. La instrumentación temporal fue retirada.

El servicio reconoce únicamente status400, colección releases y campo gitCommit.
Después consulta con permisos si existe la versión confirmada. Solo entonces
devuelve ReleaseAlreadyRegistered/409 y código release_already_registered.
Sin ganador, lectura fallida o error ajeno, conserva el error original. El cliente
muestra texto fijo, nunca detalles arbitrarios del servidor. El índice de la base
sigue arbitrando la concurrencia; no se sustituye por un precheck vulnerable a carreras.
No se modifica la atomicidad preexistente entre alta de versión y auditoría.

## Evidencia

- Regresión entre módulos RED `0aed36`; focal final21 pruebas/3archivos GREEN
  `afb8c0`, incluidos errores con colección/status/campos incompatibles.
- PostgreSQL editorial36 pruebas GREEN `603e91` antes del reconocimiento estructural.
  El fixture concurrente inicialmente copiaba IDs persistidos de filas de métricas:
  fallaba por id (`4ab7f7`). Se retiraron esos IDs para simular nuevas solicitudes.
  La prueba exige un ganador, un conflicto, una versión y un evento de éxito.
- Primer build Docker falló por tests no sincronizados (`64919a`); se copiaron
  explícitamente los tests actuales, sin cambiar comprobaciones ni dependencias.
- Build/HTTP/navegador final `b66c5b`, salida0:390/1280, duplicado409 y original
  intacto; editor nativo, revisión/artefacto/preflight, medios y papelera. Seis
  borradores, dos marcas y dos encuadres conservados tras reinicio; bytes privados
  actuales/sustituidos conservados. App, clúster y raíz sintética cerrados/limpiados.
- Revisión independiente de solo lectura sin bloqueadores. No ejecutó pruebas.

Docker usa el checkout aislado recovery-8bd695e con overlays explícitos: no se
presenta como clon limpio del HEAD. Todo es sintético; no proveedor real ni móvil
físico. No acredita publicación, aislamiento entre clientes o producto terminado.
Regresión final: npm test1300/170 archivos y prueba de assets pasan (`a267b8`);
lint y TypeScript salida0 (`973db1`). Dos avisos de fixtures sin adaptador de
correo, sin envío real. PostgreSQL36/36 sobre el arreglo final pasa (`368f0b`),
con cierre de sesiones y limpieza. Frontera pública21 entradas pasa (`7c78ef`).
Checkpoint pelado0f0adf686b2752e23c25d224f8c60815b10fd451 intacto (`ff40ae`).
Commit y copia exclusivamente locales; destino privado externo sigue pendiente.
