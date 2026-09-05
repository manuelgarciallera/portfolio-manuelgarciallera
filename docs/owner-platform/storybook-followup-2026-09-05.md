# Seguimiento de Storybook y CTA de borradores

Fecha: 2026-09-05. Base: `f8c29aa`. Complementa el informe competitivo del mismo día.

## Hallazgo reproducido

Después de los timeouts registrados en la auditoría, dos ejecuciones aisladas
de `CaseCard.stories.tsx` sí inicializaron Chromium. La configuración temporal
activaba ejecución serial y grabación HAR. Ambas ejecutaron Published y Draft:
Published pasó y Draft falló. Una ejecución general sin esa configuración
también llegó a ejecutar las tres historias: dos pasaron y Draft falló.
Por tanto, no se atribuye la inicialización exclusivamente al paralelismo.

El borrador con vista previa ofrecía «Ver caso de estudio» aunque su enlace
conducía a `/casos`. Se reforzó la prueba con el nombre accesible
«En preparación: Caso futuro» y la ausencia del CTA de publicado. La prueba
falló antes del cambio de implementación por no encontrar ese nombre.

## Cambio acotado

`CaseCard` selecciona una etiqueta según `published` y la reutiliza en el
nombre accesible, texto para lectores de pantalla y CTA hover. Para proyectos
publicados conserva «Ver caso de estudio», estructura, estilos y destino.
La portada filtra los casos no publicados. No se modifican CSS, dependencias,
lockfile, configuración permanente de pruebas, contenido publicado ni servidor.
La revisión independiente de los dos archivos no encontró incidencias.

## Verificación posterior

- Pruebas unitarias públicas: 207/207, 32 archivos, exit 0.
- Guardas públicas: 11/11; frontera de dependencias: 20 entradas correctas.
- Encoding, hero, tipografía en 8 perfiles, navegación, lint y tipos: correctos.
- Build de producción local: correcto; presupuesto de bundle de 9 rutas:
  correcto con la tolerancia existente de 1% o 2 KB.
- `check:all` termina exit 1 por el aviso moderado existente de `fflate`.
- Tras el cambio, tanto la ejecución general de Storybook como la ejecución
  de CaseCard con `--no-file-parallelism` agotaron la conexión inicial sin
  ejecutar casos. Esto no demuestra un fallo funcional del componente ni
  permite declarar que sus pruebas han pasado.
- La repetición aislada con configuración temporal serial y HAR sí pasó:
  Published y Draft, 2/2, exit 0, 66,07 segundos. Confirma la corrección bajo
  ese entorno; no resuelve la intermitencia del comando general. Se retiró
  la configuración temporal después de verificar, sin incorporarla al proyecto.

No se han aumentado los timeouts ni desactivado controles de accesibilidad.
Los avisos de calidad de imagen del adaptador Storybook no justifican cambiar
la configuración pública, que ya admite calidad 92. No se declara completada
una auditoría manual de accesibilidad ni una comparación visual en producción.
El checkpoint sigue apuntando a `0f0adf686b2752e23c25d224f8c60815b10fd451`.
No se ha desplegado.
