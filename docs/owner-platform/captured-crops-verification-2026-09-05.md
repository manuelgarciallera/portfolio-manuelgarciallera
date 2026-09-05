# Encuadres históricos en capturas y asistencia

## Cambio implementado

Las nuevas capturas guardan `mediaPlacements`: identificador, revisión
`current:updatedAt` y receta normalizada de cada encuadre referenciado por los
bloques de imagen de la página. Incluye recurso, posición focal, zoom, ajuste,
proporción y variaciones móvil/tablet. No copia nombres, tokens ni otros campos
del documento de encuadre.

Cada referencia se lee una vez por captura, aunque aparezca en varios bloques,
con sesión owner, `overrideAccess: false`, `draft: true` y `depth: 0`. Una
referencia denegada, de otra imagen, con identidad/revisión incorrecta o receta
inválida impide persistir la captura. No se busca ni exporta la biblioteca entera.

El hash incluye las recetas: cambiar solo el encuadre crea una captura diferente,
aunque el documento de página no haya cambiado. Los valores se guardan explícitos
y normalizados, sin depender de valores por defecto inferidos durante la revisión.

## Compatibilidad

- Campo opcional aditivo en el manifiesto de esquema 1. No hay migración SQL ni
  reescritura de capturas antiguas; la ausencia sigue significando «no capturado».
- Una lista vacía en una captura nueva indica que no había recetas referenciadas.
- Se rechazan IDs duplicados, revisiones ausentes, campos adicionales y recetas
  no normalizadas. Se valida también el JSON almacenado, no solo su checksum.
- El contexto del asistente exporta las recetas congeladas y la comparación usa
  sus valores históricos. No consulta el encuadre vivo para inventar la base.
- Las rutas permitidas de propuestas no se amplían: se conserva la edición de
  valores base ya prevista; exportar los overrides no habilita su modificación.
- El validador local de Linocube conserva el campo opcional al reconstruir el
  hash, sin admitir otras propiedades. El consumidor continúa desactivado.

## Evidencia de regresión

TDD reprodujo 13 fallos iniciales por recetas ausentes y referencias no
comprobadas, más cinco casos de identidad/datos ambiguos. Tras corregirlos,
80 pruebas focalizadas pasaron. Un test adicional con checksum calculado
independientemente detecta un zoom inválido en JSON almacenado: se comprobó
que falla al retirar la validación de lectura y pasa al restaurarla.

La integración usa una imagen PNG sintética, Payload y SQLite reales. Guarda
zoom 2 con variaciones móvil/tablet, captura, cambia solo el encuadre a zoom 3 y
vuelve a capturar. Las revisiones de página coinciden y los hashes difieren.
El contexto y la comparación de una propuesta posterior conservan zoom 2; el
encuadre actual y la captura histórica no cambian al crear/revisar la propuesta.

## Límites que permanecen

Estas lecturas no certifican una instantánea transaccional entre documentos.
Antes de aplicar propuestas habrá que contrastar las revisiones/hashes de página,
marca y encuadres, registrar una copia recuperable y aplicar con control de
concurrencia. La restauración actual de una página no equivale a restaurar
automáticamente documentos compartidos de encuadres; esa escritura necesitará
su propio alcance y rollback. Aceptar una propuesta todavía no la aplica.

No se ha conectado IA, activado Linocube ni desplegado. No hay cambios en el
portfolio público ni dependencias nuevas. La captura no añade una nueva vista
responsive ni cambia la apariencia del editor: conserva los datos necesarios
para una comparación fiel.

## Verificación final

Ejecutada el 5 de septiembre de 2026 con el código final:

- `npm --prefix owner-platform run check`: salida 0; **687 unitarias en 141
  archivos, 20 integraciones SQLite, lint, TypeScript y build**. Vitest usó dos
  workers de forma temporal; se restauró la variable previa al terminar.
- `npx vitest run --config vitest.unit.config.ts`: **207 pruebas**, salida 0.
- `npm run check:public-boundary`: **20 entradas**, salida 0.
- `npm run test:owner-isolation`: **8 pruebas**, salida 0; el error Git del
  checkpoint inexistente es una entrada negativa deliberada del test.
- `npm run test:public-guards`: **11 pruebas**, salida 0.
- Revisión independiente sin incidencias. Se corrigió además el error de
  inferencia TypeScript de la lista de campos opcionales antes del check final.

El checkpoint conserva el commit `0f0adf686b2752e23c25d224f8c60815b10fd451`.
Permanece el aviso de adaptador de correo ausente. No se ha repetido en este
incremento la auditoría npm, la matriz visual completa o las métricas de campo;
SQLite no certifica PostgreSQL de producción.
