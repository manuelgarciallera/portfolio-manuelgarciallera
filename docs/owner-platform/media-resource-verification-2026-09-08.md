# Recursos HTTP de revisiones: experimento local aislado

**Puerta de medición local superada; preparación de producción no acreditada.**
Ejecución única del código final el 2026-09-08, 00:41:08.549–00:41:54.513 UTC
(02:41 Europe/Madrid), salida 0. Base de aplicación
`cd7ce32bbf0e51351682136f3f2e1a92199a283f`; recuperación/fixture revisados en
`73a52f6`. Los hashes de los scripts nuevos ejecutados figuran al final para
identificar el incremento todavía sin commit durante la medición.

## Método, límites y entorno

Desde `owner-platform`: `node scripts/test-media-resources.mjs`.
Se reutilizan `startMediaHTTPFixture(settings)`, `runWorker` y `workersClosed`,
sin otro transporte ni gestor de procesos. esbuild ya instalado genera los
bundles en una raíz nueva ignorada. No cambian núcleo, binding, fixtures,
dependencias, configuración activa ni bundle público.

La siembra utiliza creación real Payload con usuario owner autenticado por login
real y `overrideAccess:false`; los dos registros sintéticos están publicados.
Se suben por Local API, no aumentando el límite HTTP de 8 MiB. El worker de siembra
cierra realmente antes de importar/abrir una instancia SQLite nueva en el proceso
que mide RSS. Siembra: 20050.108 ms. Las imágenes y buffers de Sharp del worker
quedan fuera de las muestras de servidor.

| Entorno / límite predeclarado | Valor |
| --- | --- |
| Node / OS / arquitectura | v24.13.0 / Windows_NT 10.0.22631 / x64 |
| SQLite | 3.45.1 |
| Memoria total reportada | 34228686848 B |
| Memoria disponible reportada al iniciar | 7174475776 B |
| Mínimo disponible requerido | 4294967296 B (4 GiB) |
| Parada de diagnóstico RSS absoluto | 2147483648 B (2 GiB) |
| Muestras | Cada 25 ms más inicio/final de cada grupo |
| Plazo de respuesta | AbortSignal de 15000 ms, incluida lectura hasta EOF |
| Plazo del proceso cliente/seed | 120000 ms mediante el runner existente |

Para cada recurso: una petición **warm-up**, ocho en serie y ocho en lotes con
máximo cuatro en vuelo. Cada grupo usa un cliente hijo separado, sin cookies ni
secretos; se espera su cierre real. Solo acepta el origen HTTP exacto con puerto
en `127.0.0.1`, ruta de revisión relativa y ninguna redirección. Consume/hash cada
respuesta por chunks hasta EOF; verifica 200, longitud exacta y SHA-256. Fallos
y respuestas parciales se conservan, no se reintentan. Ante presupuesto observado
excedido no se programan más grupos; ante fracaso se guarda resultado fallido y
se cierra cliente/servidor antes de cualquier limpieza.

No hubo build ni pruebas pesadas concurrentes. RSS incluye el orquestador y el
servidor de fixture, su runtime Payload y sus recibos/muestras; excluye RSS del
cliente y de la generación de imágenes. Los tiempos de grupo incluyen arranque,
IPC y cierre del hijo; las latencias por respuesta miden fetch hasta EOF en el
cliente. Caché de archivos del OS y GC no controlados; no se forzó GC. Los grupos
comparten proceso de servidor: la memoria de partida puede incluir asignaciones
anteriores. El intervalo es un objetivo del temporizador; trabajo síncrono puede
retrasarlo y perder picos cortos.

## Datos sintéticos y recibos independientes

JPEG «ordinary»: RGB constante `#50789a`, calidad 85, 2400×1350. Representa unas
dimensiones habituales, **no** la distribución de tamaños/texturas de una foto
real: su compresión es especialmente alta. PNG de alta entropía: 6000×3200 RGB
mediante `crypto.randomBytes` y Sharp PNG por defecto; aleatoriedad no sembrada,
por lo que otra ejecución dará hashes y tamaños distintos. No hubo red ni activos
reales. Se leen/hash los archivos físicos independientemente del manifiesto;
originales se contrastan además con el hash de los bytes generados, y todos los
tamaños/dimensiones con los metadatos devueltos por Payload.

| Conjunto / variante | Dimensiones | Bytes |
| --- | --- | ---: |
| JPEG / original | 2400×1350 | 19393 |
| JPEG / small | 480×270 | 1033 |
| JPEG / medium | 960×540 | 3328 |
| JPEG / large | 1600×900 | 8818 |
| **JPEG agregado** | Original + 3 derivados | **32572** |
| PNG / original | 6000×3200 | 57705260 |
| PNG / small | 480×256 | 218502 |
| PNG / medium | 960×512 | 1019528 |
| PNG / large | 1600×853 | 3205690 |
| **PNG agregado** | Original + 3 derivados | **62148980** |

PNG: **92.6091969 %** de 67108864 B (64 MiB), dentro de 90–100 % desde la primera
receta. No se ajustó receta, cap ni presupuesto tras ver los resultados. Los
agregados corresponden a los bytes que limita el núcleo, excluyendo manifiesto
y BD; esos metadatos cuentan adicionalmente para capacidad de disco real.

JPEG: documento `1`, revisión `c97056aa-0f4d-4686-b318-b777570fe14a`.
PNG: documento `2`, revisión `ba3e1d4a-e41e-49f4-915e-e4c793b321ac`.
Ruta física dentro de la raíz sintética: `revisions/<revision>/<filename>`;
entrega `/api/media/revision/<documentId>/<revision>/<filename>`.

| Archivo | SHA-256 físico independiente |
| --- | --- |
| ordinary.jpg | `07a4c44d8e09b11468892e868c14645a9aba3c2f769a467df0c16095e4175177` |
| ordinary-480x270.jpg | `56e5ce5d77b6adc46fac17cc92671c6b3fb695bc57609d58b608b2ff53d6ca95` |
| ordinary-960x540.jpg | `4ed3c49bacad0c532fd0b667a6520adbb96ad7cc940b83e5ae50f3630eaac20f` |
| ordinary-1600x900.jpg | `8fdf545bc278ae8755b7fcc7019e2ee22e8b07e34714962f2fe0c61e7d16eabd` |
| near-limit.png | `8727d23aa0da1c8bc435b0e6e0e72493a56300c32503962a039f49e9c4472470` |
| near-limit-480x256.png | `2ce6502f8b1400f7fc94f19cb10eeb4225bab0eb934c4598e860670ef0d091d0` |
| near-limit-960x512.png | `0e10d2a053d93bbdd33e80c4e8308a81d33ff1d447f9a8f27d2fb04755e1a6f2` |
| near-limit-1600x853.png | `7487b0fb37a94e79ed88154cd6047fe52b513d59bb5302ac74ad6ef73bfd12cf` |

## Resultados de todos los grupos

51/51 respuestas completas, 200, bytes y SHA-256 correctos, cero fallos o reintentos.
Las tres warm-up se muestran separadas de las 48 peticiones restantes. Latencias
en ms redondeadas a tres decimales; no se inventan percentiles con ocho respuestas.

| Recurso / fase (peticiones × máximo en vuelo) | Muestras | Bytes recibidos | Grupo ms | Latencia min / mediana / max ms |
| --- | ---: | ---: | ---: | --- |
| JPEG original / warm-up (1×1) | 9 | 19393 | 260.191 | 93.799 / 93.799 / 93.799 |
| JPEG original / serie (8×1) | 17 | 155144 | 469.206 | 24.595 / 30.517 / 80.654 |
| JPEG original / concurrente (8×4) | 13 | 155144 | 383.820 | 53.176 / 58.366 / 99.767 |
| PNG original / warm-up (1×1) | 36 | 57705260 | 1302.324 | 1141.023 / 1141.023 / 1141.023 |
| PNG original / serie (8×1) | 194 | 461642080 | 7405.228 | 691.129 / 930.477 / 1191.327 |
| PNG original / concurrente (8×4) | 120 | 461642080 | 5679.760 | 2362.718 / 2686.024 / 2767.187 |
| PNG small / warm-up (1×1) | 11 | 218502 | 442.558 | 277.904 / 277.904 / 277.904 |
| PNG small / serie (8×1) | 32 | 1748016 | 1909.734 | 201.741 / 213.634 / 273.984 |
| PNG small / concurrente (8×4) | 23 | 1748016 | 1705.061 | 745.400 / 762.616 / 777.351 |

Memoria en bytes, **inicio / pico observado / final** de cada grupo. Los picos
de cada campo se calculan independientemente; no se presume simultaneidad.

| Recurso / fase | RSS inicio / pico / final | HeapUsed inicio / pico / final |
| --- | --- | --- |
| JPEG / warm-up | 234061824 / 234385408 / 234385408 | 35826560 / 37129488 / 37129488 |
| JPEG / serie | 234405888 / 235704320 / 235704320 | 37134456 / 43788016 / 43788016 |
| JPEG / concurrente | 235704320 / 237273088 / 237273088 | 43849584 / 49810504 / 49810504 |
| PNG original / warm-up | 237273088 / 530505728 / 528207872 | 49881008 / 50668368 / 36077520 |
| PNG original / serie | 528257024 / 820895744 / 527278080 | 36174512 / 36989392 / 34255368 |
| PNG original / concurrente | 527486976 / 689164288 / 407695360 | 34517528 / 35181472 / 34349936 |
| PNG small / warm-up | 407904256 / 471154688 / 298029056 | 34635176 / 34767760 / 34383296 |
| PNG small / serie | 298041344 / 360820736 / 297525248 | 34691904 / 35239712 / 34430416 |
| PNG small / concurrente | 297865216 / 673923072 / 486961152 | 34776320 / 36611160 / 34621632 |

| Recurso / fase | External inicio / pico / final | ArrayBuffers inicio / pico / final |
| --- | --- | --- |
| JPEG / warm-up | 4330457 / 4448755 / 4448755 | 132319 / 250577 / 250577 |
| JPEG / serie | 4458032 / 5403229 / 5403229 | 259854 / 1205051 / 1205051 |
| JPEG / concurrente | 5419862 / 6366086 / 6366086 | 1221684 / 2167908 / 2167908 |
| PNG original / warm-up | 6389300 / 299367107 / 297274743 | 2191122 / 295168929 / 293080830 |
| PNG original / serie | 297306462 / 590284269 / 297269579 | 293112549 / 586058272 / 293081509 |
| PNG original / concurrente | 297342513 / 528103607 / 177417423 | 293154443 / 523915537 / 173229353 |
| PNG small / warm-up | 177517422 / 240444020 / 67320817 | 173329352 / 236255950 / 63132747 |
| PNG small / serie | 67424600 / 130356410 / 67322533 | 63236530 / 126168340 / 63134463 |
| PNG small / concurrente | 67436667 / 487227792 / 256392048 | 63248597 / 404050090 / 252203978 |

El máximo RSS observado es **820895744 B (782.867 MiB)**, inferior al presupuesto
local de 2 GiB. No significa que un hosting de 1 GiB sea suficiente, ni que cuatro
descargas usen menos memoria que una: GC, orden de grupos y muestreo hacen que el
pico serial observado supere al concurrente en esta ejecución. No se calculan
extrapolaciones de capacidad/SLA a partir de ello.

`readMediaRevision` conserva buffers de **toda** la revisión incluso para small
(218502 B servidos desde una revisión de 62148980 B). El endpoint crea un
`Uint8Array` adicional; el fixture materializa la respuesta con `arrayBuffer()`
y `Buffer.from()`. Esas copias permanecen sin optimización y forman parte de los
datos. No equivalen al transporte Next.js desplegado. Esto no es medición de
navegador, Core Web Vitals ni comparación con el checkpoint público.

## Verificación, limpieza y evidencia retenida

`node --test tests/media/resource-measurements.test.mjs`: 11/11, salida 0;
validador inicialmente 0/7 RED, después 7/7 GREEN; cliente inicialmente 7/11 RED,
después 11/11 GREEN. Expectativas literales para resumen y hash conocido `abc`;
tests HTTP reales para EOF, concurrencia cuatro, cookies ausentes, rechazo de
origen/ruta/límites, estados/contenido fallidos y redirección no seguida.
`npm run lint` y `npm run typecheck`: salida 0 antes del experimento. No se repiten
las suites de integración/recuperación ya revisadas como nuevos resultados.

Se conserva el diagnóstico real del fixture: `WARN: No email adapter provided.
Email will be written to console.` No se envió correo. El runner revisado captura
los diagnósticos de workers según su contrato existente; no se introdujo filtrado
global que oculte errores nuevos.

Tras cierre efectivo de todos los clientes y del fixture, se verificaron otra vez
longitudes/hashes de los ocho archivos de revisión: sin cambios por las descargas.
La limpieza inventarió primero todo el árbol, rechazando entradas desconocidas,
enlaces y archivos no regulares; después eliminó **13 archivos sintéticos conocidos
y 4 directorios vacíos**, mediante unlink/rmdir no recursivos. Solo se conserva
`result.json` (122558 B), con las muestras crudas, recibos y resumen, en
`owner-platform/node_modules/.cache/owner-media-resources-tYNy7G/result.json`.
Es evidencia local ignorada, no un respaldo duradero; estas tablas y recibos
versionados conservan los resultados necesarios si se pierde la caché. Los bytes
sintéticos se eliminaron deliberadamente y pueden regenerarse con la receta,
aunque el PNG aleatorio tendrá otro hash.

Código fuente de aplicación, fixtures compartidos, manifests/dependencias y
configuración activa: diff vacío frente a `cd7ce32`. No se abrió ni modificó la
biblioteca real ni sus backups/source de recuperación: todas las escrituras y
eliminaciones del experimento quedaron en su nueva raíz sintética. La BD sintética
se reabre y autentica; no se afirma que esa BD permanezca idéntica byte a byte.

Hashes SHA-256 del código ejecutado:

| Archivo relativo a owner-platform | SHA-256 |
| --- | --- |
| scripts/test-media-resources.mjs | `8a4e317b3b1433b0fdaf707892be0d835197f958df3f8f9e2cfb28969cd4e68d` |
| tests/media/resource-seed-worker.mjs | `0a4c66a8c231775f697cec32102dda5d33832835d84bd123989513d415866527` |
| tests/media/resource-client.mjs | `e1492f44626f9b85f35a569f28d2216c0596566c8e7dae7156446976f10af349` |
| tests/media/resource-measurements.mjs | `1d22eb5de87d96788c23eb7b57537559b895ffca9459616c44b69a59fcd7caeb` |

## Lo que sigue abierto

La puerta mide tres recursos sintéticos publicados con estas cantidades exactas;
autenticación/seguridad se sustentan en Task 3/4, no se infieren del benchmark.
Siguen pendientes alojamiento persistente, permisos de OS, backup externo,
costes/cuotas, migraciones, procedencia completa del aislamiento, activación del
binding y puente al contenido público. PDF/CV y fuentes son posteriores.
El [procedimiento de rollout](media-storage-rollout-2026-09-08.md) prepara mapeo,
validación y rollback conjunto, sin ejecutar migración ni seleccionar proveedor.
Revisión independiente de Task 5 corresponde al controlador antes de cerrar
este alcance; no atribuir esa aceptación a esta autoevaluación.
