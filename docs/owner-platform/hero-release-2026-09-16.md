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

## Publicado y verificado

- Commit/push d5863932be95d15cf5ed6d55af720964ad4646c8 confirmado (68c906). Contiene esta optimización y conserva los cambios públicos anteriores.
- Preview dpl_HyZnzR6GZNBJum9XKxQqxcSWvssS READY; HTML privado verificado mediante Vercel CLI sin desactivar protección (e07f5b).
- GitHub Actions 35104846736 SUCCESS: validate y owner (7b8870). Presupuesto original verde en CI.
- Promoción autorizada ejecutada (8fef6b). Producción **dpl_4asVSijC1DZQzcUTa3zGkWfw4TB8**, READY, dominio **https://manuelgarciallera.com**, verificado con inspect (e3ccf3). No confundir ID del preview con ID final.
- Chromium contra el dominio real: desktop1280×720, hero720/CTA549,17; móvil390×844, CTA589,16/escena844; nombre HTML completo, sin desbordamiento horizontal. Capturas revisadas. Esfera de movimiento reducido cargada; móvil aparece al bajar. Aviso altura122desktop/206,25mobile (842667,181915).
- Cerrar sin elegir deja consentimiento nulo, cero solicitudes de seguimiento y cero errores JS en ambas sesiones. No se generan visitas analíticas de prueba adicionales.
- /admin, /admin/login, /api/users y /api/payload devuelven404 en producción: CMS no publicado.
- Logs de error del deployment, últimos15min: ninguna entrada (1c91f8). Drains no inspeccionados ni instalados; no certifica ausencia futura de errores.
- Limitación nueva: al repetir los 12 escenarios locales sobre la copia del build hubo timeout esperando imagen de esfera (191bc4/d68cc6). No se declara esa repetición aprobada ni se rebaja la espera. La comprobación directa en producción sí carga la imagen y pasa en ambos tamaños; las 12 pruebas anteriores de 5878665 permanecen históricas. No prueba física del móvil.
- Ventana automática de ocho horas pausada a las15:50 conforme a su límite; este despliegue responde a la petición directa posterior de Manuel.

Rollback público conocido: dpl_B3JukeQZyfm5uYtKe6JSYsHVKMnD (581a820, consentimiento ya implementado). No se ejecutó. Hito público cerrado; CMS y demás trabajo no se declaran completos.
