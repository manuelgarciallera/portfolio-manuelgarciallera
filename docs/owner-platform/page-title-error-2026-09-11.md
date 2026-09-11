# Error accesible del título de página

Base00349d5, reserva66816f34. RED0a1af7: a390 el error obligatorio es
visible, pero aria-invalid es null. Se reproduce con dos bloques ya escritos
y título vacío, sin simular la validación ni escribir por API.

FieldErrorBinding admite ahora textarea o input text y se monta en Pages.title.
El adaptador sigue limitado al campo, no toca handlers, validación o datos.
ImportMap existente ya contiene este componente; no nueva dependencia.
Prueba exige estado inválido, referencia al mensaje nativo, retirada de ambos
al corregir sin navegar y conservación de los dos encabezados de bloques.
La regresión del resumen de artículo sigue en el recorrido completo.

Revisión read-only sin bloqueadores. GREEN completo6183fe/cierre2f0d8e,
salida0 a390/1280, conserva además resto de flujos y datos tras reinicio.
Tiposf6147c, lint876319,14 guardas9b8135 y21 entradas públicas6d3029 pasan.
Unitarias7a0956:1299 pasan y2 omitidas/170 archivos; activos locales pasan.
Contenedor verification-fac73fa ahora tiene overlays; su anterior
recibo limpio continúa siendo histórico y no se atribuye a estos nuevos cambios.
No cambios públicos ni despliegue. No se extrapola a todos los campos o a
lectores de pantalla físicos. Reversión mediante commit propio, sin migración
de datos. Próximo responsable Codex: continuar puertas pendientes.
