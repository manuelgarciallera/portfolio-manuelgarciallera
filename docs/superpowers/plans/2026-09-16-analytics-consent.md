# Consentimiento de analítica por proveedor

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan in the existing coordinated checkout. Do not start another agent or change the shared branch.

**Goal:** Preparar consentimiento afirmativo, granular y revocable para el portfolio sin CMP externo.
**Architecture:** Política pura versionada; controlador de consentimiento con adaptadores de red; tarjeta React aislada; montaje Next sólo tras relevo de archivos compartidos. El rechazo es el estado seguro.
**Tech Stack:** React 19, TypeScript, CSS Modules, Vitest y Playwright ya instalados.
**Spec:** docs/superpowers/specs/2026-09-16-ga4-pilot-design.md, modificación aprobada del 16/09.

## Actualización de ejecución: integración local 16/09/2026

La instrucción posterior de Manuel «Hazlo todo y cerremos esto», tras explicar el relevo pendiente, autoriza completar la integración local. Notificada en Hub (8c2e709a); no equivale a aceptación de Claude ni a autorización de publicación. Los estados de ejecución aislada al final son históricos.

Montaje Next, sustitución del cargador anterior, adaptadores oficiales diferidos hasta consentimiento, retirada sin recargar ni perder formularios y actualización de privacidad implementados. WebVitalsReporter queda sin montar para no abrir otra recogida previa al consentimiento. No se implementa aquí el conector API del CMS.

Verificación final y puertas no resueltas: docs/owner-platform/analytics-consent-integration-2026-09-16.md. La publicación exige confirmar ajustes de medición mejorada/retención y resolver el presupuesto raw de /privacidad. No se certifica cumplimiento legal ni se afirma despliegue.

## Global Constraints

No publicación, gasto, secretos, nuevas dependencias ni cambios owner. No modificar layout/privacidad sin resolver relevo solicitado en Hub. Preservar checkpoint y cambios ajenos. No afirmar integración si sólo se prueba el módulo aislado. GA4 requiere verificar medición mejorada desactivada antes de habilitación real.

## Diseño visual

Reutilizar la familia de sistema y paleta del portfolio: negro #0a0a0a, blanco #f5f5f7, gris #a7a7ad, acento #5ec4c8; tema claro #ffffff/#1d1d1f. Texto alineado a izquierda, tarjeta con borde y radio moderado, sin nuevo tipo ni animación de entrada. Igual estilo y superficie táctil de 44px para aceptar/rechazar. En móvil limita altura y permite scroll interior; botón para cerrar sin cambiar elección. Preferencias persistentes en flujo normal, no otro flotante sobre Contacto.

## Tareas

- [ ] 1. Escribir src/lib/analytics-consent/policy.unit.test.ts antes de policy.ts: nulidad, formato, caducidad (180 días), fecha futura, selección por proveedor, almacenamiento inaccesible. Ejecutar `npm run test:unit -- src/lib/analytics-consent/policy.unit.test.ts`, observar rojo y luego verde.
- [ ] 2. Escribir controller.unit.test.ts antes de controller.ts: cero carga sin consentimiento, DNT/GPC/host, carga una vez, selección independiente, revocación, almacenamiento fallido, renovación de pestaña y rutas saneadas. Adaptadores inyectados sólo en frontera de proveedores; probar estado real del controlador.
- [ ] 3. Escribir ensayo navegador aislado antes de AnalyticsConsentCard.tsx/CSS: botones equivalentes, casillas inicialmente off, guardar/retirar, cierre sin aceptación, persistencia/reabrir, foco, tema y 320/390/768/1440. No depender de Google para verificar la elección. Integrar capa de almacenamiento con notificación storage/visibility y caducidad.
- [ ] 4. Tras relevo: sustituir UMAMI_BOOTSTRAP en layout; implementar/probar adaptadores oficiales con carga sólo tras consentimiento y una vista saneada por navegación; actualizar privacidad con inventario y retención reales; revisar WebVitals. Mientras esté pendiente, conservar la web actual y no presentar la tarjeta como activa.
- [ ] 5. Verificación: unitarias, tipos, lint focal, frontera pública, ensayo navegador y peso gzip del módulo aislado. Build/bundle global y SDK real son puertas posteriores al montaje. Registrar resultados y bloqueo exacto en recibo/REGISTRO/Hub, no inferir aprobación de Claude.

## Revisión propia

Separar control del consentimiento de SDK evita que una prueba con un proveedor simulado se venda como garantía sobre tráfico real. No se puede cerrar la parte pública mientras el cargador anterior siga activo. El primer incremento verificable es el módulo aislado con controlador y tarjeta; no una migración ni conector API.

## Ejecución 16/09/2026

Actualización posterior: tareas 1–5 implementadas y verificadas localmente; integración 4bcc32b y responsive f54fc6d. La petición posterior de Manuel incluye dejarlo listo para recoger visitas. Presupuesto y configuración remota resueltos; la publicación queda pendiente de acceso al proyecto Vercel, no de claves de analítica. Estado canónico y evidencias actuales: docs/owner-platform/analytics-consent-release-2026-09-16.md. Los párrafos siguientes conservan el historial, no el estado vigente.

- Tareas 1 y 2 implementadas y verificadas; 23 pruebas. Tarea 3 implementada como componente aislado más lifecycle compartido; 2 pruebas adicionales de caducidad y eventos, ensayo navegador verde.
- Tarea 4 pendiente: solicitudes de relevo ca92fc43 y 008574fe sin confirmación observada. No se han editado layout, cargador anterior, WebVitals ni privacidad. Adaptadores reales, borrado selectivo de cookies, descarga del runtime y wrapper Next pendientes; no afirmar seguimiento consentido en producción.
- Tarea 5 parcial: 286 unitarias/44 archivos, tipos, lint focal, frontera pública22 y navegador aislado pasan. No build global nuevo ni medición de incremento real de bundle: el módulo todavía no está montado. Recibo detallado: docs/owner-platform/analytics-consent-isolated-2026-09-16.md.
