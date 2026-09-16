# Consentimiento: integración local, 16/09/2026

## Alcance y autoridad

Manuel pidió completar y pulir la implementación. Notificación Hub 8c2e709a: integración pública local asumida por Codex, sin inventar relevo aceptado por Claude. Sin publicación, push, gasto ni configuración remota. Conservados checkpoint y modificaciones ajenas.

## Implementado

- Layout monta tarjeta de consentimiento granular, con aceptar/rechazar equivalentes, detalles, cierre sin aceptar, preferencias persistentes y foco accesible. Claro/oscuro; 320/390/768/1440.
- Google G-SD9S08GHWS y Umami 7c0010a4-8f44-4340-8ee2-d8a7bda1152c inicialmente bloqueados; SDK sólo tras permiso, dominio canónico y ruta pública permitida. DNT/GPC, almacenamiento fallido y caducidad mantienen cierre seguro.
- Adaptadores cargados mediante importación diferida; vistas manuales sin búsqueda, fragmentos, títulos libres ni referrer. Sin publicidad ni Google Signals habilitados por este código.
- Revocar detiene envíos posteriores y elimina sólo mgl_ga/mgl_ga_SD9S08GHWS, sin recarga ni pérdida del formulario. No borra histórico remoto ni recupera solicitudes en tránsito.
- Eliminado cargador Umami incondicional y su prueba antigua (recuperables en Git). WebVitalsReporter sin montar; endpoint conservado, no afirmar datos WebVitals actuales.
- Privacidad actualizada, sin afirmar anonimato absoluto, exención Umami o certificación legal.
- No cambia el CMS ni conecta una API de analítica. Sus permisos y propiedad siguen siendo otro incremento.

## Evidencia

- `npm run test:unit`: 280/280, 43 archivos, incluida avería asíncrona de un proveedor sin detener el otro.
- ESLint focal de consentimiento, layout y privacidad: exit 0.
- `node scripts/check-public-boundary.mjs`: 22 entradas, exit 0.
- Next production build aislado `.owner-verification-builds/consent-release-20260916`: exit 0, TypeScript correcto, 30 páginas. Eliminadas sólo las inclusiones temporales que Next añadió a tsconfig.
- `node scripts/verify-analytics-runtime.mjs --real-sdk`: PASS con SDK oficiales; toda colección interceptada, sin visitas de prueba enviadas a las cuentas. Dos scripts, tres solicitudes de colección en esta ejecución. Comprueba permiso independiente, ausencia de tráfico previo, cookie real Google, vista no duplicada, saneamiento y retirada sin pérdida de formulario.
- `CONSENT_TEST_URL=http://localhost:3025 node scripts/verify-analytics-page.mjs`: PASS contra build de producción, cuatro anchuras, ambos temas, persistencia, foco y ausencia de seguimiento en host local. `node scripts/verify-analytics-consent.mjs`: PASS en las cuatro anchuras, ambos temas y casos de elección/almacenamiento/privacidad. Capturas locales en `.audit/analytics-consent-integrated/`; revisión visual de móvil oscuro realizada.

## Puertas de publicación pendientes — no ocultarlas

1. Medición mejorada GA4 desactivada: preguntado a Manuel, sin confirmación. Este código controla vistas, pero no puede certificar ajustes remotos de la propiedad.
2. Confirmar retención efectiva de eventos en ambas cuentas y completar información de privacidad con esos periodos. El texto distingue preferencias locales (180 días) e histórico remoto; no inventa ajustes de cuenta.
3. Presupuesto existente: comparación real FALLA sólo en `/privacidad` raw. Referencia 71.888 B/25.223 B gzip; actual 75.432 B/26.281 B gzip. Delta +3.544 B raw (límite +2.048), +1.058 B gzip (dentro del límite). Separar proveedores redujo +4.974 B raw inicial a +3.544 B. No se alteró baseline ni se proclama control de bundle verde. Optimizar más o aprobar expresamente revisión de presupuesto con esta comparación antes de publicar.
4. Autorización de publicación y comprobación posterior de recepción real. No desplegado en esta entrega.

## Fuentes revisadas

- AEPD: https://www.aepd.es/guias/guia-cookies.pdf
- Google desactivación: https://developers.google.com/tag-platform/security/guides/privacy
- Google configuración: https://developers.google.com/analytics/devguides/collection/ga4/reference/config
- Google retención: https://support.google.com/analytics/answer/7667196
- Umami: https://docs.umami.is/docs/tracker-configuration y https://docs.umami.is/docs/tracker-functions

Revisión técnica, no dictamen jurídico. Siguiente responsable: Codex para presupuesto; Manuel para ajustes de cuenta y publicación.
