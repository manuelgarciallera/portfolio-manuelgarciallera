# Auditoría owner tras entrega pública 23b3824

## Fallo observado

GitHub CI34394324816: validate pública correcta; job owner completa tests, integración, lint, tipos y build, pero falla su auditoría runtime. Dos causas: Sharp<0.35.4 y Payload<=3.88.0, GHSA-jg8r-5jh2-v2xj. No es un fallo funcional de esos tests ni prueba de explotación productiva.

## Corrección acotada

Owner Sharp0.35.3→0.35.4, sin modificar Next/Payload, código público, datos ni secretos. Lockfile revisado por versiones: Sharp/libvips actualizados y duplicados de Sharp bajo Next eliminados por deduplicación. No nueva dependencia directa. La auditoría runtime posterior ya no informa altas; conserva ocho entradas moderadas derivadas del único aviso Payload.

## Payload: no inventar un parche

El registro npm informa latest3.88.0;3.88.1 devuelve404. El aviso https://github.com/advisories/GHSA-jg8r-5jh2-v2xj declara ninguna versión corregida. No ejecutar audit fix --force: propone downgrade incompatible de paquetes Payload a0.1.9.

Mitigación ya existente en el proyecto: `Users.access.unlock = ownerOnly`. Users es la única colección de autenticación productiva encontrada. `tests/auth-unlock.integration.test.ts` usa REST real y datos sintéticos: bloquea una cuenta por intentos, prueba anónimo y una identidad autenticada de otra colección, exige403 y persistencia del bloqueo pese a overrideAccess/role falsificados; permite recuperación del owner autorizado. Esto no elimina el advisory del paquete ni acredita aislamiento multi-tenant futuro.

## Puerta de publicación

No se modifica la CI, se omite el aviso ni se baja el umbral. Revisión independiente solicitada a Claude por Hub82090db1. Una eventual excepción necesitaría alcance exacto, prueba negativa obligatoria, caducidad y revisión, no una lista blanca permanente. No está aprobada ni implementada. CMS productivo sigue sin activar.

## Pruebas de esta revisión

Check owner sesión14234:982unitarias pasan; integración interrumpida por salida inesperada de un worker,35/44 terminadas, salida1. No se oculta ese fallo ni se conoce su causa. Prueba auth-unlock aislada95624 pasa1/1. Repetición de integración con reporter verbose20752 pasa44/44,5archivos sin errores, salida0; no cambió código para conseguirlo. Lint y tipos34715 salida0. Build31205 salida0,23páginas. Audit runtime salida1:8moderadasPayload,0altas/criticas. No afirmar auditoría completa verde ni fallo de worker corregido.
