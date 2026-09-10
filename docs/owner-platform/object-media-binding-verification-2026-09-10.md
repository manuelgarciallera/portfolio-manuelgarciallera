# Binding de medios con transporte de objetos

Base: `d423d70`. Reserva Hub `ceae4706-1f2e-4cf0-9991-3c1077a3b3e8`. Codex, 10 septiembre 2026. Opt-in, sin activación de Media, sin push ni despliegue.

## Implementación

`createTransportRevisionStorageCollection` recibe un store del servidor con `read`/`write`. Reutiliza el mismo código de autorización, URL por documento/revisión, acceso histórico owner, capability de restauración y comprobación de origen del recorte. El transporte debe devolver revisiones completas e inmutables verificadas; no recibe buckets o prefijos del usuario. Configuración incompleta rechazada al crear la colección.

La factory existente `createRevisionStorageCollection` sigue validando raíces provisionadas, enlaces y separación, y delega al binding común usando el almacén filesystem original. No elimina sus defensas ni cambia su API. `staticDir` permanece explícito y provisionado, sin persistencia local ni fallback. Preparar ese scratch en serverless sigue siendo responsabilidad del arranque antes de activar.

## Evidencia y límites

- TDD: prueba nueva falla por factory ausente; luego pasan subida y descarga con SDK real/HTTP local. Cuatro configuraciones inválidas fallan por aceptación indebida y pasan tras validar el transporte.
- Integración real Payload REST: inicialmente el fixture no conectaba el transporte, con NotFound al leer objetos y 201 pese al fallo del proveedor. Se añade inyección explícita al fixture, separando directorios, DB SQLite y schema PostgreSQL del caso filesystem.
- Recorrido probado: imagen sintética → subida → derivados → recorte nativo → bytes históricos intactos → descarga owner histórica/404 anónimo → restauración completa y descarga de cada binario → rechazo de corrupción → papelera y revocación de URL. No se borra la revisión privada cuando se retira el documento.
- Fallo del primer PUT: respuesta fallida y número de documentos sin aumento. Esto **no** prueba todavía rollback de una transacción de DB que falle después de guardar todos los objetos.
- Suite unitaria: 1018/1018 en 151 archivos; integración SQLite: 46/46 en seis archivos. Typecheck y lint: salida 0.
- PostgreSQL17.11: 46/46 en seis archivos, salida0; proceso de pruebas terminado, cero sesiones y cierre/limpieza del clúster sintético comprobados. Primer intento rechazado antes de crear clúster por OWNER_POSTGRES_BIN ausente; repetido con binarios portables existentes, sin instalar motor ni usar credenciales ambientales.
- Build owner Next16.3.4: salida 0, 23 páginas. Binario directo con OWNER_PLATFORM_BUILD_PHASE=1 y retirada de --use-system-ca solo en el proceso hijo; sin limpiar directorios de otros servidores ni modificar TLS global.
- Frontera pública: 21 entradas correctas; diff vacío en fuentes públicas, package/lock raíz y next.config.ts. No hay medición nueva de CWV ni despliegue.
- Revisión independiente read-only: sin Critical/Important. Minor aceptado como siguiente prueba: fallo posterior a escritura exitosa, conservación y recuperación de revisión huérfana. El revisor no ejecutó pruebas.

SDK y Payload reales, servidor S3 de prueba en loopback y cuentas sintéticas. No certifica Cloudflare R2, no prueba copia externa/restauración tras pérdida del proveedor, no activa multi-tenant ni modifica datos reales. Las alertas de Payload y la recuperación de cuenta por correo siguen pendientes según la auditoría anterior; no se declara CMS listo para producción.

## Siguiente responsable

Codex: comprobar rollback posterior a escritura y recuperación de objetos, luego cierre de activación/configuración y staging autorizado. Claude: revisión por Hub, sin escritura simultánea. Revertir este commit local devuelve el binding exclusivamente filesystem sin migraciones ni datos que revertir, porque no se ha activado el transporte en la app.
