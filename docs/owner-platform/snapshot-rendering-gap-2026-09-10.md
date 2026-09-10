# Capturas históricas: retención no equivale a visualización

Fecha: 2026-09-10. Codex. Base: `474fc32`. Auditoría local, no despliegue.

## Evidencia

- `src/components/PagePreviewView.tsx` llama a `loadContentVisualPreview` por colección/documento, no por captura.
- `src/preview/visual-service.ts` obtiene las referencias de medios desde los documentos leídos actualmente. Este recorrido es una vista editorial del borrador, no un renderer de manifiestos históricos.
- `src/media/revision-storage-binding.ts` limita la lectura de revisiones al documento actual o a una versión autorizada del medio. Una referencia conservada exclusivamente por una captura no amplía ese permiso.
- `474fc32` prueba recuperación de bytes retenidos exclusivamente por captura y rechazo de sus URLs genéricas. No demuestra visualización de esa captura en el panel.

## Siguiente entrega acotada

Implementar y probar lectura privada vinculada a una captura concreta antes de conectarla a una vista histórica. Validar identidad owner, acceso a la captura, hash y procedencia persistida, pertenencia exacta de medio/revisión/archivo al manifiesto y bytes del almacenamiento. No aceptar una revisión arbitraria enviada por el cliente.

Mantener las URLs genéricas sin permisos adicionales. No sustituir un recurso histórico ausente por el recurso actual. Las capturas legacy sin revisión verificable deben mostrar una limitación explícita, no una reproducción supuestamente fiel.

Criterio de cierre posterior: sustituir imagen, retirar únicamente su versión de la BD sintética conservando la captura, recuperar respaldo y visualizar la imagen original desde la captura con owner; anónimo y referencias manipuladas siguen rechazados. Comprobar el recorrido en navegador antes de declararlo usable.

## Comprobación de esta auditoría

`node node_modules/vitest/vitest.mjs run src/components/PagePreviewView.test.tsx src/preview/visual-service.test.ts src/preview/manifest.test.ts`

Resultado nuevo: 40/40 pruebas, tres archivos, salida 0. No son pruebas de un renderer histórico nuevo. No se modificó runtime, diseño público, dependencias, datos reales ni infraestructura.

Hub: `023430dc-a448-4a8b-a00a-c94697c42897`, enviado a Claude; recepción o aceptación no inferidas. Próximo responsable: Codex, implementación y pruebas acotadas. El almacenamiento de objetos sigue sin activarse en producción.
