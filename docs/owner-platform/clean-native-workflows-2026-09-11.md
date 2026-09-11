# Ensayo limpio de recorridos nativos fac73fa

## Código y procedencia

SHA `fac73fa4b1cc24351431fd45563acd629c3de3ea`, copia nueva
`/work/verification-fac73fa` creada del bundle completo f0435bf más delta
`.audit/owner-clean-fac73fa-delta.bundle`. Delta verificado be1103, requiere
f0435bf; SHA256 BD8AA9A8E82B38C01889BC1BFF8C6C948A2A5615595B925468ABCD7D086E7A42.
Git HEAD exacto y árbol limpio e6783c, sin overlays. No se modifican checkouts
previos o el árbol compartido. Dependencias Linux copiadas, lockfiles idénticos
FF25B164CF957B66A19E4A8F8FFBBAB5148B9E00A1AC40FC14B9F3598A47FB11:
no instalación nueva.

## Recuperación física

`node scripts/test-recovery-postgres.mjs --object-media --full-owner`:
71a510, salida0, applicationCommit exacto fac73fa.45 pruebas del arnés pasan.
PostgreSQL16.15, pg_dump custom/pg_restore a base distinta,18 archivos de backup,
12 medios verificados,3 revisiones,3 versiones de página y2 de artículo.
Login, historial, edición independiente de página/artículo, preview congelado,
retención, restauración del plan y copias migratorias pasan.12 daños/ausencias
rechazados antes de asignar destino. Fuente lógica y recibos sin cambios;
clúster cerrado y solo raíz sintética de esta ejecución retirada.

## Editor

`node scripts/test-production-http.mjs --browser-editor --object-media`:
7a4caa y cierre e7dfd1, salida0. Build y navegador390/1280 pasan desde esta
misma copia. Incluye error visible y ARIA, cancelación/descarte, captura/registro
de versiones por UI, restauración con preview/reinicio, páginas, marcas,
medios/encuadres, artículos y privacidad. App/clúster cerrados y raíz de ensayo
retirada. Comprobación final d2da61: árbol Git limpio, SHA exacto y solo
init/sleep en el contenedor. Checkpoint519674 conserva
`0f0adf686b2752e23c25d224f8c60815b10fd451`.

## Límites

Datos, puntuaciones y SHA registrados por el ensayo son sintéticos. No se
despliega, no hay proveedor externo, cuenta cliente o dispositivo físico.
Bundle local no es respaldo remoto ni copia de datos de producción. La copia
limpia excluye cambios compartidos sin commit, preservados en el host.
