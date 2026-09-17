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

Commit/push `b74ad43` confirmado `8854c1`. Matriz final sobre build de producción: seis tamaños de escala y siete de encaje, ambos formatos de contacto sostenido/scroll, cuatro combinaciones tema/tamaño con WebGL/fallback/context-loss pasan (sesión81315, cierre `c14e46`). No despliegue CMS. Reserva Hub `b04ff7db-69b9-477f-8ad7-dda27752acc6`.

CI35192761976 validate+owner SUCCESS (`3129e2`). Producción `dpl_DrPwoSPz4c3h2geLdud56Mx9GgPc` READY y alias original (`08c349`); runtime `b74ad43`. LIVE escala seis tamaños PASS (sesión54780, último tamaño `350cb5`). Logs últimos cinco minutos sin entradas (`2abebf`), no garantía de ausencia de fallos cliente. Servidor propio3020 detenido. Rollback: runtime anterior `5df24e5`.

Revisión siguiente: Manuel compara el croquis en desktop y observa las nuevas gotas en su móvil; la fluidez física de Firefox Android sigue sin acreditarse por estas pruebas de Chromium.

LIVE contacto-scroll nativo emulado ±77px y resize continuo30draws/2,7827s PASS `cf7e45`, reloj avanza antes de soltar. Reserva liberada con entrega; no quedan procesos de pruebas propios abiertos.
