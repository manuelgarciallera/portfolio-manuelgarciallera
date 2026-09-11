# Etiquetas del editor de artículos — 2026-09-11

Base: `9931ad128f4da634f900c165caa1c0a74b176c11`. Reserva Hub:
`38391b79-da66-4d6e-8f0d-1a001e01b148`. Codex, solo CMS owner.

## Cambio

Articles.ts añade etiquetas españolas a campos y seis tipos de bloque.
El navegador crea el artículo por los nombres accesibles Título del artículo
y Resumen, y añade una Cita por sus etiquetas españolas. No cambian nombres
internos, slugs, tipos, relaciones, validadores, permisos ni valores guardados.
No hay migración, dependencia ni modificación del portfolio público.

## Evidencia

- RED `d004f5`: el formulario anterior no ofrece Título del artículo.
- GREEN: sesión 83766, cierre `6fb538`, salida 0. Build de producción,
  recorrido editorial a 390/1280, cita modular y vuelta al contenido clásico,
  guardado, recarga, preview privado, rechazo anónimo y conservación de dos
  artículos tras reiniciar la aplicación. También pasan recorridos de páginas,
  marcas, medios, encuadres y papelera. Datos sintéticos, PostgreSQL y Chromium.
- `npm test`, `d51617`: 1.301 pruebas / 170 archivos pasan; además pasa la
  prueba Node de recursos locales del editor.
- `check:public-boundary`, `3b43bc`: 21 entradas públicas verificadas.
- Typecheck y lint completos, sesión 86476 / cierre `df8d7f`: salida 0,
  sin diagnósticos de TypeScript ni ESLint.
- `git diff --check`, `1d387e`: sin errores; checkpoint resuelve al SHA
  protegido `0f0adf686b2752e23c25d224f8c60815b10fd451`.
- Revisión interna read-only del delta sin hallazgos importantes. No equivale
  a aceptación de Claude ni a evaluación con usuarios.

Docker utiliza checkout f0435bf con los dos archivos modificados superpuestos;
esta pasada no se presenta como checkout limpio del commit final. El proceso
cerró su aplicación y base sintéticas; inventario `1d387e` solo init/sleep.

## Límites y siguiente responsable

No es una traducción completa: opciones de tono y campos SEO compartidos siguen
pendientes. Tampoco certifica móvil físico, Safari, publicación del blog o nube.
La intermitencia anterior al guardar bloques permanece documentada en
`native-article-verification-2026-09-11.md`; una pasada correcta no explica su causa.
Codex continúa las puertas editoriales y operativas. Sin push ni despliegue.
