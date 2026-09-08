# Inventario legacy: decisiones y límites

Decisiones de ejecución del incremento de inventario, 8 de septiembre de 2026.
No autorizan migración, publicación, contratación ni modificación de datos reales.

1. **Conservar la rama y la evidencia local.** Se continúa en la rama compartida
   existente, sin cambiar el checkout ni limpiar espacios de otros trabajos. Evita
   interferir con Claude y conserva el checkpoint solicitado. Coste de rectificar:
   revertir solo commits propios y conservar algo más de evidencia local.
2. **Inventariar antes de escribir una migración.** Un nombre, tamaño o hash actual
   no demuestra qué bytes existían en una versión antigua. Coste: la reconciliación
   y el ensayo de migración siguen siendo pasos posteriores; este informe no los
   sustituye ni declara terminada la biblioteca.
3. **Avanzar sin repetir preguntas dentro del alcance autorizado.** Solo servicios
   internos de lectura y pruebas sintéticas. Proveedor, gasto, datos reales y
   activación permanecen fuera de este plan. Coste de una decisión equivocada:
   retirar estas adiciones locales, sin haber migrado datos del usuario.
4. **No utilizar una petición con transacción activa.** Payload puede cancelar la
   transacción de la petición cuando una lectura falla. El colector debe rechazar
   ese contexto antes de consultar la BD o el disco. Coste: invocación separada,
   sin edición en curso, sobre un clon sin escritores; no es un snapshot transaccional.
5. **No copiar metadatos inseguros al informe.** Se rechazan identificadores con
   rutas, segmentos relativos o forma de correo; las referencias inseguras conservan
   avisos y etiquetas de evidencia, no rutas/URLs/correos originales. Coste: para
   reconciliar esos casos hace falta consultar privadamente el origen. No se ha
   construido un anonimizador ni autorizado publicar el informe.
6. **No probar el rechazo de UNC contactando con un servidor SMB.** Esos casos
   sintácticos usan una barrera de prueba que falla si se intenta acceder al disco;
   las pruebas del escáner utilizan archivos locales reales y sintéticos. Coste:
   comprueban rechazo antes de IO, no compatibilidad con sistemas de archivos de red.
7. **Reservar el patrón de etiquetas de diagnóstico.** Un archivo llamado igual
   que una etiqueta generada se representa mediante otra etiqueta, respetando
   mayúsculas/minúsculas en la comparación canónica. Coste: esos nombres literales
   poco habituales requieren reconciliación privada. No se renombra ni borra nada.
8. **Limitar también los metadatos retenidos a 8 MiB.** Procesar por páginas no
   basta si un campo conserva objetos o valores enormes. Se rechazan evidencias
   no escalares y variantes excesivas antes de acumular, además del límite final
   del informe. Coste: algunos orígenes legacy malformados o desmesurados que
   quedarían pequeños tras sanitizarlos requieren reconciliación privada previa.
   No se modifican ni se truncan datos para hacer pasar el inventario.

El [plan](legacy-media-inventory-plan-2026-09-08.md) mantiene el contrato de dos
capas: observación física acotada y colección autorizada de referencias de Payload.
Las limitaciones de alojamiento, permisos efectivos, copia externa, retención,
activación y puente público siguen en el [procedimiento de despliegue del almacenamiento](media-storage-rollout-2026-09-08.md).
