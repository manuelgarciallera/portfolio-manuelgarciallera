# Ensayo HTTP del build productivo · 2026-09-10

Base `751fe10`; reserva Hub `acbca327`. Codex único escritor. Nuevo comando de QA: `node scripts/test-production-http.mjs`, con `OWNER_POSTGRES_BIN` apuntando a las herramientas PostgreSQL locales ya instaladas.

## Recorrido

- Build Next real con entorno permitido mínimo y claves de `.env*` anuladas. Secreto y configuración de correo/origen sintéticos; no envío de correo ni operación de proveedor.
- Clúster PostgreSQL propio loopback/SCRAM. Un worker instala el catálogo baseline con `push:false`, crea únicamente un owner sintético y cierra antes de arrancar Next.
- `next start` en loopback, `NODE_ENV=production`, sin indicador de build en runtime. Login por HTTP con JWT; acceso anónimo a readiness rechazado.
- Crear y editar un borrador por REST; comprobar título y estado antes de reiniciar. Cerrar el proceso Next, abrir otro PID contra la misma base y comparar íntegramente el borrador recuperado con el anterior.
- Cierre del proceso propio y del clúster mediante controlador existente; eliminación solo de su raíz validada. No se usa reset, schema push, DNS, despliegue o base real.

## Revisión y límites

### Ampliación de navegador sobre 431fe8b

Reserva Hub `f0e8c8fa`. `tests/production/browser-login.mjs` añade Chromium real a 390 y1280px, cada uno con contexto nuevo. Contraseña incorrecta devuelve401 y browserfetch confirma user null. Entrada por teclado correcta devuelve200, redirige a Páginas y conserva sesión después de recargar, con enlace Cuenta visible, sin pageerror ni desbordamiento horizontal. No se inyectan JWT/cookies al navegador. Todas las operaciones están acotadas; contextos/browser se cierran en finally.

Ejecución completa final `dbdbf9`, salida0: ambos viewports y recorrido HTTP/reinicio anterior correctos; app/clúster cerrados y limpieza de raíz sintética verificada. Lint focal/diffcheck `fd4a91`, salida0. Revisión independiente solo lectura sin bloqueadores. No hay cambios runtime/dependencias ni afirmación de revisión visual por capturas: se comprobaron elementos y geometría en navegador.

Esta ampliación prueba cookies en loopbackHTTP con `next start` productivo, no TLS ni móviles físicos. Los contextos se cierran antes del reinicio posterior: el JWT del ensayo HTTP persiste durante ese reinicio; la sesión de navegador se verifica tras recarga, no tras reinicio. `agent-browser` no estaba disponible; se reutilizó Playwright instalado sin añadir herramientas.

Primer recorrido `7afebd` salida0, con cierre/limpieza; no se acepta como puerta final porque la revisión identificó dos P2: HTTP sin timeout y una comparación que podía pasar si se ignoraba el PATCH. Corregidos con AbortSignal en todas las peticiones y GET200/título literal/estado draft antes del reinicio.

Ensayo completo final `076dd2`, salida0: build, seed, HTTP, persistencia tras reinicio y cierre/limpieza correctos. Lint focal y diffcheck `9be1de`, salida0. Revisión independiente posterior cerró ambas objeciones, sin ejecutar pruebas propias. No se repite la suite unitaria global para este incremento exclusivamente de herramientas de aceptación; las rutas runtime permanecen intactas.

El recorrido HTTP original usa JWT explícito; la ampliación anterior cubre por separado cookies reales de navegador. Origen HTTPS canónico sintético, transporte de prueba loopback HTTP sin validar TLS. No se activa modo objetos ni se suben archivos. No acredita auditoría visual completa, recuperación ante caída de máquina, correo, infraestructura remota, retención o seguridad de un proveedor. No cambia runtime ni dependencias del producto. Es prueba de aceptación del código existente; si detecta un defecto de producción, se abrirá su ciclo TDD separado.
