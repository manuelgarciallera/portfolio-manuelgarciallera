# Publicación del hero y aviso compacto — 16/09/2026

Manuel solicita explícitamente ver todos estos cambios en la URL original. Alcance: b218153 (nombre HTML y consentimiento compacto), 5878665 (viewport desktop/móvil y nombre menor), más optimización de privacidad. No se incluyen cambios compartidos sin commit ni se publica el CMS. Autoridad registrada en Hub 74728de5.

## Puertas previas

- Presupuesto RED real: privacidad +2456 B frente al límite +2048 B (8b70e5). GitHub CI 35103480555 confirma que era el fallo de validate (b9d3b0).
- El enlace de retorno de privacidad pasa de Next Link a HTML nativo: navegación completa deliberada, accesible también sin JavaScript. No se modifican textos legales, consentimiento ni dependencias. Excepción puntual y documentada a la regla lint de navegación SPA.
- Build de producción de 30 páginas y tipos correcto (ae0a49). Primer intento falló por descarga de Google Fonts; reintento correcto, sin sustituir fuente ni relajar la compilación.
- Presupuesto fresco GREEN, todas las rutas, baseline intacta (288cb2). Privacidad 65.476 B raw / 22.437 B gzip; antes 74.344 / 26.042. Ahorro 8.868 / 3.605 B. Home sin cambios: 138.318 / 50.545 B.
- 279 unitarias/43 archivos (1e21e1), lint y frontera pública22 (5cdf03) correctos.
- Navegación real de privacidad a home con y sin JavaScript PASS (670df3). El primer ensayo esperaba la carga de todos los recursos decorativos; se acota al documento cargado y H1 presente.
- Aviso integrado Next en cuatro anchos y ambos temas, persistencia/foco y ausencia de seguimiento local PASS (1c123f).
- SDK oficiales con colectores interceptados: opt-in, saneado de URL, retirada y navegación PASS (632743). El ensayo espera DOM/H1 en la navegación completa, no inactividad de las imágenes del hero; conserva todas las aserciones de consentimiento. Se corrige la limpieza para no ocultar fallos con callbacks posteriores al cierre.
- Hero: los 12 escenarios viewport y ocho WebGL/temas de 5878665 se conservan sin cambios de CSS/hero en esta optimización. Ver recibo hero-viewport-2026-09-16.md. No prueba física del móvil.

Publicación aún pendiente en este checkpoint documental. Próximo Codex: push explícito, comprobar preview/CI, promover y verificar el dominio. Rollback público conocido: dpl_B3JukeQZyfm5uYtKe6JSYsHVKMnD (581a820, consentimiento ya implementado).
