# Build y revisión de puertas operativas · 2026-09-10

Base comprobada: `f8f01ad121b63513c2566dde1ef069923e0b3d9b`. Reserva Hub `64c2d3df-d415-4d95-a7ce-49b501bd4f50`. Único escritor/build: Codex. El turno anterior fue progreso: implementación, pruebas y commit de integridad de restauración.

## Build nuevo

`next build` directo con Next 16.3.4 instalado: salida 0, `1ea061`. Compilación 8,6 s, TypeScript 11,5 s, 23 páginas generadas. Proceso cerrado. Entorno permitido mínimo, claves de archivos `.env*` anuladas sin imprimir valores, secreto sintético, `OWNER_PLATFORM_BUILD_PHASE=1`, base de build en memoria. No se usó el helper que borra `.next/dev`, ni hubo otro proceso Next detectado al comenzar.

Esta prueba corresponde al modo legacy por defecto, no al modo objetos ni a un servidor productivo arrancado. No conecta con PostgreSQL alojado, correo real o un bucket privado. No hubo cambios de fuentes generados ni modificaciones de la web pública. No acredita despliegue.

## Corrección de la lectura del estado

El documento inicial `cms-readiness-2026-09-10.md` describe una base anterior. No debe usarse como inventario actual de código pendiente:

- `src/payload.config.ts` ya incorpora `createOwnerEmailAdapter` y `configureMediaStorage`.
- El transporte de objetos está implementado con selección explícita del servidor; ver `object-storage-runtime-2026-09-10.md`. No equivale a un proveedor activado o respaldado.
- El transporte de recuperación está implementado; ver la serie `account-recovery-*`. La recepción real en buzón sigue sin demostrarse aquí.
- El commit anterior verificó 1180 unitarias y 27 integraciones PostgreSQL; su recibo es `restore-persisted-binding-2026-09-10.md`. Es evidencia anterior identificada, no repetida en este turno.

## Hallazgo accionable siguiente

`src/dashboard/readiness.ts` mantiene `mediaStorage` fijo en `{ adapterConfigured: false, durable: false, kind: 'local' }`, sin recibir la selección de objetos. Esto es conservador para autorizar despliegue, pero no describe correctamente una configuración válida de objetos. La siguiente mejora local debe distinguir configuración de verificación operativa, sin convertir una variable de entorno en prueba de durabilidad y sin revelar credenciales.

## Puertas que permanecen abiertas

1. Informes de preparación fieles a la configuración, con pruebas negativas y sin autorización implícita.
2. Ensayo de runtime productivo y modo de almacenamiento elegido, con datos sintéticos y migraciones verificadas; no reutilizar bases reales para comprobar esquemas.
3. Staging autorizado: PostgreSQL y objetos persistentes, permisos privados, copias externas restauradas, recuperación de cuenta con recepción real y recorrido editorial tras reinicio.
4. Puente público y revisión de despliegue explícitos; continúan desactivados en readiness. No desplegar por haber pasado el build.

No se necesita acción de Manuel para las pruebas locales siguientes. Contratación, costes y activación de proveedores permanecen sujetos a aprobación concreta. Claude recibe el recibo por Hub; envío no supone aceptación.
