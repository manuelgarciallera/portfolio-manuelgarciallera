# Medios versionados: edición nativa por HTTP

Implementación: `339fb8d`, sobre `dbc37ae`; corrección `cf28533`. La revisión
inicial detectó la selección incorrecta de la imagen publicada cuando existía
un borrador más reciente. La corrección pasa sus pruebas y la revisión focal:
hallazgos resueltos, sin nueva rotura Critical/Important en el ajuste.
La biblioteca activa no utiliza todavía este binding.

## Qué se ha implementado

- Servidor de pruebas HTTP real, temporal y limitado a loopback; login owner,
  cookie real y endpoints nativos de Payload para subir, recortar, duplicar,
  restaurar, descargar y enviar a la papelera imágenes sintéticas.
- Corrección de la URL usada al duplicar: Payload ejecuta los hooks de campo,
  pero no el hook de colección que antes construía la URL de revisión.
- Conservación de originales y derivados tras el recorte. Si Payload reutiliza
  un nombre para dos tamaños, solo se deduplica cuando todos los bytes coinciden;
  los conflictos se rechazan antes de escribir una revisión.
- Origen de refetch configurado explícitamente y selección de la imagen desde
  el registro autorizado, antes de la descarga interna. No se usa el Host ni un
  Origin arbitrario como autoridad. Sin configuración, la edición nativa falla
  cerrada. Se cubren disparadores en query y focalX/focalY en el cuerpo.
- Descarga autorizada de la revisión exacta. Borradores, papelera y revisiones
  ajenas se rechazan según los permisos. Las respuestas no se cachean; Range se
  ignora devolviendo el archivo completo autorizado, sin anunciar soporte parcial.

La excepción de transporte local existe solo en la fixture y coincide con su
protocolo, host, puerto efímero y ruta de revisión. No se ha habilitado un permiso
global para descargar URLs externas.

## Verificación ejecutada por el implementador sobre 339fb8d

| Comprobación | Resultado |
| --- | --- |
| Unitarias owner | 783/783, 144 archivos; 64,05 s |
| Integración SQLite | 37/37, incluidos 6 casos HTTP; 47,94 s |
| Integración PostgreSQL 17.11 | 37/37; 50,30 s |
| HTTP focal tras cambios de tipos | 6/6 |
| Binding focal | 22/22 |
| Lint y tipos corregidos | Correctos |
| Frontera del código público | 21 entradas correctas |
| Presupuesto público existente | 10 rutas dentro de tolerancia |

Se conservaron los resultados negativos: duplicación usaba la ruta antigua;
recorte producía nombres alias; el refetch necesitaba una condición de confianza
explícita. El primer preflight PostgreSQL falló por no especificar la ruta de las
herramientas y no inició datos ni pruebas; la ejecución con esa configuración
explícita pasó. El primer typecheck detectó cuatro errores nuevos de tipado;
se corrigieron y se repitieron tipos y pruebas focales. No se ocultaron fallos
de proceso mediante reintentos. Las denegaciones esperadas de Payload y su aviso
de adaptador de correo ausente aparecen en los logs sintéticos.

PostgreSQL confirmó cierre de proceso y sesiones, parada del clúster concreto
y retirada de su raíz sintética. Los listeners HTTP se cierran en su cleanup.

## Corrección de la selección del borrador: cf28533

La revisión independiente encontró que publicar un recorte sin `draft=true`
podía tomar la imagen publicada y no el último borrador. Se reprodujo con dos
imágenes distintas: publicada roja A y borrador azul B. La petición devolvió 400.
El lookup autorizado ahora solicita la vista más reciente de Payload, sin usar
el estado propuesto por el cliente para elegir la fuente.

La regresión corregida publica el recorte de B y decodifica sus bytes con Sharp:
600 × 400 píxeles y color azul esperado, no el rojo de A. Verificación del ajuste:
HTTP SQLite **7/7**, PostgreSQL completo **38/38**, binding **22/22**, lint y tipos
correctos. No se repitieron las 783 unitarias ni el build público por este cambio
acotado. La revisión independiente focal confirma resueltos ambos hallazgos
(fuente del borrador y dimensiones decodificadas), sin nueva rotura en el ajuste.

## Qué NO acredita este incremento

- No activa la biblioteca nueva, migra archivos, publica el CV ni despliega.
- No sustituye una prueba de copia y restauración de **todas** las revisiones
  físicas junto con la base de datos. Es la siguiente puerta del
  [contrato de recuperación](versioned-media-recovery-contract-2026-09-08.md).
- No acredita capacidad de producción: faltan mediciones de concurrencia y
  memoria, persistencia y permisos efectivos del alojamiento, y retención.
- Payload conserva cookies durante redirects de su descarga interna. Nuestra
  ruta comprobada no redirige; un proxy o alojamiento que lo hiciera requiere
  una política y prueba específicas antes de activación.
- La comprobación completa de procedencia del aislamiento owner/público sigue
  abierta. Frontera y presupuesto correctos no equivalen a ese certificado.

El checkpoint público conserva como destino
`0f0adf686b2752e23c25d224f8c60815b10fd451`. Los cambios de este incremento no
modifican la configuración activa, el diseño o las dependencias públicas.
