# Creación nativa de páginas: verificación del recorrido

Base e957411. La prueba anterior preparaba el borrador por API. Ahora
`owner-platform/tests/production/browser-editor.mjs` abre el formulario de alta,
rellena título/slug únicos, inserta dos bloques Portada mediante el selector
nativo y guarda con el botón de borrador. Las llamadas fetch del helper son
solo de lectura para contrastar lo persistido.

Contrato: el usuario puede comenzar un borrador sin perfil de marca, conservando
título, slug y contenido. Las reglas de publicación no se relajan. No se
modifica implementación productiva: es cobertura de comportamiento existente,
no un fallo corregido ni un ciclo RED/GREEN de una funcionalidad nueva.

La prueba continúa con edición, ordenación por teclado, guardado, recarga,
previsualización y comparación del documento tras reiniciar el proceso Next.
No se reinicia PostgreSQL ni el proveedor simulado.

## Evidencia

- Primer ensayo combinado `--browser-editor --object-media` pasa a 390/1280,
  incluyendo subida/reemplazo y privacidad de imágenes (`8194dc`); termina con
  salida 0 y limpieza de app/clúster/raíz (`092cad`).
- Revisión independiente estática sin bloqueadores. Recomienda reforzar que slug
  y ausencia de marca también se conservan después de editar.
- Lint salida 0 (`c3523b`), sintaxis Node y diffcheck sin errores.
- Comprobaciones finales de slug/marca añadidas; repetición combinada salida 0
  (`ad86fb`), editor nativo 390/1280 (`c8ad8b`), medios y reinicio correctos,
  app/clúster/raíz cerrados y limpiados. Tipos salida 0 (`9cdd59`), frontera
  pública 21 entradas (`47035e`), sintaxis/diffcheck finales (`cfd7da`).
- No se repiten unitarias completas: el único código modificado es el helper
  de este ensayo de navegador. Contenedor propio detenido al terminar.

## Límites

Se usa Chromium emulado con hasTouch en 390px, no un teléfono físico. El bloque
se selecciona con click y la ordenación se ejecuta con teclado: no acredita
gestos drag-and-drop. No prueba recorte, publicación real, restauración mediante
interfaz ni almacenamiento remoto. No hay cambios de diseño ni despliegue.
