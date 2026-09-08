# Cobertura del candidato frente a un inventario fijado

Base `65c6826`. Pieza pura, separada del observador físico ya terminado. No cambia
el colector Payload ni vuelve a ejecutar los ensayos de clonación cerrados.

## Contrato implementado

`bindMigrationPlanInventory(serializedPlan, serializedInventory, expectedHash)`
en `owner-platform/src/media/migration-plan-inventory.ts` verifica:

- Candidato válido y no bloqueado, mediante el lector existente.
- Inventario JSON de hasta 8 MiB, esquema superior conocido y `migrationReady:false`.
  Canonicalización compatible con el productor: claves de objetos ordenadas,
  orden de arrays preservado. Recursión acotada, números no finitos rechazados.
- Coincidencia de la huella recomputada, el hash declarado, `sourceInventoryHash`
  del candidato y la huella independiente que aporta el llamador.
- Mismo conjunto exacto de identidades clase/documento/referencia y variantes,
  validado y ordenado mediante el constructor del candidato. No se filtran
  borradores, papelera, versiones ni capturas por su estado.
- Cada evidencia corresponde al filename de origen, al tamaño si se conoce y a
  la revisión existente si se declara. No se inventan tamaños para capturas que
  no los conservaron. Nombres ausentes o marcados como inseguros no se resuelven
  silenciosamente a un archivo nuevo.

El recibo solo tiene digest del candidato, hash de inventario y recuentos:
`status:'inventory-matched'`, **`canApply:false`**. Los errores son códigos fijos,
sin rutas, contenido editorial ni causas nativas. Sin dependencias nuevas,
filesystem, DB, endpoint, autorización operativa ni ejecución de migración.

## Qué no demuestra

`expectedHash` debe proceder de un contexto autorizado independiente, nunca del
mismo cliente que entrega el JSON. Ese orquestador aún no está conectado.
Integridad no es autenticidad: quien pudiera sustituir ambos artefactos y la
huella externa puede producir un conjunto coherente. El recibo tampoco se usa
como token de autorización.

La cobertura se demuestra **contra el artefacto fijado**, no contra una base de
datos real congelada. El colector debe seguir acreditando que consultó todo lo
necesario bajo las condiciones operativas acordadas. Este módulo no adquiere
locks ni prueba ausencia de escritores, consistencia temporal del colector,
permisos del llamador, backup restaurable o autenticidad histórica de evidencia.

Las anotaciones observacionales (`issues`, archivos observados y sus estados)
quedan incluidas en el hash; no se reinterpretan como prueba ni se validan de
nuevo todas sus relaciones semánticas. Un inventario con incidencias puede
coincidir con el candidato, sin que eso cierre dichas incidencias o habilite
el corte. La comprobación física separada sigue siendo obligatoria.

Los límites conservadores del candidato siguen aplicándose, incluidos IDs ASCII
de hasta 128 caracteres y 16 variantes. Un inventario que el productor admite
pero el candidato no puede representar se rechaza; no se recortan ni transforman
identidades de forma silenciosa.

## Evidencia de pruebas

Fixtures producidos con `inspectLegacyMediaInventory` real sobre directorios
sintéticos propios: así se contrasta compatibilidad de hashes sin copiar el
algoritmo productivo dentro de una expectativa de prueba.

TDD: **24 fallos funcionales** con scaffold explícito; después **24/24 verdes**.
Focales conjuntas candidato + bytes + inventario: **82/82**, salida0 (11:00 local).
Cobertura: cinco contextos, reordenación de claves y whitespace, omisiones de
clase/variante, referencia extra, discrepancias de nombre/tamaño/revisión,
tamaño histórico desconocido, modificación del inventario, huella antigua,
huella de otro candidato, candidato manipulado/bloqueado y JSON/pins inválidos.

Suite completa owner (sesión 62968): **962/962**, **149 archivos**, salida 0,
**102,86 s**, inicio 2026-09-08 11:01:02 local. Tipos (32625) y lint (3102):
salida 0 por separado. Frontera pública: **21 entradas**, salida 0.
Revisión independiente estática de ambos archivos, productor/servicio y validador
existentes: sin hallazgos accionables. El revisor no ejecutó pruebas ni modificó
archivos; las ejecuciones son evidencia separada del controlador. No se ejecutan
pruebas de UI, build o SQLite/PostgreSQL para esta pieza sin cambios en esas
integraciones.

## Coordinación y siguiente paso

Reserva/alcance Hub `ca2108c0-f822-4e85-a2d5-d7b08f194aff`, enviada a Claude, sin
aceptación inferida. Este despertar fue a las 08:54 UTC; no se amplía la ventana
temporal ni se crea sondeo adicional. Se mantiene el carril público de Claude.

Próximo Codex: definir cómo el orquestador obtiene y conserva la huella autorizada
con escritores detenidos y backup verificado; ensayar esa frontera antes de un
ejecutor. Corregir por separado la portabilidad de nombres Windows del almacén
existente con su regresión propia. No usar estos dos recibos como permiso para
activar la biblioteca real. Sin push/despliegue, DNS/correo, costes, datos reales
ni modificaciones públicas. Checkpoints y trabajo compartido anterior preservados.
