# Carrusel editorial aprobado — 2026-09-13

Manuel confirma el orden proyectos grandes → artículos y el cambio de CTA.
La sección ya ocupaba ese lugar en RedesignPage: no se duplica ni reordena el resto.

Implementación: ArticlesSection conserva sus cuatro artículos y portadas CSS,
pero usa desplazamiento horizontal nativo con tarjetas de portada 2:3. Texto
fuera de la imagen, ancho 31% desktop / 46% tablet / 86% móvil. RailControls
reutilizado con etiquetas para artículos; desplazamiento reducido ya respetado
por scrollRail. Sin nuevas dependencias ni imágenes descargadas.

CTA por destino: Ver proyectos (#casos), Ver proyecto (caso concreto), Leer
artículo (Investigación HCI); Ver contexto permanece para Sobre mí.

TDD: prueba nueva de conexión entre controles y región enfocables falla antes
del cambio (5b94ec), pasa después. Unitarias completas 233/233 en 38 archivos;
TypeScript y lint focal salida 0. No confundir HTML estático probado con
usabilidad visual comprobada. Revisión visual móvil/desktop y aprobación del
aspecto siguen pendientes; no se elude la denegación previa de navegación local.

Cambios públicos limitados a esta sección, CTA y parametrización de controles.
No toca hero/favicon, CMS ni datos. No hay despliegue en esta entrega.

`npm run check:all` termina con salida 0 (4706a3): 233 unitarias, 14 guardas,
frontera pública, encoding, estructura hero/navegación, tipos responsive, lint,
TypeScript, build de 29 páginas, presupuesto de 10 rutas y npm audit sin
vulnerabilidades conocidas. Se retiró solo `--use-system-ca` de NODE_OPTIONS
durante el comando por incompatibilidad del worker Node, restaurándolo al salir;
no se desactivó la validación TLS. No equivale a prueba visual ni auditoría
exhaustiva de seguridad.
