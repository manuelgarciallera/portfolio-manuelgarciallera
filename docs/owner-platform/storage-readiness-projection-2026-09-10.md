# Estado informativo del almacenamiento · 2026-09-10

Base `a6d56de`; reserva/propuesta Hub `1e7f45e0-c9ee-4153-bc43-776de4569e69`. Codex único escritor. Corrige el hallazgo de `build-readiness-recheck-2026-09-10.md`.

## Cambio

Las dos rutas owner (dashboard y readiness) observan la colección Media del Payload ya ensamblado y trasladan únicamente el booleano `disableLocalStorage` junto al selector de modo del servidor. La proyección informa `objects` y `adapterConfigured: true` cuando el modo es explícitamente objects y la escritura local está deshabilitada. Si hay contradicción o un modo desconocido, informa `unknown` y no configurado; el modo legacy conserva el informe local.

No valida el proveedor, crea clientes, consulta el bucket, copia credenciales ni modifica Media. Conserva `durable: false`, todos los bloqueos operativos y los indicadores de despliegue/puente público desactivados. Configuración observada no significa persistencia ni copias recuperables verificadas. El servicio y ambas rutas conservan autenticación owner.

## Verificación

- TDD RED `336977`: cinco fallos reales, siempre devolvía local/no configurado. GREEN focal `7c873e`: 18 pruebas en tres archivos, incluyendo rechazo de acceso anónimo.
- Tipos y lint completados con salida 0 `7f1d8d` (tipos antes de lint en el mismo proceso). Frontera pública `9dc227`: 21 entradas, salida 0; diff check correcto.
- Suite completa `npm test -- --maxWorkers=2`, `cbd9cf`: 1185 pruebas / 161 archivos, 137,25 s, salida 0. Revisión independiente de solo lectura sin bloqueadores, sin atribuir nuevas pruebas al revisor. Checkpoint `0f0adf6` confirmado.

Sin nuevas dependencias, cambios de esquema, diseño público, proveedores, datos reales, push o despliegue. No se ejecuta un build nuevo en este incremento; el build del recibo anterior precede a esta corrección.
