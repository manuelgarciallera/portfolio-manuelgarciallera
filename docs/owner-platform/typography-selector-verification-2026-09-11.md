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
