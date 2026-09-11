# Restauración: comprobar el aborto en la fase correcta

Base dd3d030. Cambio exclusivamente de prueba; transporte de producción intacto.

## Evidencia y causa del fallo de cobertura

En una suite completa, el ensayo con límite200ms abortó antes de que existiera
el manifiesto de destino (a67d7d). Por tanto no había alcanzado el cuerpo final
que pretendía comprobar. El archivo aislado33/33 y la repetición completa1301
pasaron sin cambiar código. El tiempo disponible para varias operaciones HTTP
no garantizaba alcanzar esa fase bajo carga; no es evidencia de corrupción ni
de que el transporte ignore los abortos.

## Cambio

El ensayo mantiene SDK, servidor HTTP y bytes reales. Sustituye solo el disparo
de AbortSignal.timeout por una señal controlada durante esta operación. Espera
el GET de verificación retenido, comprueba manifiesto escrito y operación aún
pendiente, aborta, exige rechazo con identificador y ausencia de DELETE. Después
reabre con el reloj real y comprueba los bytes. El spy se restaura en finally.

No se aumenta el plazo de producción, no se eliminan aserciones de integridad
y la prueba independiente de read conserva el reloj real150ms y su límite
externo2000ms. La nueva prueba acredita aborto durante la petición final; no
afirma haber medido en qué instante el consumidor empezó a leer cada byte.

## Verificación

- Archivo completo33/33 pasa d95495.
- Mutación temporal: omitir readRevision posterior a los PUT hace fallar la
  prueba por ausencia del GET esperado (6646f8). Se restaura inmediatamente el
  código; git diff de object-revision-store.ts vacío. Esta mutación no se entrega.
- Suite completa1301/170 y assets locales pasan,76,09s, salida0 (28c313).
  Lint y typecheck completos pasan (5615b3). No se ha modificado la configuración
  de concurrencia ni el plazo de producción para conseguir este resultado.

Limitaciones: proveedor loopback sintético; no prueba de S3/R2 real ni respaldo
externo. No UI, migración, push ni despliegue. Checkpoint preservado.
