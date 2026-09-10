# Coherencia de URL en preflight histórico

Base `c557451`. Reserva comunicada por Hub `201a7e80-bc58-4893-848a-a786fdc974bf`.

## Defecto reproducido

El editor validaba el identificador desde `b4ded0b`, pero una exportación histórica íntegra con `a/b`, espacios, URL completa, fragmentos, parámetros, separadores codificados o más de120 caracteres recibía estado `ready` si el resto era correcto. Siete reproducciones fallaron por esa razón (`926bb0`: expected blocked, received ready).

## Corrección

`src/content/slug.ts` concentra la regla pura usada por el campo Payload y por `createPublicationPreflight`. El informe devuelve `invalid_slug`, severidad blocker e ID de la página. Se mantienen los hashes, el contenido y la consulta/exportación histórica: no se modifica una cápsula para hacerla pasar. Acentos, marcas combinantes y mayúsculas válidas se conservan.

Esto corrige el informe, no implementa un despliegue ni activa el puente público. `ready` sigue siendo preparación estructural, no aprobación de publicación, validación del proveedor, accesibilidad ni garantía de que existan los recursos referenciados. Las exportaciones descargadas pueden contener identificadores históricos inválidos; el consumidor debe exigir un preflight vigente antes de una futura aplicación.

La auditoría del servicio detectó además un retorno temprano de cualquier informe existente. Segunda reproducción RED `86e335`: devuelve ready antiguo en vez de blocked nuevo. El servicio ahora verifica primero artefacto/paquete y reproduce el informe con las reglas actuales y su fecha original. Solo reutiliza si hash, relación y metadatos coinciden; si no, conserva la evidencia anterior y añade un informe nuevo. Consulta primero el más reciente por checkedAt. No modifica informes ni despliega contenido. La lectura directa del histórico continúa mostrando su resultado de aquella fecha, no una acreditación vigente.

## Pruebas

- RED: siete casos malformados devuelven ready (`926bb0`).
- GREEN: publicación, recuperación y campo editorial, 98/98 en21 archivos (`24770f`). Sin mocks para el recorrido cápsula → paquete → artefacto → exportación → preflight.
- Tipos y lint, salida0 (`7aee05`).
- Tras corregir la reutilización: focal99/21 (`ff9165`), tipos/lint0 (`7dc2d6`). Regresión1240/163 `ac789b` corresponde al paso previo al cambio de servicio; no se atribuye a la versión final.
- PostgreSQL17.11, 26/26 (`f1108c`, 22,64s): un informe vigente persistido se reutiliza con mismo ID/contenido y sin nueva auditoría; proceso/sesiones/clúster cerrados y limpieza verificada.
- Revisión independiente solo lectura: sin bloqueadores. Cobertura futura señalada: informe legacy completo con hash firmado por las reglas antiguas (el caso de regresión actual usa registro incompleto) y fechas futuras/empates de checkedAt. No se afirma idempotencia general bajo esos casos ni concurrencia; la ordenación actual es solo por fecha.
- Regresión final1241/163 (`e5de48`,133,91s). Build y ensayo Next productivo aislado `4d9053`, salida0: login por teclado/cookie a390/1280, anónimo denegado y borrador conservado tras cambiar de proceso. App/clúster cerrados, raíz sintética retirada. Modo local/legacy: no acredita proveedor de objetos, TLS de producción ni teléfono físico.
- Frontera pública21 entradas (`5dc4b1`), salida0. Checkpoint preservado; sin push/despliegue.
- Sin esquema, permisos, dependencias nuevas, cambios públicos ni datos reales.

Pendiente operativo general: staging con almacenamiento real y TLS válido, recuperación verificada y puente de publicación controlado. No resuelto por este parche.

## Seguimiento: evidencia histórica íntegra

Sobre base a10b65e se sustituye el fixture parcial del servicio por uno completo con report, hashes, fecha, relación, autor y metadatos. Representa las reglas anteriores que comprobaban bloques y SEO pero no el segmento URL. Su SHA-256 se construye de forma independiente y el verificador confirma integridad antes de ejecutar el servicio; no es una firma criptográfica de autoría.

GREEN inicial4/4 `5f1de8`. Mutación temporal de retorno ciego del informe guardado: un fallo esperado `8fecf8`, devuelve ready antiguo. Mutación retirada íntegramente, diff del runtime vacío `b0fae0`; GREEN publicación69/18 `d9962a`. Esta evidencia cierra la observación de registro legacy incompleto, no la de fechas futuras/empates ni concurrencia. Solo cambia la prueba y este recibo; no se repite build o full de runtime sin cambios.
