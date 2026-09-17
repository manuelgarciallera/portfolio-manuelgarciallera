# Hero desktop y gotas dispersas · 17/09/2026

Petición y aprobación directa de Manuel: ampliar figura/nombre desktop según croquis, conservar tamaño móvil y añadir cuatro gotas pequeñas separadas en ambos formatos. Iteraciones recuperables en Git. Base: `1f8337a`.

## Implementación

- Escena desktop pasa de cuatro a seis unidades del H1, limitada por viewport; aprovecha 48 px del espacio disponible a la izquierda sin mover el titular ni CTA. Nombre mayor, una línea en desktop ancho y composición previa en estrecho. CSS móvil intacto.
- Cuatro gotas adicionales mediante intersecciones analíticas rayo/esfera, fuera del bucle costoso de distancia de la superficie. Movimiento suave, pigmento compartido, cobertura subpíxel. Conserva cinco gotas originales y las protuberancias conectadas.
- Cuatro alternativas estáticas regeneradas con el renderer real para ambos temas/tamaños. No dependencias, listeners, bucle temporal ni límites de resolución nuevos.

## Evidencia

- RED gotas `17b507`: cero grupos nuevos. GREEN `3f7fce`: cuatro grupos visibles adicionales en seis combinaciones de tiempo/zoom; cuerpo central idéntico. Coste mediano agregado software +7,54%; no equivale a FPS/batería Android ni permite afirmar coste cero.
- RED tamaño `19012b`; encaje intermedio detectó solapamiento 1440 px (`4f63d7`), corregido reduciendo ampliación lateral 64→48 px. Matriz final en curso.
- 274 unitarias / 43 archivos PASS `db239b`; lint/diff PASS `9b92d6`; build final 30 rutas y tipos PASS `2e1ef1`; presupuesto original PASS `84eb8b` sobre build aislado.
- Scroll táctil nativo Chromium emulado ±77 px y resize continuo PASS `81b3ea`. No reproduce ni acredita Firefox Android físico.
- Algunos ensayos de navegador caducaron durante desarrollo/recompilación; no contabilizados como PASS. Se repiten sobre servidor de producción reiniciado.

Pendiente antes de publicar: cierre matriz visual/interacciones, commit/push, CI y verificación dominio. No CMS publicado. Reserva Hub `b04ff7db-69b9-477f-8ad7-dda27752acc6`.
