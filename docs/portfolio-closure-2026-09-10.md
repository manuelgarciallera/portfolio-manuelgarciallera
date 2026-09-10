# Cierre funcional del portfolio — 10 septiembre 2026

Responsable de integración y publicación: Codex. Claude recibe evidencia por el
Hub `portfolio-profesional::portfolio-closure`; no hay dos escritores activos.

## Cambios acotados

- Hero: no carga una esfera de respaldo distinta antes de la escena. Alternativa
  estática con nombre completo para movimiento reducido y fallo de WebGL/carga.
- Nombre completo `Manuel García-Llera Añón`, rasterizado con la fuente computada
  del titular en una CanvasTexture. Sin descargar otra fuente. Conserva el texto
  dentro de la escena, una línea en escritorio y tres en móvil.
- Acabado claro en móvil; transmisión transparente en escritorio para no velar
  el nombre. No se sustituye el componente interactivo por una imagen estática.
- CasePreludeProgress: corregido el acceso a `IntersectionObserverEntry.target`.
  La sección activa ahora cambia al avanzar; prueba roja antes y verde después.
- Progreso de Buy&Sell: fondo estable y contraste independiente de la imagen.
- Pies de diagramas de Coordination Hub: se evita la herencia de estilos del pie
  exterior, que oscurecía texto sobre fondo negro en modo claro.
- Rails decorativos: mayor legibilidad manteniendo colores de cada proyecto.
  No se presenta este ajuste decorativo como obligación WCAG.

## Evidencia obtenida antes de publicar

- `check:all`: 224 unitarias, 14 pruebas de guardas, límites públicos, responsive,
  lint, TypeScript, build y presupuesto públicos verdes; auditoría pública con
  cero vulnerabilidades. Debe repetirse sobre el HEAD definitivo antes del push.
- CV: dos descargas, hash local idéntico, foco/teclado, 320/390/768/1440, claro y
  oscuro; acceso sin JavaScript. Los PDF no cargan antes de elegirlos.
- Carrusel horizontal: flechas desktop con clic/teclado y límites; desplazamiento
  nativo conservado en móvil/tablet.
- Navegación real: apertura, Escape, recuperación del foco, desbloqueo de scroll
  y transición a Proceso a 320/390/768/1440.
- Hero: 390/768/1440, una escena, cero overflow, sin invadir el titular.
  Pruebas independientes de movimiento reducido y WebGL no disponible.
- Sitemap: sus 15 rutas responden 200, incluidos cuatro artículos. Favicon,
  robots y manifest responden 200.
- Producción, prueba única de formulario identificada como QA: POST devuelve
  200 y `ok: true`. Confirma aceptación SMTP, no recepción en bandeja de entrada.

## Límites y siguiente cierre

Barrido automatizado completado: 11 rutas × 390/1440 × claro/oscuro, 44/44
combinaciones verdes sobre build de producción local con movimiento reducido.
Sin errores JS, overflow, imágenes rotas observadas ni violaciones axe detectadas.
Evidencia local: `tmp/portfolio-closure/audit.json`. El hero animado se verifica
aparte; los resultados anteriores no equivalen a comprobar WebGL en 44 escenarios.
Las capturas son Chromium emulado, no un teléfono físico ni una certificación
de accesibilidad. No se afirma ausencia universal de defectos.

Sin cambios de dependencias, DNS, correo, cuentas, pagos ni CMS. El owner sigue
siendo otra aplicación, no desplegada por la web pública. Su aviso de seguridad
de Payload sigue pendiente y no se ha relajado ninguna guarda.

Publicar solamente después de validar el HEAD exacto, conservando el despliegue
anterior. Registrar el SHA y el ID de Vercel en el Hub. Después: CMS seguro,
almacenamiento persistente y edición/publicación/restauración verificables.
