# Restauración de revisiones con identidad conservada

Base67a40c8. Reserva Hub754f50c3. Codex, 10 septiembre 2026. Ampliación acotada del transporte privado existente, bajo la orden de continuar autónomamente el CMS; no implica aprobación para infraestructura o datos reales.

## Contrato implementado

`store.restore(revision, backupManifest, files)` conserva el UUID que referencia la DB. Comprueba UUID, esquema del manifiesto y snapshot privado de todos los archivos (nombres, orden, tamaños y SHA256) antes de llamar al proveedor. No reconstruye el manifiesto a partir de bytes sin una referencia de integridad. Un manifiesto coincidente **no autentica su procedencia**: el operador debe aportar una copia aprobada/confiable.

El destino debe estar vacío para esa revisión. LIST previo y PUT con IfNoneMatch protegen frente a restos existentes y colisiones de escritura; manifiesto último. Después de escribir se vuelve a leer/verificar la revisión completa antes de devolver éxito, bajo el mismo plazo de operación. No se borra, sobreescribe ni completa silenciosamente un destino parcial. Una interrupción conserva UUID y datos; se ensaya otra restauración en un namespace nuevo, sin cambiar automáticamente la configuración activa.

`write` y `read` reutilizan helpers internos sin cambiar sus contratos. `restore` no está conectado a endpoint público, colección ni acción de UI. No cambia referencias de DB, permisos, esquema o configuración de la app. No hay nuevas dependencias.

## Pruebas

SDK real y servidor HTTP local sintético, con namespace de origen y destino separados. TDD inicial: ocho fallos por método ausente; luego26/26 pasan. Casos adicionales: corrupción del proveedor tras PUT200, mutación de entradas durante IO y timeout durante verificación final.

Se comprueba conservación de UUID/bytes y origen, manifiesto último, condiciones de todos los PUT, rechazo previo a red de paquetes incompatibles, destino ocupado intacto e interrupción parcial no adoptada por reintento. El deadline incluye EOF de la lectura posterior a los PUT.

La revisión independiente pidió una carrera tras LIST vacío: el segundo PUT recibe una escritura competidora; se verifica412, conservación de ambos objetos parciales y ausencia de manifiesto/DELETE. Minor cerrado.

Otra prueba adversarial reprodujo un falso éxito: sustituir bytes y manifiesto por otros consistentes después del PUT hacía que la lectura validara solo el destino. RED observado (restore devolvía UUID). Corregido comparando nombres y bytes finales con el snapshot aprobado, no solo con el manifiesto remoto. Revisión independiente posterior confirma la corrección. Esto no impide a un administrador modificar objetos después de finalizar la comprobación.

## Límites

Recibo: suite final1031/1031,151 archivos; tipos/lint0; build final Next16.3.4,23 páginas, salida0. Integración SQLite48/48 ejecutada durante el desarrollo; el ajuste final solo afecta restore, que esa suite aún no consume, y queda cubierto por la suite unitaria final. PostgreSQL no repetido en este tramo. Boundary21 y diff público vacío, checkpoint0f0adf686b2752e23c25d224f8c60815b10fd451 intacto. Build con configuración aislada, retirando --use-system-ca solo del proceso hijo. Revisión independiente read-only sin pendientes accionables tras los dos ajustes.

Es una primitiva para recuperación, no el proceso completo de backup. Pendientes: exportación respaldada, inventario de revisiones referenciadas, restauración de DB+objetos tras reinicio en destino aislado y aceptación previa a activar. No se certifica R2 real ni se traslada dato personal. No se afirma un bloqueo global del bucket frente a administradores externos: la integridad se verifica frente al manifiesto y el destino debe estar aislado de otros escritores.

No push ni despliegue. Responsable siguiente Codex; revisión de Claude por Hub sin asumir aceptación de un mensaje enviado.
