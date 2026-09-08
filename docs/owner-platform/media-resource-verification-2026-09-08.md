# Recursos HTTP de revisiones: experimento local aislado

**Puerta de medición local superada; preparación de producción no acreditada.**
Ejecución inicial del código entregado en `5035ce8` el 2026-09-08, 00:41:08.549–00:41:54.513 UTC
(02:41 Europe/Madrid), salida 0. Base de aplicación
`cd7ce32bbf0e51351682136f3f2e1a92199a283f`; recuperación/fixture revisados en
`73a52f6`. Los hashes de los scripts nuevos ejecutados figuran al final para
identificar el incremento todavía sin commit durante la medición.

La revisión independiente posterior encontró un fallo en la limpieza cuando la
inicialización del fixture rechaza sin devolver un handle y tampoco acredita su
cierre interno. Esa vía no ocurrió en esta medición satisfactoria. La corrección
y la nueva ejecución se documentan al final; los resultados iniciales que siguen
se conservan como evidencia histórica, no se sustituyen por los nuevos.

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

## Corrección de revisión y nueva medición del código final

La revisión independiente detectó una incidencia Important en el fallo de inicio,
no en las descargas satisfactorias anteriores: si la inicialización del fixture
rechazaba sin devolver un handle y su cierre interno también fallaba, la variable
de cierre seguía siendo `true` y podía autorizar limpieza con recursos aún abiertos.
Se extrajo la misma puerta de limpieza del script a
`createMeasurementFixtureLifecycle`, sin otro archivo/runner/fixture. Marca cierre
incierto **antes** de invocar la inicialización; solo un `close()` resuelto después
de un intento de inicio permite limpiar. Si falta el handle tras un rechazo, conserva
el árbol y registra el fallo. Un fallo anterior a intentar iniciar sí puede limpiar
archivos sintéticos conocidos. Importar el script desde tests no ejecuta el benchmark;
el comando CLI permanece operativo.

Regresión: `node --test tests/media/resource-measurements.test.mjs`, RED 14/16
(salida 1, 614.1482 ms), con `Missing expected rejection` al autorizar limpieza en
inicio rechazado o pendiente. GREEN 16/16 (salida 0, 820.4746 ms). Las cinco pruebas
nuevas usan el mismo control que envuelve el bloque de borrado real y observan
cero mutaciones de su callback de limpieza cuando inicio/cierre es incierto,
además de permitir limpieza tras cierre confirmado o antes de cualquier inicio.
No son asertos sobre texto fuente. Lint y tipos: salidas 0 por separado. La
revisión focal posterior corresponde al controlador. Las observaciones menores
sobre cuerpo HTTP estancado y diagnóstico esperado quedan fuera de esta corrección.

Se ejecutó una vez `node scripts/test-media-resources.mjs` después de esta
corrección y de terminar lint/tipos: **salida 0**, 2026-09-08T00:58:00.071Z a
2026-09-08T00:58:46.471Z, sin pruebas pesadas concurrentes.
Base Git `7bfabfa3719815b54827fb76b6ebda08b7f19d54`: incluye el commit de registro de
decisión del controlador `7bfabfa`, ajeno a esta corrección. SHA-256 del orquestador
ejecutado: `53392830bff007d9076cd12ab378366727cd9f46113d0b450600c1bc57c7fbdd`.
Los hashes del seed, cliente y validador coinciden con los de la primera medición.
Node/OS/arquitectura/SQLite y memoria total permanecen como arriba; memoria disponible
reportada esta vez **7147679744 B**. Los umbrales 4 GiB
disponibles, 2 GiB RSS, intervalos y plazos no cambian. Siembra: 20823.9108 ms;
el worker cerró antes de abrir el servidor de medición.

JPEG: documento `1`, revisión `f2d2a5aa-86f4-4e53-9c11-a3dd0c54af66`; conserva exactamente
tamaños, dimensiones y hashes de la primera receta, y su limitación de contenido
muy compresible. PNG: documento `2`, revisión `07ba7433-f54a-4b2a-8855-b14ea6863cd5`.
Receta aleatoria igual, nuevas identidades y hashes; agregado **62149485 B
(92.6099494 % de 64 MiB)**, sin ajuste.

| PNG / variante | Dimensiones | Bytes | SHA-256 independiente |
| --- | --- | ---: | --- |
| original | 6000×3200 | 57705260 | `0b3caf84e44a227289df6c6cb76f457da934a7a44e608185e2eabe66ef821063` |
| small | 480×256 | 218508 | `0e9aa3b04530f89b7e3c58d05ebe1c3b487b86188ca447047213122dbe965c7c` |
| medium | 960×512 | 1019571 | `44695b1928766b57c52d7ef2f424f14abe6b06c575d4db7e82e8aed5003eca11` |
| large | 1600×853 | 3206146 | `4877916ae3a044c0c736c72f2273564463cd19e7140c0848745fa949dd50989c` |

**51/51** respuestas completas verificadas (200, longitud y hash), cero fallos
o reintentos, 431 muestras y 985033737 B recibidos. Todas las fases:

| Recurso / fase (peticiones × máximo en vuelo) | Muestras | Bytes recibidos | Grupo ms | Latencia min / mediana / max ms |
| --- | ---: | ---: | ---: | --- |
| JPEG original / warm-up (1×1) | 10 | 19393 | 306.294 | 109.281 / 109.281 / 109.281 |
| JPEG original / serie (8×1) | 19 | 155144 | 509.958 | 29.097 / 31.746 / 106.613 |
| JPEG original / concurrente (8×4) | 15 | 155144 | 416.869 | 56.877 / 65.270 / 109.365 |
| PNG original / warm-up (1×1) | 30 | 57705260 | 1134.171 | 931.626 / 931.626 / 931.626 |
| PNG original / serie (8×1) | 176 | 461642080 | 7039.672 | 660.943 / 744.334 / 1525.122 |
| PNG original / concurrente (8×4) | 112 | 461642080 | 5286.796 | 1916.356 / 2422.655 / 2595.385 |
| PNG small / warm-up (1×1) | 12 | 218508 | 458.467 | 284.678 / 284.678 / 284.678 |
| PNG small / serie (8×1) | 34 | 1748064 | 1971.651 | 197.584 / 205.626 / 340.387 |
| PNG small / concurrente (8×4) | 23 | 1748064 | 1645.644 | 690.034 / 730.551 / 773.224 |

Memoria de cada grupo, en bytes, inicio / pico observado / final:

| Recurso / fase | rss inicio / pico / final B | heapUsed inicio / pico / final B |
| --- | --- | --- |
| JPEG original / warm-up | 290123776 / 290123776 / 234110976 | 141698240 / 141698240 / 36041784 |
| JPEG original / serie | 234131456 / 235700224 / 235700224 | 36107680 / 42786608 / 42786608 |
| JPEG original / concurrente | 235700224 / 238018560 / 238018560 | 42850504 / 48802112 / 48802112 |
| PNG original / warm-up | 238018560 / 530399232 / 528171008 | 48875528 / 49670800 / 36085912 |
| PNG original / serie | 528216064 / 821137408 / 527659008 | 36179704 / 36907992 / 34239504 |
| PNG original / concurrente | 527892480 / 736186368 / 408031232 | 34509320 / 34854592 / 34339296 |
| PNG small / warm-up | 408223744 / 471535616 / 298418176 | 34625344 / 34752288 / 34379080 |
| PNG small / serie | 298426368 / 361254912 / 297885696 | 34683064 / 35327896 / 34444560 |
| PNG small / concurrente | 298209280 / 663433216 / 487301120 | 34764168 / 35227128 / 34636056 |

| Recurso / fase | external inicio / pico / final B | arrayBuffers inicio / pico / final B |
| --- | --- | --- |
| JPEG original / warm-up | 5593266 / 5593306 / 4427005 | 1395128 / 1395128 / 229339 |
| JPEG original / serie | 4436492 / 5382758 / 5382758 | 238826 / 1185092 / 1185092 |
| JPEG original / concurrente | 5399993 / 6345158 / 6345158 | 1202327 / 2147492 / 2147492 |
| PNG original / warm-up | 6369347 / 299347659 / 297275253 | 2171681 / 295149993 / 293081340 |
| PNG original / serie | 297306808 / 590247352 / 297271141 | 293112895 / 586059282 / 293083071 |
| PNG original / concurrente | 297340547 / 528104112 / 177416367 | 293152477 / 479549107 / 173228297 |
| PNG small / warm-up | 177511245 / 240444898 / 240444898 | 173323175 / 236256479 / 63133276 |
| PNG small / serie | 67420203 / 130359537 / 130359537 | 63232133 / 126169431 / 63134996 |
| PNG small / concurrente | 67432670 / 487227648 / 256396293 | 63244600 / 404050090 / 252208223 |

Pico RSS observado **821137408 B (783.098 MiB)**, dentro del
presupuesto local. Se conservan las mismas limitaciones de caché, GC, muestreo,
buffers de revisión completa y copias del transporte de fixture. Las diferencias
entre las dos ejecuciones no constituyen una comparación controlada ni validan
una mejora de recursos; el cambio resuelve exclusivamente la puerta de limpieza
ante inicio incierto. Ninguna ejecución acredita alojamiento preparado.

El diagnóstico real volvió a incluir `[02:58:26] WARN: No email adapter provided.
Email will be written to console.`; no se añadió filtro ni se envió correo.
Clientes y fixture cerrados, ocho archivos de revisión verificados sin cambios
tras descarga. Limpieza no recursiva: **13 archivos sintéticos y 4 directorios
vacíos**. Se conserva solo `result.json` (118053 B) en
`owner-platform/node_modules/.cache/owner-media-resources-g5LlnS/result.json`.
El recibo inicial `owner-media-resources-tYNy7G/result.json` permanece intacto;
ningún dato histórico se sobrescribió. La raíz real, backups y biblioteca activa
no se tocaron. No hubo migración, proveedor, publicación ni despliegue.

SHA-256 del recibo original:
`24e30026c69a97db5bc94e437d4e070b00ae616cfa99a1f527847bbf89798788`.
SHA-256 del nuevo recibo:
`35bc5b7bb2f50a6b3a3545e83f4e956d27d49911126af9475ed81d2ddcc0b5d5`.

## Revisión cerrada del alcance medido

Implementación `5035ce8`, corrección `d704ee6`. La revisión independiente detectó
que un inicio fallido podía permitir limpieza antes de confirmar el cierre. La
corrección marca el estado incierto antes de iniciar y conserva los archivos si
no obtiene una confirmación real. Regresión RED 14/16 a GREEN 16/16; lint y tipos
salida 0. La revisión focal posterior confirma el hallazgo resuelto y ninguna
rotura Critical/Important introducida. Los 51 resultados del ensayo corregido
no sustituyen esa comprobación del camino de fallo.

El controlador contrastó directamente el recibo final, sus cuatro hashes de
ejecutables, los nueve grupos y las 51 respuestas completas con status 200 y
hash coincidente. Confirmó cierre de clientes/servidor, archivos sin cambios y
que solo queda `result.json` tras la limpieza. No repitió el benchmark.

Mejoras menores diferidas: ensayo de respuesta detenida hasta vencer el plazo
de EOF y captura explícita del aviso esperado de correo, sin ocultar diagnósticos
inesperados. No bloquean este experimento local. La revisión conjunta del
incremento completo `cd33df0..d704ee6` terminó después sin hallazgos Critical/Important;
véase la [entrega completa y sus límites](media-increment-handoff-2026-09-08.md).
