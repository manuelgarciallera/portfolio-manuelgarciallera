# Errores de validación editorial: corrección verificada localmente

Base `17ebea6`, reserva c8751ce0 y ampliación 76255150. Codex único escritor.
Prueba añadida: guardar artículo con título y cuerpo pero sin resumen; exigir
mensaje visible y asociado al campo, datos conservados y guardado correcto
después de completar el resumen. Sin publicación ni datos reales.

## RED reproducido

Ensayo completo sesión73758, salida674ed2, código1: el formulario genera
`Este campo es obligatorio.` en aside.field-error.tooltip--show, pero queda
oculto a390px. Fuente instalada de Payload3.88: Tooltip/index.scss aplica
display:none en mid-break a todos los tooltips; FieldError utiliza Tooltip.
El proceso cerró aplicación/clúster y retiró su raíz sintética.

## Corrección candidata

owner-shell.css conserva `.field-error.tooltip` dentro del flujo de formulario
privado, visible en móvil, permitiendo salto de línea y sin caret superpuesto.
No se cambia la visibilidad de tooltips genéricos ni estilos públicos.
Todavía en comprobación: la prueba también exigirá aria-invalid y asociación
del mensaje. No se da el recorrido por verificado hasta cerrar ambas puertas.
No hay cambios en validadores, datos o permisos. Diffcheck00884d pasa.

## Verificación y revisión intermedia

- Segundo RED `f6abbc`: el mensaje ya se ve a390, pero aria-invalid es null.
- Adaptador beforeInput `FieldErrorBinding` solo en resumen de Artículos;
  importMap regenerado. Asocia el mensaje nativo, no reemplaza validación.
- GREEN inicial `f639e8`, cierre `9f29f4`, salida0: build de producción,
  recorrido390/1280, texto conservado tras validación, guardado, preview,
  privacidad y reinicio. Entorno d004d7c con overlays, no checkout limpio.
- Capturas locales `.audit/owner-form-error-390.png` y1280. Inspección390:
  error visible encima del resumen, sin solapamiento ni overflow horizontal.
- Typecheck `ddc14d` y lint focal `dc7f6f` pasan. Unitarias `8a3e91`:
  1299 pasan y2 omitidas en170 archivos; no presentar1301 como1301 ejecutadas.
- Revisión read-only detecta P2: limpieza de aria-describedby por igualdad
  completa conserva un token huérfano si upstream añade otra descripción.
  Añadida regresión de mismo montaje: ayuda adicional, corregir resumen,
  desaparición del error sin navegación y conservación de ayuda upstream.
  RED `baf94e`, salida1: falla exactamente la referencia huérfana después
  de corregir el campo sin navegar. Limpieza cambiada a retirar solo el token
  añadido, conservando los demás. Segunda revisión read-only sin nuevos
  bloqueadores; no es aprobación de Claude.
- Hub reserva ampliada `6dcd8ff3-62ec-4635-a552-5c95749c470e` enviada,
  no equivale a aceptación de Claude. Web pública y checkpoint intactos.
- Tipos finales `7393ee`, lint `ba047e` y frontera pública `436a70`
  (21 entradas) pasan. Guardas públicas `ad867b`:14/14.

## GREEN final y límites

`a3fec8`, cierre `7e9567`, salida0: recorrido completo a390/1280 pasa,
incluida corrección de resumen sin navegación, retirada del token propio y
conservación de descripción upstream. Texto clásico y bloques, imágenes,
privacidad e información tras reiniciar la aplicación siguen pasando.
Las capturas390/1280 inspeccionadas muestran mensaje legible sin cubrir campo.
Unitarias repetidas tras la corrección final: `e9886d`, salida0,
1299 pasan y2 omitidas /170 archivos; prueba de activos locales también pasa.

No cambios de esquema, permisos, dependencias o web pública. El binding ARIA
se aplica únicamente al resumen del artículo, no garantiza todos los campos
del CMS. No prueba física de móvil, lector de pantalla real, tema oscuro ni
proveedor cloud. Build con overlays sobre d004d7c y dependencias existentes,
no instalación limpia. Próximo Codex: continuar las puertas editoriales y de
operación pendientes; no activar publicación ni interpretar esto como CMS
comercial terminado. Revertir el commit propio restaura el comportamiento
anterior sin migración de datos.
