# Título histórico en capturas y asistencia

## Alcance

Las nuevas capturas editoriales guardan `pageTitle` como texto opcional dentro
del manifiesto inmutable. El título participa en el hash y respeta los límites
de tamaño JSON existentes. Se rechazan títulos que no sean texto tanto al crear
el manifiesto como al comprobar JSON almacenado, incluso con checksum válido.

El contexto del asistente incluye el título capturado y ofrece `/page/title`
como destino de texto cuando `suggestCopy` está activo. La regla exportada limita
el texto propuesto a 4.000 caracteres. Los permisos delimitan acciones, no son
filtros de confidencialidad del contexto: sigue siendo un paquete editorial
owner, marcado como datos no fiables, con aplicación/publicación/despliegue
desactivados. No se ha conectado ningún modelo ni enviado contenido a terceros.

La validación de propuestas y su comparación usan el título de la captura, no
el del borrador actual. Una edición posterior no modifica la base histórica.

## Compatibilidad y límites

- Campo aditivo opcional en el esquema 1; no requiere migración SQL ni reescritura
  de capturas. Las capturas antiguas sin título conservan sus hashes.
- En capturas antiguas el título no se exporta como destino y la comparación
  conserva «No guardado en esta versión». No se inventa un valor vacío ni actual.
- El contrato local de Linocube admite el campo opcional y lo conserva al
  reconstruir el hash. Continúa rechazando propiedades desconocidas y títulos
  alterados o no textuales. El consumidor sigue desactivado.
- La revisión de una propuesta antigua no certifica que se pueda aplicar al
  estado actual. Faltan la base de encuadres, comprobación de concurrencia y
  aplicación reversible autorizada al borrador.
- No cambia la web pública, sus dependencias, su diseño ni el checkpoint.

## Pruebas de regresión

TDD reprodujo siete fallos por título ausente antes de implementar la captura y
su consumo. Otro test reprodujo la aceptación de un título numérico con checksum
válido. La revisión independiente detectó la incompatibilidad con el validador
de Linocube: se añadió un test que falló por la propiedad nueva antes de corregirlo.
La segunda revisión no encontró incidencias pendientes en ese ajuste.

La integración ejecuta Payload con SQLite reales: captura «Release page», guarda
«Newer live title» en un borrador posterior y crea una propuesta. El contexto y
la comparación conservan «Release page»; la página y la captura no cambian al
crear/revisar la propuesta. Esto no acredita concurrencia de PostgreSQL ni un
flujo de edición con un modelo real.

## Comprobación final

Ejecutada el 5 de septiembre de 2026 tras corregir el contrato de Linocube:

- `npm --prefix owner-platform run check`: salida 0; **668 unitarias en 141
  archivos, 19 integraciones SQLite, lint, TypeScript y build**. Se limitó
  temporalmente Vitest a dos workers, restaurando la variable anterior después.
- `npx vitest run --config vitest.unit.config.ts`: **207 pruebas**, salida 0.
- `npm run check:public-boundary`: **20 entradas públicas**, salida 0.
- `npm run test:owner-isolation`: **8 pruebas**, salida 0. El mensaje fatal de
  Git corresponde al caso deliberado de checkpoint falso, no a un fallo del test.
- `npm run test:public-guards`: **11 pruebas**, salida 0.
- Revisión independiente completada y corrección de compatibilidad revisada.

El aviso de ausencia de adaptador de correo permanece. No se ha repetido aquí
la auditoría npm, el recorrido visual completo, Core Web Vitals ni una prueba
en PostgreSQL. No hay nuevos paquetes o lockfiles, ni despliegue. El checkpoint
protegido sigue apuntando a `0f0adf686b2752e23c25d224f8c60815b10fd451`.
