# Ensayo de recuperación con configuración owner completa

Fecha: 2026-09-10. Codex. Base Git: `c77e74cf435990aae1decb46806a09411892e411`.
Solo herramientas de prueba; no configuración ni datos de producción.

## Revalidación posterior sobre c117c47

Ejecutado nuevamente el comando completo con `--object-media --full-owner` sobre `c117c47a45ad08ed21058f8fb926afcb4cd75f29`, después de las correcciones de referencia histórica y readiness. Reserva Hub `15bff8a5`. No se añadió un runner duplicado ni se modificó runtime.

- Preflight `e1b9d7`: 45 pruebas / 5 archivos, 8,14 s, correctas.
- Resultado terminal `d62a6d`, salida 0, PostgreSQL 17.11: 18 archivos de backup, 12 archivos de medios verificados, 3 revisiones de imágenes y 3 versiones de página recuperadas.
- 12 casos de daño/ausencia rechazados antes de asignar destino. Login, historial, edición independiente, preview congelada, retención por snapshot, ejecución del plan y edición posterior correctos. Copia ligada al inventario y reconciliación: 3 revisiones reconciliadas y 3 archivos retenidos.
- Origen lógico y recibos de backup intactos. Cero sesiones del origen antes de dump; proceso de seed cerrado y proceso de restauración distinto. Clúster detenido y solo su raíz sintética eliminada, verificado.

Esta es evidencia nueva del recorrido en procesos independientes. No acredita un arranque Next en un proveedor real, reinicio de máquina, correo entregado, backup externo, cifrado/retención operativos ni recuperación ante una caída abrupta. El servicio de objetos de prueba nace vacío en el proceso de restauración y se repuebla desde la copia validada. No hay proveedor activado ni datos reales.

Próxima puerta: arranque HTTP del build productivo con configuración aislada y su circuito editorial; después staging autorizado. Sin push, despliegue ni cambios públicos. Las secciones siguientes conservan la historia del primer ensayo.

## Recorrido

Comando desde `owner-platform`, con las herramientas PostgreSQL 17.11 locales:

```powershell
$env:OWNER_POSTGRES_BIN=(Resolve-Path 'node_modules/.cache/postgres-tools-17.11/unpacked/pgsql/bin').Path
node scripts/test-recovery-postgres.mjs --object-media --full-owner
```

El modo se añade por separado; `--object-media` sin `--full-owner` conserva su
fixture mínimo. `--full-owner` sin objetos se rechaza antes de crear un cluster.

1. Cluster propio en loopback, credenciales sintéticas y entorno filtrado.
2. `createOwnerConfig` completo, selección real de almacenamiento de objetos,
   adaptador PostgreSQL con `push:false` y catálogo nativo baseline + delta de
   objetos. Se omite `schemaName`: PostgreSQL usa su esquema público por defecto.
   El directorio de migraciones se resuelve desde el cwd controlado del worker.
3. Login owner HTTP, marca y página reales, tres revisiones de imagen, historial
   de borradores, captura congelada, cápsula de borrador, release y plan preparado.
   Las métricas de la release son datos sintéticos de prueba, no puntuaciones
   medidas del producto.
4. Cierre de escritor/proceso y comprobación de cero sesiones antes de `pg_dump`.
   Copia conjunta del archivo PostgreSQL y revisiones exportadas.
5. Rechazo de originales, derivados, manifiestos y archivo DB corruptos o
   ausentes antes de crear el destino de restauración.
6. `pg_restore` en otra base y otro proceso; proveedor sintético inicialmente
   vacío. Se comparan página, historial, marca, release, plan, cápsula, auditoría,
   ledger de migraciones y referencias contra los recibos anteriores a la copia.
7. Confirmación y ejecución del plan recuperado mediante servicios reales con
   owner autenticado y Local API. Edición posterior por HTTP y previsualización
   conservando la imagen histórica. Se verifica también la edición de la imagen.
8. Captura congelada renderizada en Chromium a 390 y 1280 px, comprobando píxel
   histórico, dimensiones, ausencia de desbordamiento y errores de página.
9. Nueva apertura del origen para comprobar que no cambió; cierre del cluster y
   limpieza exclusivamente de su carpeta sintética, verificadas por el controlador.

## Evidencia de esta iteración

- RED 91a48f: el modo nuevo exigió releases/restore-plans y rechazó el fixture
  reducido anterior. Cluster cerrado y carpeta sintética retirada.
- Diagnósticos del entorno: 92f5aa detectó secreto ausente al importar la
  configuración completa; ahora el proceso usa exclusivamente el secreto
  sintético recibido por IPC. 3cfab1 detectó `schemaName: 'public'` explícito,
  que Drizzle rechaza; se corrigió por omisión como en el ensayo del catálogo.
- Ensayo completo a951d3, salida 0: 45 pruebas previas/5 archivos, 3 revisiones,
  12 archivos, 3 versiones de página y 8 rechazos de integridad. `planExecuted`
  y `pageEditedAfterRecovery` verdaderos; ledger, auditoría, estado editorial,
  origen y backup conservados. Proceso/cluster/carpeta cerrados y verificados.
  El SHA del recibo es la base Git; los cambios de ensayo aún no tenían commit.
- Revisión independiente de solo lectura: sin bloqueadores identificados;
  aceptación sujeta a ensayo real. No ejecutó pruebas.
- Suite de integración completa: 60/60 en 10 archivos, 152,87 s (3c2acc),
  salida terminal 0 y cierre de sesiones/cluster/carpeta (e62e23). Controlador
  PostgreSQL 17.11; `auth-unlock` conserva su fixture SQLite explícito.
- Invocación incompatible `--full-owner` sin objetos: rechazo esperado, salida
  1 antes de inicializar cluster (8d4334).
- Typecheck 90eb11 y lint focal a4a5cb: salida 0. Frontera pública 21 entradas
  acbc8c, checkpoint original intacto 83c48f.
- Regresión del modo anterior `--object-media` sin `--full-owner`: 583397,
  salida 0, 3 versiones de página/12 archivos/8 rechazos, origen y backup
  conservados, cierre y limpieza verificados.
- Unitarias completas: 1.160/1.160 en 161 archivos, 69,21 s, salida 0 (b27cfd).
- Typecheck y lint completos finales: salida 0 (73ad65). Sin cambios de runtime,
  no se ha repetido un build de Next ni desplegado este candidato.

## Revalidación con instalación Linux nueva · 14/09/2026

`npm run test:recovery:postgres -- --object-media --full-owner`, sesión 80532,
termina con salida 0 (51e941) después de 47 pruebas auxiliares. PostgreSQL 16.15,
pg_dump/pg_restore reales hacia una base nueva, con configuración owner completa
y proveedor de objetos sintético. Instalación de dependencias Linux nueva desde
caché, según maintenance-automation-2026-09-05.md.

Resultado: 18 archivos de respaldo, 12 medios verificados, tres revisiones,
tres versiones de página y dos de artículo; 12 daños rechazados antes de asignar
el destino. Login, historial, preview congelado, plan de restauración y edición
independiente de página/artículo recuperados. Diario/reconciliación de copia
verificados, tres derivados retenidos. Estado lógico de origen y recibos de
backup intactos; conexiones cerradas antes de copia, clúster detenido y raíz
sintética retirada al terminar.

Procedencia explícita: base Linux 230278e más overlays actuales de configuración
unitaria, pruebas de bloques y etiqueta de ProjectGrid (5ea3e51 en el host).
El SHA informado por el runner es la base, no el commit final. No se presenta
como checkout exacto ni como backup externo, ensayo con datos de clientes,
medición RPO/RTO o recuperación de infraestructura alojada. No se cambian
runtime ni permisos en esta revalidación; no hay push o despliegue.

## Límites y siguiente puerta

Configuración y esquema completos no equivalen a haber ejercitado todas las
funcionalidades: esta prueba siembra únicamente el recorrido editorial descrito.
No acredita UI administrativa completa, colaboración multiusuario, aislamiento
entre clientes, correo, importación Figma ni publicación del portfolio.

El proveedor S3 de prueba no acredita permisos ni durabilidad de un servicio
remoto. No hay migración física de datos legacy ni reconstrucción ficticia de
históricos perdidos. No hay cutover, despliegue, gasto ni modificación pública.

Siguiente: enlazar el inventario/mapeo histórico auténtico, staging, diario y
reconciliación de copia con este ensayo, y preparar el staging operativo antes de
solicitar acceso a infraestructura real. Las copias externas, cifrado, retención y
RPO/RTO deben definirse y probarse aparte.

Reserva Hub: `3069a451-388a-4b97-9dbc-4b4326be728c`. Codex integra; Claude recibe
el resultado para revisión. Envío no demuestra procesado, aceptación ni servicio
de coordinación permanente.
