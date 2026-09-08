# Destino del almacenamiento: puerta antes del consumidor

Base inspeccionada: `695c614`. Estado: propuesta para revisión, no proveedor contratado ni migración autorizada. El turno anterior respondió al estado y no añadió implementación CMS; este contraste identifica una dependencia concreta antes de continuar el consumidor.

## Restricción encontrada en código

`src/media/revision-store.ts` usa directorios reales, `open(..., 'wx')`, `fsync`, `lstat`, `realpath` y manifiestos locales. `revision-storage-binding.ts` requiere dos raíces físicas separadas. `src/collections/Media.ts` activa todavía el directorio legacy e imágenes exclusivamente. La API productiva y el almacén probado son, por tanto, cosas distintas.

No es correcto conectar ese almacén a un despliegue serverless por el hecho de que el portfolio esté en Vercel. [Payload documenta](https://payloadcms.com/docs/production/deployment) que un alojamiento sin filesystem persistente necesita almacenamiento externo. Esa comprobación cambia el siguiente trabajo: el consumidor de corte depende de un backend real, no solo de un registro JSON firmado.

## Dos destinos, sin tratarlos como equivalentes

| Destino | Reutilización del código | Trabajo que falta |
| --- | --- | --- |
| Owner separado en un servicio Node con volumen privado persistente y PostgreSQL | Núcleo actual de revisiones y binding reutilizables | Cuenta de servicio/ACL, mantenimiento efectivo, backup externo, restauración y pruebas sobre el volumen elegido |
| Owner serverless con PostgreSQL y objetos privados | Modelo editorial y contratos reutilizables; núcleo físico requiere adaptación | Claves inmutables, escritura condicional, lectura acotada y hashes, autorización de descarga, carga directa, coordinación de objetos/BD, retención y backups |

La documentación de [adaptadores de Payload](https://payloadcms.com/docs/upload/storage-adapters) ofrece S3 y Vercel Blob, y advierte de 4,5 MB para subidas de servidor en Vercel. Habilitar subida directa evita ese límite de transporte; no demuestra validación de archivo, versiones recuperables ni atomicidad con BD. No copiar la opción `disablePayloadAccessControl` de un ejemplo público para medios privados.

[Vercel Blob](https://vercel.com/docs/vercel-blob/usage-and-pricing) incluye uso gratuito limitado en Hobby. Eso no acredita coste cero, capacidad suficiente, backup independiente ni compatibilidad comercial de un producto futuro. No se ha abierto una cuenta, seleccionado tarifa, instalado un adaptador ni facilitado datos a un proveedor.

## Recomendación y secuencia verificable

No vincular el destino del CMS al alojamiento del portfolio. Mantener el público intacto. Para el ensayo siguiente, reutilizar PostgreSQL portable aislado y raíces sintéticas existentes **solo como laboratorio**, no presentarlos como staging persistente o backup externo.

Antes de programar el consumidor operativo, confirmar con Claude si hay un destino ya contratado/provisionado y quién controla sus escritores. Si existe un servicio Node con volumen adecuado, el consumidor offline puede aprovechar el núcleo actual. Si el destino elegido es serverless, diseñar primero el transporte de objetos; no construir un ejecutor dependiente de `fs` que haya que sustituir inmediatamente.

En ambos casos, el consumidor debe persistir estados fuera del navegador, identificar operaciones tras reinicio, mantener cierre ante commit incierto y validar el backup restaurado de la captura final. Su prueba de aceptación debe matar/reiniciar el proceso y comprobar estado real; los mocks no prueban exclusión de escritores. Se conserva el detalle de `media-cutover-trust-protocol-2026-09-08.md`, sin duplicar otro validador ni repetir los clones cerrados.

## Autoridad y siguiente responsable

Codex prepara la propuesta de implementación contra el destino confirmado. Claude aporta información verificable de infraestructura si existe, no credenciales en el Hub. Manuel decide cualquier nuevo coste, traslado de datos o activación operativa. `canApply: false` y Media legacy siguen intactos. La elección del proveedor no se infiere del permiso para seguir programando.

No hay cambios runtime ni pruebas nuevas que atribuir a este documento. Fuentes primarias consultadas el 8 de septiembre de 2026; verificar opciones del adaptador instalado antes de implementarlo, pues la documentación web puede describir una versión posterior a Payload 3.88.0.
