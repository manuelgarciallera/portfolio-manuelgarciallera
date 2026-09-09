# Hero: una esfera y nombre HTML

Base: `57148f0`. Integración exclusiva Codex; Claude revisa/proporciona propuestas por Hub. No publicación en este turno.

## Cambio

El hero conserva la imagen clara elegida por Manuel y su movimiento CSS suave. Ya no sustituye esa imagen por la esfera WebGL oscura. Nombre completo `Manuel García-Llera Añón` en HTML con la misma pila y peso de títulos, disponible sin JavaScript y sin fuente descargada adicional. Reduced motion desactiva el movimiento. La escena WebGL anterior se conserva en su archivo y en Git, pero deja de importarse desde Hero. Esto elimina su refracción interactiva del hero; no se presenta una imagen animada por CSS como render 3D vivo.

## Evidencia

- TDD: dos pruebas de render fallaron por ausencia del nombre HTML; tras implementación pasan.
- Vitest independiente: 224/224, 37 archivos.
- `check:all`: unitarias, 14 public guards, boundary, encoding, hero, responsive, lint (un warning por `_props` sin usar), tipos, build y bundle pasan. **Salida final 1 por auditoría de seguridad**, no es verde completo.
- Auditoría: Next 16.2.11 crítico (`GHSA-p293-qw3h-jr36`, `GHSA-2xp9-vwfh-vxw4`), Sharp 0.35.3 alto (`GHSA-rgj7-g3m4-5g8c`). No se ejecutó audit fix --force. Actualización validada pendiente antes de push/deploy.
- Prueba navegador inicial detectó recorte del nombre en tablet. Corregida relación de aspecto fija del contenedor para contenido HTML.
- Build final y presupuesto de 10 rutas: salida 0, sin ampliar baseline.
- `node scripts/check-single-hero.mjs`: 8/8 combinaciones, 320/390/768/1440 con movimiento normal/reducido. Una imagen, cero canvas en hero, nombre completo dentro del marco, misma familia de fuente que h1, overflow 0, sin pageerrors. Capturas en `tmp/single-hero`, no versionadas. Inspección visual 320/768/1440.
- Navegador Chromium emulado sobre servidor local de producción: no móvil físico ni prueba en producción. No se afirma mejora de Core Web Vitals a partir de este ensayo.

## Continuidad

Publicación detenida por puerta de seguridad. Próximo responsable Codex: verificar parches de Next/Sharp y compatibilidad, repetir check:all y Vitest, comprobar candidato, commit/push/publicación y verificar dominio. Claude informado en `ea8ec690-71a8-48f4-b3ea-7321b333f3c4`. No tocar docs compartidos sucios ni trasladar datos del CMS.
