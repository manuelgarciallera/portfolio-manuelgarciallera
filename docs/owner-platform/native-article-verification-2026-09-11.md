# Artículos: autoría nativa y persistencia

Base c4522be. Ampliación de pruebas, no funcionalidad nueva ni rediseño.

## Recorrido

El owner crea un artículo desde el formulario real: título, slug único, resumen
y cuerpo Lexical clásico. Guarda como borrador, modifica el cuerpo con un
segundo guardado, recarga y verifica los campos y el texto modificado. Abre la
vista previa privada y comprueba título, resumen y cuerpo, sin overflow
horizontal a390/1280. El runner lee los dos documentos, reinicia Next con PID
distinto y compara cada documento completo. No hay POST/PATCH de preparación
para la autoría de artículos; las peticiones posteriores solo verifican.

La colección conserva controles owner y borradores existentes. Este incremento
no publica artículos ni activa el blog público. La ausencia de acceso anónimo
es un contrato cubierto por otras pruebas, no un nuevo resultado específico
de este recorrido de navegador.

## Evidencia

- Primer ensayo de creación/recarga/preview y reinicio:4184ee salida0; ambas
  resoluciones, dos artículos, seis páginas, dos marcas, dos encuadres y medios
  privados conservados. App/clúster cerrados y raíz sintética retirada.
- Revisión independiente read-only sin hallazgos. Señala correctamente que no
  se ha añadido una prueba anónima específica de artículos.
- El segundo guardado inicial falló por una carrera del arnés: Enter se enviaba
  antes del estado modified de Payload. Diagnóstico628145: ninguna petición,
  texto modificado con saltos adicionales y botón habilitado posteriormente,
  sin errores de campo. SaveDraftButton instalado rechaza guardar mientras
  modified sea falso. La prueba ahora espera explícitamente botón habilitado
  antes de Enter; no se cambia el producto ni se introduce una pausa fija.
  Repetición final e388b8 salida0: crear/editar/recargar/preview a390/1280 y
  los dos documentos completos tras reinicio. Páginas/marcas/encuadres/medios
  siguen pasando; app/clúster cerrados y raíz sintética retirada.
- Lint focal final503830 y diffcheck pasan. Suite1301 del incremento anterior
  no se presenta como repetida aquí: este incremento solo cambia el arnés HTTP
  y se ha ejecutado completo. No se detectó un defecto runtime en artículos.

Entorno: Docker aislado sin red externa/montajes/puertos; Next producción,
PostgreSQL16 y Chromium. Archivo base8bd695e con overlays explícitos, no checkout
limpio del HEAD final. Datos sintéticos. No móvil físico/Safari ni evaluación
con usuarios; no cubre lienzo modular de artículos, galerías, portada, SEO ni
publicación del blog. Esas puertas se mantienen abiertas. Sin push/despliegue.
