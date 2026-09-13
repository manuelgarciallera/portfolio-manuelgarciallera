# Galería de proyectos: ajuste desktop

Solicitud de Manuel sobre captura del carrusel visual, no del blog.
Base c9e4c12. Solo VisualGallery, su CSS y prueba existente.

- Desktop desde 1024px: tarjetas 28% en lugar de 34% (el antiguo tramo
  1024–1200 usaba 46%); tipografía proporcionada a la reducción.
- Tablet 761–1023: 46%; móvil hasta 760: 84%, tipografía móvil conservada.
- `sizes` de imágenes sincronizado con breakpoints/ancho.
- Controles circulares al pie del carrusel, sin duplicarlos. Se reutiliza
  RailControls, también usado por artículos, conservando scroll táctil y barra.

Prueba de navegación al pie RED09e986; GREEN650ea0: seis pruebas de galerías
y artículos, TypeScript y diffcheck salida0. No nuevo build/budget en este
ajuste: el check:all del commit anterior no se presenta como prueba de éste.
Revisión visual pendiente; sin despliegue. No se toca hero, favicon o CMS.
