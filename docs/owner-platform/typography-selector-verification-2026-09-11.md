# Selector tipográfico: verificación

Base52d894b. Mejora acotada del formulario de perfiles de marca, no rediseño
del editor ni publicación. Se conservan campos string, validación y valores
personalizados; selector nativo con muestra del título/cuerpo. Sin paquetes,
fuentes descargadas, migración de esquema o cambios del portfolio.

## Implementación y fallos detectados

- RED49d278: la configuración no exponía el control visual; registrado para
  ambas familias conservando tipo text.
- Revisión independiente detecta que el selector debe respetar el disabled de
  useField durante procesamiento, además de readOnly. RED80620d demuestra el
  defecto; corregido y focal14/14 ab9242.
- Primer ensayo real falla aa4188: faltaba entrada en el importMap. Confirmada
  ausencia en el contenedor; generado con CLI Payload y secreto sintético
  efímero de proceso, sin credenciales reales. La primera CLI sin secreto fue
  rechazada por la guarda local, que no se debilitó.
- Ensayo real posterior4b944b pasa. Ampliado con POST de guardado retenido para
  comprobar disabled mientras espera; pasa7c0527. Revisión del arnés mejora
  recogida de errores/promesas y retirada de ruta y temporizador en finally.
- Repetición final del arnés ajustado2d7b86: salida0 y limpieza completa.

## Evidencia final

- Unitarias completas:1254/166,167,46s, salida0 d57a8f.
- Tipos y lint:6ebead0; lint posterior al ajuste del arnés3db01d0.
- Aislamiento del portfolio:8/8 salida0 8d30c1. El error Git de objeto ficticio
  forma parte de una prueba negativa. Sin nueva comparación visual del público,
  porque no se modifica ni se incorporan dependencias a él.
- Docker aislado, sin red externa, montajes o puertos expuestos: build y HTTPS
  real con PostgreSQL; selector actualiza campo, muestra, guarda y recarga a
  390/1280; guarda pendiente bloquea selector. Continúan pasando creación de
  páginas, teclado/orden, preview, subida/sustitución de medios privados y
  conservación tras reiniciar Next. Terminal2d7b86 salida0, app/clúster cerrados
  y raíz temporal retirada. No equivale a infraestructura de staging.
- Capturas sintéticas nuevas en .audit/owner-typography-390.png y
  .audit/owner-typography-1280.png, inspeccionadas: controles sin desbordamiento.
  Georgia no está disponible en ese contenedor y usa fallback; no se afirma
  que la muestra haya descargado o dibujado Georgia. El aviso lo explica.

## Alcance que sigue pendiente

Una segunda landing completa, su publicación/reversión, fuentes alojadas,
inspector de cajas y layout guiado no están implementados por este cambio.
No se acredita Safari, teléfono físico, contraste exhaustivo de temas ni
usabilidad con personas. El resto de integración PostgreSQL71 del incremento
anterior no se presenta como vuelto a ejecutar aquí. La recuperación real de
cuenta, datos y medios depende todavía del destino autorizado.

Investigación y propuesta de actualización/ecosistema separadas en
ecosystem-ui-and-updates-2026-09-11.md. Sin push ni despliegue.

## Seguimiento: formato del texto enriquecido

Basea6d5a2c. browser-second-page.mjs amplía el recorrido existente: seleccionar
texto y aplicar negrita/cursiva mediante teclado real, comprobar estilos computados,
guardar y recargar, verificar strong/em en preview sobre el contenido esperado.
El runner compara después el documento completo tras reiniciar la aplicación.

El primer ensayo6a785f falló por un selector de prueba incorrecto: Lexical combina
strong con clase de cursiva, no strong/em anidados (fuente instalada
Lexical.dev.mjs,getElementInnerTag/setTextThemeClassNames). Se corrigió la prueba,
no el editor. No se atribuye RED/GREEN de producto a esta ampliación.

Final30ac4c salida0,390/1280, borradores/marcas/medios y reinicio conservados;
app/clúster/raíz sintética cerrados. Lint focalc64be1 y diffcheck pasan. Revisión
independiente solo lectura sin hallazgos. No cambio runtime, dependencia ni UI;
unitarias1301 del incremento anterior no se presentan como repetidas aquí.
No acredita toolbar táctil, enlaces/listas/tablas, Safari, uso físico ni publicación.
