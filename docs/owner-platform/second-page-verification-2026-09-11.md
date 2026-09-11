# Segunda página: verificación editorial aislada

Base: 27824c8. Entorno Docker aislado owner-editor-6dc5c51-0911,
PostgreSQL 16, Chromium, configuración y contenido sintéticos. Sin despliegue.

## Evidencia

- Ensayo 81199, salida c96976: POST400, contenido requerido del bloque 2 vacío.
- Diagnóstico 12667, salida a98cbd: texto enviado, pero editor identificado como
  layout.0.body. La prueba usaba el último editor montado antes de que Lexical
  cargara el nuevo campo. No era prueba de pérdida de contenido del producto.
- Corrección QA: esperar el campo exacto layout.1.content, sin esperas arbitrarias
  ni cambios en validadores/runtime. Se conserva diagnóstico acotado a datos
  sintéticos cuando el guardado falla.
- Ensayo 75013, salida 6e4024, exit0:
  `node scripts/test-production-http.mjs --browser-editor --object-media`.
  Creación nativa de segunda página a390/1280, portada y texto enriquecido,
  perfil de marca distinto, fuente serif y fondo renderizados, sin overflow;
  relectura del primer documento idéntica. También pasan los recorridos existentes
  de login, edición/reordenación/guardado/preview y recuperación de borrador tras
  reinicio, subida/reemplazo de medios y acceso privado.
- ESLint de ambos archivos QA: 256470 exit0. node --check y git diff --check0.
- Capturas .audit/owner-second-page-390.png y -1280.png revisadas visualmente.
- Revisión independiente review_typography_control sin nuevos hallazgos; solo
  lectura, sin builds paralelos. Confirma los límites descritos abajo.

## Límites y siguientes hitos

El perfil de marca se prepara por API autenticada como fixture; la página sí se
crea mediante el formulario real. No es un segundo sitio publicado, no demuestra
tenencia múltiple, y la prueba de reinicio existente conserva la primera página,
no verifica explícitamente la segunda. La vista editorial no es la UI comercial
definitiva ni una comprobación de animaciones públicas.

El selector nativo de relación se localiza dentro de #field-brandProfile: falta
auditar/corregir su nombre accesible, no ocultar esta limitación con el selector.
Siguiente: ampliar recuperación de segunda página y completar puertas operativas
del CMS antes de trabajo visual grande. Git privado aún pendiente de autorización.

## Continuidad

Automatización existente actualizada hasta13:32UTC del11/09, cada30min, sin
despliegues, push público ni sondeos duplicados; su ejecución depende del host.
Hub32013d0d comunica diagnóstico y reserva, no aceptación inferida.
