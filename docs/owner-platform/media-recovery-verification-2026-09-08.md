# Recuperación física de todas las revisiones de medios

Implementación: `73a52f6`, sobre la base `00dd241`. Estado: ensayos completados y
revisión independiente aprobada, sin hallazgos críticos o importantes. La biblioteca activa sigue usando su
configuración anterior. No se han migrado datos reales ni desplegado el CMS.

## Qué demuestra el ensayo

El nuevo modo `--versioned-media` de los dos scripts de recuperación conserva la
base de datos junto con **todas** las carpetas de revisiones retenidas: no solo
las imágenes que aparecen en el documento publicado actualmente.

El conjunto sintético incluye A roja (1920×1200), B azul publicada (1920×1440),
C verde como último borrador (1920×1080), otra imagen independiente, una revisión
completa huérfana tras un fallo real de persistencia y un intento vacío incompleto.
Las sustituciones A/B/C usan el mismo nombre de entrada. Se comprueban originales
y derivados, bytes/hash/dimensiones, versiones documentales e instantánea congelada.

Tras detener los escritores, la copia se restaura en otra raíz y otro proceso;
PostgreSQL usa además otra base de datos y verifica ausencia de sesiones antes
del `pg_dump`. Desde la copia recuperada se restaura A por HTTP autenticado y se
descargan sus cuatro archivos históricos. Se verifican de nuevo permisos de
publicación, borrador, historial, revisión ajena y huérfana. Una edición posterior
de la copia no modifica ni el origen ni el archivo de respaldo.

## Defecto de verificación reproducido

El manifiesto físico anterior verificaba archivos, pero no podía detectar la
desaparición de una carpeta vacía de un intento incompleto. La prueba inicial
falló precisamente porque aceptaba esa copia. El nuevo verificador añade el
inventario `media/revision-inventory.json`, cubierto a su vez por el manifiesto
de archivos, y contrasta también los directorios reales antes de asignar destino.
No cambia el formato ni el comportamiento por defecto del helper legacy.

## Resultados registrados

Windows, Node 24.13.0, Payload 3.88.0 y PostgreSQL portátil 17.11. Comandos desde
`owner-platform`; los ensayos PostgreSQL utilizan la ruta local de herramientas
ya disponible mediante `OWNER_POSTGRES_BIN`. No se instaló otro motor.

| Comprobación | Resultado sobre la implementación final |
| --- | --- |
| Verificador de inventario focalizado | 14/14; salida 0 |
| Suite completa de helpers de recuperación | 41/41; salida 0 |
| `node scripts/test-recovery.mjs` | Salida 0; flujo legacy conservado |
| `node scripts/test-recovery-postgres.mjs` | Salida 0; flujo legacy conservado |
| `node scripts/test-recovery.mjs --versioned-media` | Salida 0; 27 archivos de copia, 26 de medios, 3 versiones, 6 directorios |
| `node scripts/test-recovery-postgres.mjs --versioned-media` | Salida 0; mismo conjunto, comprobación lógica del origen en un tercer proceso |
| Casos de copia dañada o incompleta | 7 por motor rechazados antes de crear directorio/base de destino |
| `node scripts/test-integration.mjs tests/versioned-media-http.integration.test.ts` | 7/7; salida 0; 14,52 s |
| `node scripts/test-integration-postgres.mjs` | 38/38; salida 0; 60,11 s |
| `npm run lint` y `npm run typecheck` | Comandos separados, salida 0 |

La ejecución delegada conserva los comandos, fallos iniciales y salidas en el
informe local de Task 4. El controlador comprobó el alcance Git y el checkpoint;
no presenta las suites delegadas como una repetición independiente propia.

Los primeros ensayos detectaron tres errores del propio fixture: un identificador
de versión omitido al serializar, una colisión de nombre con el registro ajeno y
un estrechamiento de tipos incompleto. También se corrigió la etiqueta del contador
de versiones, que decía páginas en el modo de medios. Los resultados iniciales
fallidos no se ocultan ni cuentan como aprobados. La salida de integración HTTP
incluye los errores esperados de solicitudes denegadas y el aviso de Payload sin
adaptador de correo; no es una salida libre de avisos.

La revisión independiente comprobó también que el helper físico anterior incluye
el inventario en los hashes y conserva directorios vacíos al copiar. Solo dejó
como mejora menor capturar y comprobar los diagnósticos esperados sin ocultar
errores inesperados. Los límites de escritura y el esquema del núcleo permanecen
cubiertos por las revisiones anteriores; no se atribuyen como pruebas nuevas aquí.

## Limpieza, alcance y siguientes puertas

Los procesos de prueba cerraron y los clústeres PostgreSQL propios se detuvieron.
El implementador verificó que no quedaban sus raíces de ensayo. El código nuevo
elimina únicamente archivos sintéticos conocidos y directorios vacíos; conserva
la limpieza ya acotada de los ejecutores anteriores, sin ampliarla.

Esto prueba recuperación **offline y sintética**, no una copia atómica en vivo,
resistencia a un administrador hostil, persistencia de un proveedor ni recuperación
frente a pérdida física del ordenador. Los schemas mínimos de página y marca
prueban referencias congeladas reales; no sustituyen la cobertura del esquema
completo del ensayo legacy independiente.

Siguen abiertas medición de recursos, persistencia y permisos del alojamiento,
retención/coste, migración ensayada y activación de la biblioteca real. También
queda separada la prueba completa de procedencia del aislamiento público. El CV,
las fuentes personalizadas, la conexión editorial a la web pública y el despliegue
no forman parte de este incremento.

El checkpoint `checkpoint/pre-editor-2026-09-04` sigue apuntando a
`0f0adf686b2752e23c25d224f8c60815b10fd451`. Sin cambios en código público,
configuración activa, dependencias ni subida a Git remoto.
