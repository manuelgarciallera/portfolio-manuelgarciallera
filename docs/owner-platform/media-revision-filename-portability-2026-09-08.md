# Almacén de revisiones: rechazo previo de seis caracteres no portables

Base `7248bbf`. Corrección acotada del pendiente separado en los recibos de
observación física y cobertura de inventario. No modifica la migración ni el
almacenamiento activo. Archivos: `revision-store.ts` y `revision-store.test.ts`.

## Defecto y cambio

El validador admitía `<`, `>`, `"`, `|`, `?` y `*` mientras que el constructor del
plan de migración ya los rechazaba. En Windows, una revisión con un primer archivo
válido y otro con uno de esos caracteres podía crear el directorio y escribir el
primer archivo antes del fallo nativo. No basta con que la promesa se rechace:
para una entrada inválida no debe empezar la escritura.

Se añaden solo esos seis caracteres a la expresión existente de `validateFileName`.
El mismo validador se usa al copiar/validar toda la entrada antes de `mkdir` y al
leer las entradas del manifiesto antes de buscar los binarios. No se añaden
dependencias, escrituras de reparación, renombrados ni limpieza automática.

Compatibilidad: revisiones antiguas creadas en POSIX con esos caracteres serán
rechazadas por este lector. Sus bytes no se eliminan ni se transforman. Antes de
activar o migrar una biblioteca real se debe inventariar esa condición y decidir
una reparación explícita; no se afirma haber inspeccionado datos reales aquí.
Esto no certifica por sí solo compatibilidad con todos los sistemas de archivos.

## Pruebas y revisión

- TDD en Windows: 12 regresiones fallaron con el código anterior, 39 existentes
  pasaron. Seis fallos muestran directorios parcialmente creados; seis muestran
  validación de manifiesto tardía, con diagnóstico de entradas ausentes/extra en
  vez del rechazo por nombre inseguro.
- Tras el cambio: **133/133** focales (almacén y tres módulos de candidato), salida0.
  Los casos de escritura sitúan primero un archivo válido para detectar efectos
  parciales. Los de lectura comprueban que no se alteran bytes ni manifiesto.
- Typecheck separado (74089) y lint (93358), salida0. Suite completa (21477):
  **974/974**, **149 archivos**, salida0, **92,46s**, inicio 11:27:13 local.
  Frontera pública (52039): **21 entradas**, salida0; diff de código sin errores
  de whitespace. No se ha realizado nuevo build ni barrido visual.
- Revisión independiente estática de ambos diffs: sin Critical/Important/Minor.
  El revisor no ejecutó pruebas ni modificó el checkout; confirmó el efecto de
  compatibilidad POSIX y el alcance mínimo del cambio.

No se repite el ensayo de migración SQLite/PostgreSQL ya cerrado ni se presenta
como nuevo. Las carpetas sintéticas se limpian por la utilidad de prueba existente;
no se ha tocado biblioteca de usuario ni añadido un mecanismo de borrado.

## Coordinación y continuación

Reserva Hub `0bb3a410-c38b-46fa-b8f0-9b27923cf7ce`, enviada a Claude, sin inferir
recepción/aceptación. Despertar 09:24UTC; fin original15:45UTC sin ampliación.
Carriles públicos de Claude y archivos compartidos previos preservados.

Próximo Codex: contrato operativo para escritores detenidos y obtención autorizada
de la huella del inventario con backup verificado. Las comprobaciones de candidato,
cobertura y bytes siguen sin autorizar ejecución. Sin push/despliegue, DNS/correo,
costes, datos reales ni activación del almacén en este incremento.
