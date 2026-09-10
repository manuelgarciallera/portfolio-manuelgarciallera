# Restauración: comprobar la referencia persistida · 2026-09-10

Base `8e292c4`. Reserva Hub `7c57367c-ab53-4e64-9dd8-3d5483171d15`. Codex único escritor; revisión independiente de solo lectura. Sin cambios públicos, dependencias, despliegue ni datos reales.

## Defensa implementada

Después de actualizar el borrador, el ejecutor vuelve a leerlo con el mismo request transaccional, `draft: true`, `depth: 0` y `overrideAccess: false`. Exige una referencia histórica primitiva que coincida con el snapshot confirmado. No confía únicamente en la respuesta de update. Si falta o no coincide, responde 409 y revierte antes de crear resultados o marcar éxito. También protege páginas sin imágenes.

## Evidencia

- RED `af05d4`: la ejecución anterior aceptaba referencias persistidas inválidas. GREEN focal `c24ac8`: 9 pruebas; null, referencia incorrecta, objeto, objeto con id y array rechazados; IDs numéricos y sus equivalentes de texto admitidos. La respuesta simulada de update sigue siendo positiva para distinguirla de la lectura persistida.
- PostgreSQL 17.11 aislado `77a556`: 27 pruebas / 2 archivos, 44,25 s, salida 0. Incluye configuración completa de medios sobre disco y objetos. Los fallos inyectados solo en fixtures comprueban igualdad del borrador, publicado, capturas, auditoría y contenido de versiones tras rollback; el mismo plan funciona al retirar el fallo.
- Runner confirma cierre del proceso y sesiones, parada del clúster y eliminación únicamente de su raíz sintética; credenciales ambientales ignoradas.
- Tipos y lint `9c1a15`: salida 0. Frontera pública `c1e582`: 21 entradas, salida 0. Revisión independiente sin bloqueadores; se reforzó su observación comparando contenido de versiones además de sus IDs.

## Alcance

Suite unitaria completa `npm test -- --maxWorkers=2`: `569914`, 1180 pruebas / 161 archivos, 135,22 s, salida 0.

Es una defensa de integridad local, no una certificación de producción. No se han cambiado esquemas ni reglas de acceso. No se ha ejecutado un nuevo build ni desplegado este incremento.
