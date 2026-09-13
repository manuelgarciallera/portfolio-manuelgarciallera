# Comprobación pública prioritaria · 14 septiembre 2026

Codex, 00:18 Europe/Madrid. Revisión de producción, no localhost. HEAD local 20205f6; esta revisión no cambia runtime ni despliega el CMS.

- Portada cargada de nuevo en `https://manuelgarciallera.com/`: título «Manuel García-Llera Añón | UX/UI y sistemas de diseño».
- Viewport emulado 1440 × 1000: captura inspeccionada con esfera blanca y nombre debajo en tres líneas, Manuel / García-Llera / Añón. Apellido compuesto sin corte. Ancho DOM 1425 frente a viewport 1440.
- Click real en Contacto de navegación: URL termina en #contacto. Tras finalizar desplazamiento, sección a y=119,825 del viewport; scrollY=12439,20. No se envió formulario ni se probó entrega de correo.
- Caso Buy&Sell publicado, viewport 390 × 844: siete iconos inspeccionados visualmente en dos filas (4+3). Contenedor clientWidth=scrollWidth=342, flex-wrap=wrap; hijos dentro del ancho disponible. Sin barra horizontal en ese stack.
- Viewport temporal restaurado. Las capturas completas pueden contener artefactos de composición/lazy loading; no se usan para certificar todas las secciones.

Alcance: estos tres síntomas, navegador Chromium emulado; no móvil físico, todas las rutas, todos los tamaños ni garantía de cero errores. No se ha hecho push ni despliegue en esta comprobación. La ventana de continuación se amplía por la nueva solicitud del usuario hasta las 08:20 Madrid, condicionada a disponibilidad del host y la aplicación.
